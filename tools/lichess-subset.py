"""Genera la colección local de puzles de Lichess a partir de la base de datos oficial (CC0).

Uso:  python tools/lichess-subset.py lichess_db_puzzle.csv.zst public/lichess
Base: https://database.lichess.org/#puzzles

Para cada tema de la app y cada franja de 100 puntos de Elo se eligen al azar hasta PER_BUCKET
puzles de calidad (muy jugados, bien valorados y con Elo estable).

Salida, un archivo por tema (<tema>.txt), una línea por puzle:
    id;fen;jugadas;elo[;temas]
(los temas, separados por espacios, solo en mix.txt y solo los que usa la app)
donde fen es la posición del ejercicio (tras la jugada del rival que incluye Lichess) y
jugadas es la solución en UCI empezando por la jugada del usuario.
Además index.json con el recuento por tema y franja.
"""
import csv, io, json, os, random, sys
import chess, zstandard

THEMES = ['mix', 'fork', 'pin', 'skewer', 'mate', 'mateIn2', 'mateIn3', 'backRankMate', 'sacrifice',
          'discoveredAttack', 'deflection', 'attraction', 'hangingPiece', 'trappedPiece', 'endgame']
PER_BUCKET = 1500
BAND = 100
MIN_PLAYS, MAX_RD, MIN_POP = 100, 90, 70

random.seed(20261019)


def main(src, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    # muestreo aleatorio uniforme (reservoir) por (tema, franja)
    buckets, seen = {}, {}
    f = open(src, 'rb')
    reader = csv.reader(io.TextIOWrapper(zstandard.ZstdDecompressor().stream_reader(f), encoding='utf-8'))
    next(reader)
    total = kept = 0
    for row in reader:
        total += 1
        pid, fen, moves, rating, rd, pop, plays, themes = row[:8]
        rating, rd, pop, plays = int(rating), int(rd), int(pop), int(plays)
        if plays < MIN_PLAYS or rd > MAX_RD or pop < MIN_POP:
            continue
        kept += 1
        band = rating // BAND * BAND
        tags = set(themes.split())
        for th in THEMES:
            if th != 'mix' and th not in tags:
                continue
            key = (th, band)
            n = seen.get(key, 0) + 1
            seen[key] = n
            b = buckets.setdefault(key, [])
            rec = (pid, fen, moves, rating, themes)
            if len(b) < PER_BUCKET:
                b.append(rec)
            else:
                j = random.randrange(n)
                if j < PER_BUCKET:
                    b[j] = rec
        if total % 500000 == 0:
            print(f'{total} leídos, {kept} de calidad', flush=True)
    print(f'{total} puzles en la base, {kept} pasan el filtro de calidad')

    index = {}
    for th in THEMES:
        lines, counts = [], {}
        for (t, band), recs in sorted(buckets.items()):
            if t != th:
                continue
            counts[band] = len(recs)
            for pid, fen, moves, rating, themes in recs:
                b = chess.Board(fen)
                ms = moves.split()
                b.push_uci(ms[0])  # jugada del rival que plantea el ejercicio
                line = f'{pid};{b.fen()};{" ".join(ms[1:])};{rating}'
                if th == 'mix':
                    tags = [x for x in themes.split() if x in THEMES]
                    if tags:
                        line += ';' + ' '.join(tags)
                lines.append(line)
        lines.sort(key=lambda l: int(l.split(';')[3]))
        with open(os.path.join(out_dir, f'{th}.txt'), 'w', encoding='utf-8', newline='\n') as w:
            w.write('\n'.join(lines) + '\n')
        index[th] = {'total': len(lines), 'bands': counts}
        print(f'{th}: {len(lines)} puzles')
    with open(os.path.join(out_dir, 'index.json'), 'w') as w:
        json.dump({'band': BAND, 'perBucket': PER_BUCKET, 'themes': index}, w, separators=(',', ':'))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
