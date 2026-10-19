// node tests/pgn.test.mjs
import { analysePgn } from '../src/pgn.js';

let failed = 0;
const check = (name, ok, extra) => { if (!ok) failed++; console.log(ok ? 'OK  ' : 'FAIL', name, ok ? '' : JSON.stringify(extra)); };

const pgn = `
[Event "With solution"]
[FEN "r6r/1pp3k1/1b6/p2P1p2/P1N1pn2/2P2PP1/BP5P/4RR1K b - - 0 1"]

1... Rxh2+ {rook sacrifice} 2. Kxh2 Rh8# 0-1

[Event "With an alternative and a bad move"]
[FEN "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1"]

1. Ra8# (1. Re1? h6) (1. Rd1 h6) 1-0

[Event "Opponent first (Lichess style)"]
[FEN "6k1/5ppp/8/8/8/8/5PPP/R5K1 b - - 0 1"]

1... h6 2. Ra8+ Kh7 3. Ra7 1-0

[Event "Without solution"]
[FEN "rnb3kr/ppp4p/3b3B/3Pp2n/2BP4/3K1Rp1/PPP3q1/RN1Q4 w - - 0 1"]

 1-0

[Event "Full game"]

1. e4 e5 2. Nf3 Nc6 1/2-1/2

[Event "Illegal"]
[FEN "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1"]

1. Qh8# 1-0

[Event "Annotations and NAGs"]
[FEN "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1"]

1. Ra8+! $1 {mate} 1-0
`;

const r = analysePgn(pgn);
check('7 puzzles', r.length === 7, r.length);
check('solution read', r[0].kind === 'solution' && JSON.stringify(r[0].tree) === JSON.stringify([['h8h2', 'h1h2', [['a8h8', null, null]]]]), r[0].tree);
check('comment kept', r[0].notes === 'rook sacrifice', r[0].notes);
check('alternative accepted, the one marked ? is not', r[1].tree.map(e => e[0]).join() === 'a1a8,a1d1', r[1].tree);
check("opponent's first move detected", r[2].kind === 'solution' && r[2].flags.includes('opponentFirst') && r[2].tree[0][0] === 'a1a8' && r[2].tree[0][1] === 'g8h7', r[2]);
check('without solution', r[3].kind === 'nosolution');
check('full game without FEN', r[4].kind === 'error' && r[4].reason === 'nofen');
check('illegal move', r[5].kind === 'error' && r[5].reason === 'illegal' && r[5].detail === 'Qh8#', r[5]);
check('annotations !, $1 and comment', r[6].kind === 'solution' && r[6].tree[0][0] === 'a1a8' && r[6].notes === 'mate', r[6]);
const no = analysePgn(pgn, 'no')[2];
check('option "no": the side to move starts and the trailing opponent move is dropped', no.tree[0][0] === 'h7h6' && no.tree[0][2][0][0] === 'g8h7', no.tree);

process.exit(failed ? 1 : 0);
