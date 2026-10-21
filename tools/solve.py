"""Precompute solution trees for the Woodpecker Method PGN with Stockfish.

Output: woodpecker.json  -> [{"n": 1, "fen": "...", "t": tree}, ...]
tree = [[uci, reply_uci_or_null, subtree_or_null], ...]   (first entry = main line)
A subtree of null means the puzzle is solved after that move.
"""
import json, math, re, sys, os
from concurrent.futures import ProcessPoolExecutor
import chess, chess.engine

ENGINE = os.environ.get("STOCKFISH", "stockfish")
HERO_TIME = 1.5
REPLY_TIME = 1.0
MULTIPV = 5
MAX_HERO_MATE = 10
MAX_HERO_CP = 6
MAX_NODES = 40  # cap on tree size per puzzle
MAX_FORCED = 4  # keep the line going (accepting every good move) up to this hero move while material is still down
VALUES = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9}

_engine = None
import atexit
atexit.register(lambda: _engine and _engine.quit())


def eng():
    global _engine
    if _engine is None:
        _engine = chess.engine.SimpleEngine.popen_uci(ENGINE)
        _engine.configure({"Threads": 2, "Hash": 256})
    return _engine


def wc(cp):
    return 2 / (1 + math.exp(-0.00368208 * cp)) - 1


def candidates(board, hero):
    infos = eng().analyse(board, chess.engine.Limit(time=HERO_TIME), multipv=MULTIPV)
    out = []
    for i in infos:
        if "pv" not in i or not i["pv"]:
            continue
        s = i["score"].pov(hero)
        out.append((i["pv"][0], s, i["pv"]))
    return out


def acceptable(cands):
    """Return (kind, list of accepted (move, pv))."""
    best = cands[0][1]
    if best.mate() is not None and best.mate() > 0:
        n = best.mate()
        return "mate", [(m, pv) for m, s, pv in cands if s.mate() == n]
    bcp = best.score(mate_score=100000)
    res = []
    for m, s, pv in cands:
        cp = s.score(mate_score=100000)
        if wc(bcp) - wc(cp) < (0.15 if bcp >= 150 else 0.1) and (cp >= 150 or bcp < 150):
            res.append((m, pv))
    return "cp", res


def reply_for(board, pv, hero_move=None, hero=None):
    """Opponent reply. After a capture, prefer the natural recapture when the hero still wins
    after it, so the puzzle shows why taking back fails (like the books do)."""
    if hero_move is not None and hero is not None:
        recaptures = [m for m in board.legal_moves if m.to_square == hero_move.to_square and board.is_capture(m)]
        recaptures.sort(key=lambda m: VALUES.get(board.piece_type_at(m.from_square), 10))
        for m in recaptures:
            b2 = board.copy()
            b2.push(m)
            if b2.is_game_over():
                continue
            info = eng().analyse(b2, chess.engine.Limit(time=REPLY_TIME), multipv=1)
            score = info[0]["score"].pov(hero) if info else None
            if score is not None and ((score.mate() is not None and score.mate() > 0) or score.score(mate_score=100000) >= 200):
                return m
    if len(pv) >= 2:
        return pv[1]
    r = eng().play(board, chess.engine.Limit(time=REPLY_TIME))
    return r.move


def material(board, hero):
    """Material balance from the hero's point of view."""
    return sum(v * (len(board.pieces(p, hero)) - len(board.pieces(p, not hero))) for p, v in VALUES.items())


class Budget:
    def __init__(self):
        self.n = 0


def build(board, hero, step, budget, kind_root=None, start_mat=None):
    """Build hero-to-move node. Returns list or None if node should not be part of puzzle."""
    budget.n += 1
    if start_mat is None:
        start_mat = material(board, hero)
    cands = candidates(board, hero)
    if not cands:
        return None
    kind, acc = acceptable(cands)
    if step > 1:
        # While the hero is behind in material (e.g. after a sacrifice or a capture that gets
        # recaptured), the point of the combination is still to be shown: keep going and accept
        # every good move. Once material is won, an ambiguous continuation ends the puzzle.
        not_won_yet = material(board, hero) < start_mat and step <= MAX_FORCED
        if kind == "cp" and len(acc) != 1 and not not_won_yet:
            return None  # ambiguous continuation -> puzzle ends before this
        if kind_root == "mate" and kind != "mate":
            return None
        if (kind == "cp" or kind_root == "cp") and step > MAX_HERO_CP:
            return None  # long lines are only kept when the whole puzzle is a forced mate
        if step > MAX_HERO_MATE:
            return None
    if not acc:
        acc = [(cands[0][0], cands[0][2])]
    node = []
    for idx, (mv, pv) in enumerate(acc):
        # alternatives at step 1 in cp puzzles end the puzzle immediately
        b = board.copy()
        b.push(mv)
        entry = [mv.uci(), None, None]
        if b.is_game_over() or b.is_repetition(2):
            node.append(entry)
            continue
        if idx > 0:
            node.append(entry)
            continue
        if budget.n >= MAX_NODES and idx > 0:
            continue
        rep = reply_for(b, pv, mv if board.is_capture(mv) else None, hero)
        b2 = b.copy()
        b2.push(rep)
        if b2.is_game_over():
            # opponent cannot "finish" a puzzle; stop after hero move
            node.append(entry)
            continue
        sub = build(b2, hero, step + 1, budget, kind_root or kind, start_mat) if budget.n < MAX_NODES else None
        if sub:
            entry[1] = rep.uci()
            entry[2] = sub
        node.append(entry)
    return node


def solve(item):
    n, fen = item
    board = chess.Board(fen)
    try:
        tree = build(board, board.turn, 1, Budget())
    except Exception as e:  # noqa
        print("ERR", n, e, file=sys.stderr)
        tree = None
    return {"n": n, "fen": fen, "t": tree}


def main():
    from multiprocessing import Pool
    pgn = open(sys.argv[1], encoding="utf-8-sig").read()
    fens = re.findall(r'\[FEN "([^"]+)"\]', pgn)
    items = list(enumerate(fens, 1))
    if len(sys.argv) > 3:
        a, b = map(int, sys.argv[3].split("-"))
        items = items[a - 1:b]
    out_path = sys.argv[2]
    part = out_path + ".jsonl"
    done = {}
    if os.path.exists(part):
        for line in open(part):
            if line.strip():
                r = json.loads(line)
                done[r["n"]] = r
    todo = [it for it in items if it[0] not in done]
    print("pending", len(todo), flush=True)
    with open(part, "a") as f, Pool(15) as pool:
        for i, r in enumerate(pool.imap_unordered(solve, todo), 1):
            f.write(json.dumps(r, separators=(",", ":")) + "\n")
            f.flush()
            done[r["n"]] = r
            if i % 25 == 0:
                print(f"{i}/{len(todo)}", flush=True)
        pool.terminate()
    results = [done[n] for n, _ in items if n in done]
    json.dump(results, open(out_path, "w"), separators=(",", ":"))
    print("done", len(results), flush=True)
    os._exit(0)


if __name__ == "__main__":
    main()
