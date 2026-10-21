"""Builds opening repertoire trees from the Lichess opening explorer and Stockfish.

Usage:
    LICHESS_TOKEN=... STOCKFISH=path/to/stockfish python tools/build-tree.py            # every missing tree
    ... python tools/build-tree.py --only evans,ruy --force --jobs 4

Trees are listed in tools/trees.json: { file, root (SAN moves), side ('w'|'b'), prefer [SAN...] }.
Output: public/openings/trees/<file>.json (format documented in src/opening-tree.js).

- Opponent moves: the most played replies by club players (Lichess games, 1400-2000, blitz to
  classical), each with its share and score.
- Our moves: the first move of `prefer` (the repertoire) that is legal and within PREFER_TOL of the
  best; otherwise the most played move among those within NEAR_BEST of Stockfish's best.
- Every node stores the evaluation (from our point of view) and, for opponent moves, how much the
  move lost compared with the best one, to flag inaccuracies and mistakes.
- A line never ends on the opponent's move: leaves get our best reply.

The explorer needs a personal Lichess token (no scopes). Responses are cached in .cache/.
"""
import argparse, json, os, subprocess, sys, time, urllib.error, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
import chess, chess.engine

EXPLORER = 'https://explorer.lichess.ovh/lichess'
PARAMS = {'variant': 'standard', 'speeds': 'blitz,rapid,classical', 'ratings': '1400,1600,1800,2000', 'moves': 12}
MIN_SHARE = 0.04       # opponent replies played at least this often
MAX_REPLIES = 4
MIN_GAMES = 400        # stop where positions become rare...
MIN_REL = 0.003        # ...or below this share of the games at the root
MAX_DEPTH = 18         # plies after the root
NEAR_BEST = 25         # our move: popular move accepted if within this many centipawns of the best
PREFER_TOL = 50        # repertoire move accepted if within this many centipawns of the best
TIME = float(os.environ.get('TREE_TIME', 1.0))
THREADS = int(os.environ.get('THREADS', 6))

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '..', '.cache', 'explorer')
OUT = os.path.join(HERE, '..', 'public', 'openings', 'trees')
os.makedirs(CACHE, exist_ok=True)
os.makedirs(OUT, exist_ok=True)


def explore(board):
    key = board.fen().replace('/', '_').replace(' ', '+')
    path = os.path.join(CACHE, key + '.json')
    if os.path.exists(path):
        try:
            return json.load(open(path))
        except ValueError:
            pass
    url = EXPLORER + '?' + urllib.parse.urlencode({**PARAMS, 'fen': board.fen()})
    req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + os.environ['LICHESS_TOKEN']})
    for attempt in range(8):
        try:
            data = json.load(urllib.request.urlopen(req, timeout=30))
            break
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(60)
                continue
            raise
        except (urllib.error.URLError, TimeoutError):
            time.sleep(10)
    else:
        raise RuntimeError('explorer unavailable')
    tmp = path + '.tmp%d' % os.getpid()
    json.dump(data, open(tmp, 'w'))
    os.replace(tmp, path)
    time.sleep(0.4)
    return data


def total(m):
    return m['white'] + m['draws'] + m['black']


