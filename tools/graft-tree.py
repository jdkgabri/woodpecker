"""Grafts a separately built branch into a tree (for replies that fell outside MAX_REPLIES, or to
replace a branch built with an unwanted repertoire move). Branches are listed in tools/trees.json
with a "graft" field and built with `build-tree.py --only <file>`.

Usage: STOCKFISH=... python tools/graft-tree.py <tree> <branch-file> "<SANs from the tree root to the parent>" [--replace]
The branch root must be the tree root + that path + one opponent move. The branch file is deleted.
"""
import json, os, sys
import chess, chess.engine

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, '..', 'public', 'openings', 'trees') + os.sep
C = os.path.join(HERE, '..', '.cache', 'explorer') + os.sep

tree_f, branch_f, path = sys.argv[1], sys.argv[2], sys.argv[3].split()
T = json.load(open(D + tree_f + '.json'))
B = json.load(open(D + branch_f + '.json'))
us = chess.WHITE if T['side'] == 'w' else chess.BLACK
assert B['root'][:len(T['root']) + len(path)] == T['root'] + path and len(B['root']) == len(T['root']) + len(path) + 1

board = chess.Board()
for s in T['root'] + path:
    board.push_san(s)
parent_ns = T['c']
for s in path:
    parent = next(n for n in parent_ns if n['s'] == s)
    parent_ns = parent.setdefault('c', [])
san = B['root'][-1]


def save():
    json.dump(T, open(D + tree_f + '.json', 'w'), separators=(',', ':'))
    os.remove(D + branch_f + '.json')


old = next((n for n in parent_ns if n['s'] == san), None)
if old:
    assert '--replace' in sys.argv, 'already in the tree (use --replace)'
    old['c'] = B['c']
    save()
    sys.exit(print('replaced', san))

# a new opponent reply: share and score from the cached explorer data, evaluation from Stockfish
data = json.load(open(C + board.fen().replace('/', '_').replace(' ', '+') + '.json'))
total = data['white'] + data['draws'] + data['black']
m = next(x for x in data['moves'] if x['san'] == san)
n = m['white'] + m['draws'] + m['black']
eng = chess.engine.SimpleEngine.popen_uci(os.environ.get('STOCKFISH', 'stockfish'))
best = eng.analyse(board, chess.engine.Limit(time=1.5))['score'].pov(us).score(mate_score=10000)
move = board.parse_san(san)
board.push(move)
ev = eng.analyse(board, chess.engine.Limit(time=1.5))['score'].pov(us).score(mate_score=10000)
eng.quit()
win = m['white'] if us == chess.WHITE else m['black']
parent_ns.append({'s': san, 'u': move.uci(), 'e': ev, 'p': round(100 * n / total, 1), 'l': max(0, ev - best),
                  'g': n, 'w': round(100 * win / n), 'd': round(100 * m['draws'] / n), 'c': B['c']})
parent_ns.sort(key=lambda x: -x.get('p', 0))
save()
print('grafted', san, round(100 * n / total, 1), '%')
