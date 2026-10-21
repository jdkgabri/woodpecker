"""Builds public/endgames/positions.json from the PGN of "100 Endgames You Must Know"
(Jesús de la Villa; used with the author's and the publisher's permission).

Usage: python tools/endgames.py "path/to/Jesus de la Villa-100 Endgames You Must Know.pgn"

For every position: the FEN, the main line (SAN), the full movetext with variations, and the
tablebase result for the side to move (Lichess tablebase, cached in .cache/tablebase), which
decides who the user plays and what the goal is (win or draw).
"""
import io, json, os, sys, time, urllib.parse, urllib.request
import chess, chess.pgn

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '..', '.cache', 'tablebase')
OUT = os.path.join(HERE, '..', 'public', 'endgames', 'positions.json')
os.makedirs(CACHE, exist_ok=True)
os.makedirs(os.path.dirname(OUT), exist_ok=True)


def tablebase(fen):
    path = os.path.join(CACHE, fen.replace('/', '_').replace(' ', '+') + '.json')
    if os.path.exists(path):
        return json.load(open(path))
    url = 'https://tablebase.lichess.ovh/standard?' + urllib.parse.urlencode({'fen': fen})
    for _ in range(5):
        try:
            data = json.load(urllib.request.urlopen(url, timeout=30))
            break
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(60)
                continue
            raise
    json.dump(data, open(path, 'w'))
    time.sleep(0.6)
    return data


def movetext(game):
    exporter = chess.pgn.StringExporter(headers=False, variations=True, comments=False)
    return game.accept(exporter).replace('\n', ' ').replace(' *', '').strip()


def main(pgn_path):
    out = []
    with open(pgn_path, encoding='latin-1') as f:
        while True:
            g = chess.pgn.read_game(f)
            if g is None:
                break
            board = g.board()
            fen = board.fen()
            main = []
            b = board.copy()
            for m in g.mainline_moves():
                main.append(b.san(m))
                b.push(m)
            tb = tablebase(fen)
            cat = tb.get('category')  # for the side to move
            stm = 'w' if board.turn == chess.WHITE else 'b'
            other = 'b' if stm == 'w' else 'w'
            if cat in ('win', 'cursed-win', 'maybe-win'):
                hero, goal = stm, 'win'
            elif cat in ('loss', 'blessed-loss', 'maybe-loss'):
                hero, goal = other, 'win'
            else:
                # a draw: the user defends with the side that can actually go wrong (has losing moves)
                goal = 'draw'
                loses = lambda r: any(m.get('category') in ('win', 'cursed-win', 'maybe-win') for m in r.get('moves', []))
                if loses(tb):
                    hero = stm
                else:
                    flipped = board.copy()
                    flipped.turn = not flipped.turn
                    flipped.ep_square = None
                    hero = other if flipped.is_valid() and loses(tablebase(flipped.fen())) else stm
            out.append({'i': len(out) + 1, 'fen': fen, 'main': main, 'pgn': movetext(g),
                        'tb': cat, 'dtm': tb.get('dtm'), 'hero': hero, 'goal': goal})
            print(len(out), cat, hero, goal, fen, flush=True)
    json.dump(out, open(OUT, 'w', encoding='utf-8'), separators=(',', ':'), ensure_ascii=False)
    print('positions:', len(out))


if __name__ == '__main__':
    main(sys.argv[1])
