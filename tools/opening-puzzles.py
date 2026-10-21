"""Extracts puzzles of the app's openings from the Lichess puzzle database (CC0).

Usage:    python tools/opening-puzzles.py lichess_db_puzzle.csv.zst public/openings/puzzles
Database: https://database.lichess.org/#puzzles

Lichess tags every puzzle with the opening of the game it comes from. For every group below,
quality puzzles (often played, well rated, stable rating) where the solver plays the repertoire
side are sampled at random, up to PER_GROUP.

Output, one file per group (<group>.txt), one line per puzzle, sorted by rating:
    id;fen;moves;rating
(same format as public/lichess/: fen after the opponent's first move, moves start with the user's).
"""
import csv, io, json, os, random, sys
import chess, zstandard

PER_GROUP = 1500
MIN_PLAYS, MAX_RD, MIN_POP = 100, 90, 70

# group -> (repertoire side, predicate on the puzzle's opening tags)
def has(*prefixes, exclude=()):
    return lambda tags: any(t.startswith(prefixes) for t in tags) and not any(t.startswith(exclude) for t in tags)

GROUPS = {
    'italian': ('w', has('Italian_Game', exclude=('Italian_Game_Scotch_Gambit',))),
    'italian-giuoco': ('w', has('Italian_Game_Giuoco_Piano', 'Italian_Game_Giuoco_Pianissimo', 'Italian_Game_Classical_Variation')),
    'italian-two-knights': ('w', has('Italian_Game_Two_Knights_Defense', 'Italian_Game_Anti-Fried_Liver_Defense')),
    'italian-evans': ('w', has('Italian_Game_Evans_Gambit')),
    'queens-gambit': ('w', has('Queens_Gambit_Declined', 'Queens_Gambit_Accepted', 'Slav_Defense')),
    'qg-declined': ('w', has('Queens_Gambit_Declined', exclude=('Queens_Gambit_Declined_Albin', 'Queens_Gambit_Declined_Chigorin',
                                                                'Queens_Gambit_Declined_Baltic', 'Queens_Gambit_Declined_Marshall'))),
    'qg-accepted': ('w', has('Queens_Gambit_Accepted')),
    'qg-slav': ('w', has('Slav_Defense')),
    'sicilian': ('b', has('Sicilian_Defense')),
    'sicilian-najdorf': ('b', has('Sicilian_Defense_Najdorf_Variation')),
    'sicilian-dragon': ('b', has('Sicilian_Defense_Dragon_Variation')),
    'sicilian-anti': ('b', has('Sicilian_Defense_Alapin', 'Sicilian_Defense_Delayed_Alapin', 'Sicilian_Defense_Smith-Morra',
                               'Sicilian_Defense_Nyezhmetdinov-Rossolimo', 'Sicilian_Defense_Moscow', 'Sicilian_Defense_Closed',
                               'Sicilian_Defense_Grand_Prix')),
    'black-lion': ('b', has('Philidor_Defense_Lion_Variation', 'Lion_Defense', 'Philidor_Defense_Hanham', 'Old_Indian_Defense')),
}

random.seed(20261021)


def main(src, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    samples = {g: [] for g in GROUPS}
    seen = {g: 0 for g in GROUPS}
    reader = csv.reader(io.TextIOWrapper(zstandard.ZstdDecompressor().stream_reader(open(src, 'rb')), encoding='utf-8'))
    next(reader)
    for row in reader:
        pid, fen, moves, rating, rd, pop, plays, themes, url, opening = row[:10]
        if not opening or int(plays) < MIN_PLAYS or int(rd) > MAX_RD or int(pop) < MIN_POP:
            continue
        tags = opening.split()
        solver = 'b' if fen.split()[1] == 'w' else 'w'  # the FEN has the opponent to move
        for g, (side, pred) in GROUPS.items():
            if side != solver or not pred(tags):
                continue
            seen[g] += 1
            rec = (pid, fen, moves, int(rating))
            if len(samples[g]) < PER_GROUP:
                samples[g].append(rec)
            else:
                j = random.randrange(seen[g])
                if j < PER_GROUP:
                    samples[g][j] = rec
    index = {}
    for g, recs in samples.items():
        lines = []
        for pid, fen, moves, rating in sorted(recs, key=lambda r: r[3]):
            b = chess.Board(fen)
            ms = moves.split()
            b.push_uci(ms[0])  # opponent move that sets up the puzzle
            lines.append(f'{pid};{b.fen()};{" ".join(ms[1:])};{rating}')
        with open(os.path.join(out_dir, f'{g}.txt'), 'w', encoding='utf-8', newline='\n') as w:
            w.write('\n'.join(lines) + '\n')
        index[g] = {'total': len(lines), 'available': seen[g],
                    'min': recs and min(r[3] for r in recs), 'max': recs and max(r[3] for r in recs)}
        print(f'{g}: {len(lines)} of {seen[g]}')
    with open(os.path.join(out_dir, 'index.json'), 'w') as w:
        json.dump(index, w, separators=(',', ':'))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