class Builder:
    def __init__(self, side, prefer):
        self.us = chess.WHITE if side == 'w' else chess.BLACK
        self.prefer = prefer
        self.engine = chess.engine.SimpleEngine.popen_uci(os.environ.get('STOCKFISH', 'stockfish'))
        self.engine.configure({'Threads': THREADS, 'Hash': 512})
        self.nodes = 0
        self.root_games = None
        self.root_ply = 0

    def score(self, info):
        return info['score'].pov(self.us).score(mate_score=10000)

    def evals(self, board, n=5):
        infos = self.engine.analyse(board, chess.engine.Limit(time=TIME), multipv=n)
        return [(i['pv'][0], self.score(i)) for i in infos if i.get('pv')]

    def eval_move(self, board, move):
        info = self.engine.analyse(board, chess.engine.Limit(time=TIME), root_moves=[move])
        return self.score(info)

    def stats(self, m):
        n = total(m)
        win = m['white'] if self.us == chess.WHITE else m['black']
        return {'g': n, 'w': round(100 * win / n), 'd': round(100 * m['draws'] / n)}

    def our_move(self, board, data):
        evals = self.evals(board)
        best = evals[0][1]
        ev = {m.uci(): s for m, s in evals}
        for s in self.prefer:
            try:
                move = board.parse_san(s)
            except ValueError:
                continue
            score = ev.get(move.uci())
            if score is None:
                score = self.eval_move(board, move)
            if score >= best - PREFER_TOL:
                return move, score
        popular = {m['uci']: total(m) for m in data['moves']} if data else {}
        near = [u for u, s in ev.items() if s >= best - NEAR_BEST]
        pick = max(near, key=lambda u: popular.get(u, 0)) if near else evals[0][0].uci()
        return chess.Move.from_uci(pick), ev.get(pick, best)

    def build(self, board):
        """Children of the position (list of nodes)."""
        depth = board.ply() - self.root_ply
        if depth >= MAX_DEPTH or board.is_game_over():
            return []
        data = explore(board)
        games = total(data)
        if self.root_games is None:
            self.root_games = games
        if games < max(MIN_GAMES, MIN_REL * self.root_games):
            return []
        self.nodes += 1
        if board.turn == self.us:
            move, score = self.our_move(board, data)
            node = {'s': board.san(move), 'u': move.uci(), 'e': score}
            m = next((x for x in data['moves'] if x['uci'] == move.uci()), None)
            if m:
                node.update(self.stats(m))
            board.push(move)
            kids = self.build(board)
            board.pop()
            if kids:
                node['c'] = kids
            return [node]
        # opponent: the most played replies
        best = self.evals(board, 1)[0][1]
        replies = [m for m in data['moves'] if total(m) / games >= MIN_SHARE][:MAX_REPLIES]
        out = []
        for m in replies:
            move = chess.Move.from_uci(m['uci'])
            san = board.san(move)
            board.push(move)
            if board.is_game_over():
                score = self.score(self.engine.analyse(board, chess.engine.Limit(depth=1)))
            else:
                score = self.evals(board, 1)[0][1]
            # loss = how much better it is for us than after the opponent's best reply
            node = {'s': san, 'u': m['uci'], 'e': score, 'p': round(100 * total(m) / games, 1),
                    'l': max(0, score - best), **self.stats(m)}
            kids = self.build(board)
            if not kids and not board.is_game_over():
                reply, rscore = self.our_move(board, None)
                kids = [{'s': board.san(reply), 'u': reply.uci(), 'e': rscore}]
            board.pop()
            if kids:
                node['c'] = kids
            out.append(node)
        return out


def build_one(spec):
    board = chess.Board()
    for s in spec['root']:
        board.push_san(s)
    b = Builder(spec['side'], spec.get('prefer', []))
    b.root_ply = board.ply()
    t0 = time.time()
    try:
        kids = b.build(board)
    finally:
        b.engine.quit()
    tree = {'root': spec['root'], 'side': spec['side'], 'c': kids}
    path = os.path.join(OUT, spec['file'] + '.json')
    json.dump(tree, open(path, 'w'), separators=(',', ':'))
    print(f"{spec['file']}: {b.nodes} positions in {time.time() - t0:.0f}s", flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', help='comma-separated tree files')
    ap.add_argument('--force', action='store_true', help='rebuild existing trees')
    ap.add_argument('--jobs', type=int, default=1)
    ap.add_argument('--one', help=argparse.SUPPRESS)  # internal: build a single spec (JSON)
    a = ap.parse_args()
    if a.one:
        return build_one(json.loads(a.one))
    specs = json.load(open(os.path.join(HERE, 'trees.json'), encoding='utf-8'))
    for s in specs:
        s['root'] = s['root'].split() if isinstance(s['root'], str) else s['root']
    if a.only:
        wanted = set(a.only.split(','))
        specs = [s for s in specs if s['file'] in wanted]
    if not a.force:
        specs = [s for s in specs if not os.path.exists(os.path.join(OUT, s['file'] + '.json'))]
    print(f'{len(specs)} trees to build', flush=True)

    def run(spec):
        r = subprocess.run([sys.executable, '-I', __file__, '--one', json.dumps(spec)], capture_output=True, text=True)
        print(r.stdout.strip() or f"{spec['file']}: FAILED\n{r.stderr[-2000:]}", flush=True)

    with ThreadPoolExecutor(a.jobs) as ex:
        list(ex.map(run, specs))


if __name__ == '__main__':
    main()
