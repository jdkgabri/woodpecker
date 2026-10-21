"""Builds an opening repertoire tree from the Lichess opening explorer and Stockfish.

Usage:
    LICHESS_TOKEN=... STOCKFISH=path/to/stockfish python tools/build-tree.py "e4 e5 Nf3 Nc6 Bc4 Bc5 b4" w out.json

- Opponent moves: the most played replies by club players (Lichess games, 1400-2000, blitz to
  classical), each with its share and score.
- Our moves: the best move according to Stockfish; when several are within a few centipawns,
  the most popular one (the natural move) is preferred.
- Every node stores the evaluation (from our point of view) and how much the move lost
  compared with the best one, to flag inaccuracies and mistakes.

The explorer needs a personal Lichess token (no scopes). Responses are cached in .cache/.
"""
import json, os, sys, time, urllib.parse, urllib.request
import chess, chess.engine

EXPLORER = 'https://explorer.lichess.ovh/lichess'
PARAMS = {'variant': 'standard', 'speeds': 'blitz,rapid,classical', 'ratings': '1400,1600,1800,2000', 'moves': 12}
MIN_SHARE = 0.04       # opponent replies played at least this often
MAX_REPLIES = 4
MIN_GAMES = 400        # stop where positions become rare...
MIN_REL = 0.003        # ...or below this share of the games at the root
MAX_PLY = 26           # absolute ply limit (move 13)
NEAR_BEST = 25         # our move: popular move accepted if within this many centipawns of the best
TIME = 1.5

CACHE = os.path.join(os.path.dirname(__file__), '..', '.cache', 'explorer')
os.makedirs(CACHE, exist_ok=True)


def explore(board):
    key = board.fen().replace('/', '_').replace(' ', '+')
    path = os.path.join(CACHE, key + '.json')
    if os.path.exists(path):
        return json.load(open(path))
    url = EXPLORER + '?' + urllib.parse.urlencode({**PARAMS, 'fen': board.fen()})
    req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + os.environ['LICHESS_TOKEN']})
    for attempt in range(5):
        try:
            data = json.load(urllib.request.urlopen(req, timeout=30))
            break
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(60)
                continue
            raise
    json.dump(data, open(path, 'w'))
    time.sleep(0.4)
    return data


def total(m):
    return m['white'] + m['draws'] + m['black']


class Builder:
    def __init__(self, side):
        self.us = chess.WHITE if side == 'w' else chess.BLACK
        self.engine = chess.engine.SimpleEngine.popen_uci(os.environ.get('STOCKFISH', 'stockfish'))
        self.engine.configure({'Threads': 8, 'Hash': 1024})
        self.nodes = 0
        self.root_games = None

    def evals(self, board, n=5):
        infos = self.engine.analyse(board, chess.engine.Limit(time=TIME), multipv=n)
        return [(i['pv'][0], i['score'].pov(self.us).score(mate_score=10000)) for i in infos if i.get('pv')]

    def score_stats(self, m):
        n = total(m)
        win = m['white'] if self.us == chess.WHITE else m['black']
        loss = m['black'] if self.us == chess.WHITE else m['white']
        return {'games': n, 'win': round(100 * win / n), 'draw': round(100 * m['draws'] / n), 'loss': round(100 * loss / n)}

    def build(self, board, ply):
        """Children of the position (list of nodes)."""
        if ply >= MAX_PLY or board.is_game_over():
            return []
        data = explore(board)
        games = data['white'] + data['draws'] + data['black']
        if self.root_games is None:
            self.root_games = games
        if games < max(MIN_GAMES, MIN_REL * self.root_games):
            return []
        evals = self.evals(board)
        best = evals[0][1] if evals else 0
        ev = {m.uci(): s for m, s in evals}
        self.nodes += 1
        print(f'{self.nodes:4} ply {ply:2} games {games:8} {board.fen()}', flush=True)
        if board.turn == self.us:
            # our move: best by engine, natural (most played) among the near-best
            popular = {m['uci']: total(m) for m in data['moves']}
            near = [u for u, s in ev.items() if s >= best - NEAR_BEST]
            pick = max(near, key=lambda u: popular.get(u, 0)) if near else evals[0][0].uci()
            move = chess.Move.from_uci(pick)
            node = {'san': board.san(move), 'uci': pick, 'eval': ev.get(pick, best)}
            m = next((x for x in data['moves'] if x['uci'] == pick), None)
            if m:
                node['stats'] = self.score_stats(m)
            board.push(move)
            node['children'] = self.build(board, ply + 1)
            board.pop()
            return [node]
        # opponent move: the most played replies
        replies = [m for m in data['moves'] if total(m) / games >= MIN_SHARE][:MAX_REPLIES]
        out = []
        for m in replies:
            move = chess.Move.from_uci(m['uci'])
            board.push(move)
            after = self.evals(board, 1)
            board.pop()
            score = after[0][1] if after else 0
            # loss = how much better it is for us than after the opponent's best reply
            node = {'san': board.san(move), 'uci': m['uci'], 'share': round(100 * total(m) / games, 1),
                    'eval': score, 'loss': max(0, score - best), 'stats': self.score_stats(m)}
            board.push(move)
            node['children'] = self.build(board, ply + 1)
            if not node['children'] and not board.is_game_over():
                # a line never ends on the opponent's move: add our best reply
                best_move, best_score = self.evals(board, 1)[0]
                node['children'] = [{'san': board.san(best_move), 'uci': best_move.uci(), 'eval': best_score, 'children': []}]
            board.pop()
            out.append(node)
        return out


def main():
    root_moves, side, out_path = sys.argv[1].split(), sys.argv[2], sys.argv[3]
    b = Builder(side)
    board = chess.Board()
    for s in root_moves:
        board.push_san(s)
    tree = {'root': root_moves, 'side': side, 'children': b.build(board, len(root_moves))}
    json.dump(tree, open(out_path, 'w'), indent=1)
    b.engine.quit()
    print('nodes', b.nodes)


if __name__ == '__main__':
    main()
