// node tests/pgn.test.mjs
import { analysePgn } from '../src/pgn.js';

let failed = 0;
const check = (name, ok, extra) => { if (!ok) failed++; console.log(ok ? 'OK  ' : 'FAIL', name, ok ? '' : JSON.stringify(extra)); };

const pgn = `
[Event "Con solución"]
[FEN "r6r/1pp3k1/1b6/p2P1p2/P1N1pn2/2P2PP1/BP5P/4RR1K b - - 0 1"]

1... Rxh2+ {sacrificio de torre} 2. Kxh2 Rh8# 0-1

[Event "Con alternativa y una mala"]
[FEN "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1"]

1. Ra8# (1. Re1? h6) (1. Rd1 h6) 1-0

[Event "Rival primero (estilo Lichess)"]
[FEN "6k1/5ppp/8/8/8/8/5PPP/R5K1 b - - 0 1"]

1... h6 2. Ra8+ Kh7 3. Ra7 1-0

[Event "Sin solución"]
[FEN "rnb3kr/ppp4p/3b3B/3Pp2n/2BP4/3K1Rp1/PPP3q1/RN1Q4 w - - 0 1"]

 1-0

[Event "Partida completa"]

1. e4 e5 2. Nf3 Nc6 1/2-1/2

[Event "Ilegal"]
[FEN "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1"]

1. Qh8# 1-0

[Event "Anotaciones y NAGs"]
[FEN "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1"]

1. Ra8+! $1 {mate} 1-0
`;

const r = analysePgn(pgn);
check('7 ejercicios', r.length === 7, r.length);
check('solución leída', r[0].kind === 'solution' && JSON.stringify(r[0].tree) === JSON.stringify([['h8h2', 'g1h2', [['a8h8', null, null]]]]).replace('g1h2', 'h1h2'), r[0].tree);
check('comentario guardado', r[0].notes === 'sacrificio de torre', r[0].notes);
check('alternativa aceptada y la marcada con ? no', r[1].tree.map(e => e[0]).join() === 'a1a8,a1d1', r[1].tree);
check('primera jugada del rival detectada', r[2].kind === 'solution' && r[2].flags.includes('opponentFirst') && r[2].tree[0][0] === 'a1a8' && r[2].tree[0][1] === 'g8h7', r[2]);
check('sin solución', r[3].kind === 'nosolution');
check('partida completa sin FEN', r[4].kind === 'error' && r[4].reason === 'nofen');
check('jugada ilegal', r[5].kind === 'error' && r[5].reason === 'illegal' && r[5].detail === 'Qh8#', r[5]);
check('anotaciones !, $1 y comentario', r[6].kind === 'solution' && r[6].tree[0][0] === 'a1a8' && r[6].notes === 'mate', r[6]);
const no = analysePgn(pgn, 'no')[2];
check('opción "no": empieza el bando con turno y se descarta la última jugada del rival', no.tree[0][0] === 'h7h6' && no.tree[0][2][0][0] === 'g8h7', no.tree);

process.exit(failed ? 1 : 0);
