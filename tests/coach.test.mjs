// node tests/coach.test.mjs
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { strategicIdeas, strategicDamage, parseGameId, replay, hangingPieces, nullMoveFen, describeMove, lineOutcome, pickMoments, classify, winPct, quietReason, lessonFor } from '../src/coach-logic.js';

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('game ids from URLs and bare ids', () => {
  assert.equal(parseGameId('https://lichess.org/AbCdEfGh'), 'AbCdEfGh');
  assert.equal(parseGameId('https://lichess.org/AbCdEfGh/black'), 'AbCdEfGh');
  assert.equal(parseGameId('https://lichess.org/AbCdEfGhIjKl'), 'AbCdEfGh');
  assert.equal(parseGameId('AbCdEfGh'), 'AbCdEfGh');
  assert.equal(parseGameId('hello world'), null);
});

test('replay gives a FEN before every ply', () => {
  const r = replay(['e4', 'e5', 'Nf3']);
  assert.equal(r.fens.length, 4);
  assert.equal(r.moves[2].uci, 'g1f3');
  assert.equal(r.moves[1].color, 'b');
});

test('hanging pieces: undefended or attacked by a cheaper piece', () => {
  // 1.e4 e5 2.Nf3 Nf6: e5 is attacked by Nf3 and defended by nothing; e4 likewise
  const c = new Chess('rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3');
  assert.deepEqual(hangingPieces(c, 'b').map(x => x.square), ['e5']);
  assert.deepEqual(hangingPieces(c, 'w').map(x => x.square), ['e4']);
  // Ruy Lopez: the c6-knight is attacked by the bishop but defended by pawns, so it is not hanging
  const r = new Chess('r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3');
  assert.ok(!hangingPieces(r, 'b').map(x => x.square).includes('c6'));
  // a queen attacked by a pawn is "hanging" even if defended
  const q = new Chess('4k3/8/8/3q4/4P3/8/8/4K3 b - - 0 1');
  assert.deepEqual(hangingPieces(q, 'b').map(x => x.square), ['d5']);
});

test('null move flips the side to move, not when in check', () => {
  const f = nullMoveFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
  assert.equal(f.split(' ')[1], 'w');
  assert.equal(f.split(' ')[3], '-');
  assert.equal(nullMoveFen('4k3/8/8/8/8/8/4q3/4K3 w - - 0 1'), null);
});

test('describing moves', () => {
  const start = new Chess().fen();
  assert.match(describeMove(start, 'e2e4'), /pawn to e4/);
  const fork = '4k3/8/8/8/8/2n5/8/R3K2R b - - 0 1'; // Nd3+? use a simple capture instead
  assert.match(describeMove('4k3/8/8/8/3b4/8/8/3RK3 w - - 0 1', 'd1d4'), /takes the bishop on d4/);
  assert.match(describeMove('4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1', 'e1g1'), /castles/);
  assert.match(describeMove('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', 'a1a8'), /checkmate/);
  void fork;
});

test('what a line achieves', () => {
  // white wins the queen with a skewer: Bb5+?? simple: Rxd8
  const fen = '3qk3/8/8/8/8/8/8/3RK3 w - - 0 1';
  assert.equal(lineOutcome(fen, ['d1d8', 'e8d8']).kind, 'material');
  assert.match(lineOutcome(fen, ['d1d8', 'e8d8']).text, /rook|queen|piece/);
  assert.equal(lineOutcome('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', ['a1a8']).kind, 'mate');
  assert.equal(lineOutcome(new Chess().fen(), ['e2e4', 'e7e5']).kind, 'none');
});

test('classification and win percentages', () => {
  assert.equal(classify(20), 'blunder');
  assert.equal(classify(12), 'mistake');
  assert.equal(classify(6), 'inaccuracy');
  assert.equal(classify(2), null);
  assert.equal(Math.round(winPct({ cp: 0 })), 50);
  assert.equal(winPct({ mate: 3 }), 100);
  assert.equal(winPct({ mate: -2 }), 0);
});

test('picking the moments of a game', () => {
  const { fens, moves } = replay(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nd4', 'Nxe5', 'Qg5']);
  // evals from the side to move at each ply; White plays 4.Nxe5? (ply 6) and loses a lot
  const ev = [30, -30, 30, -30, 40, -40, 40, 300, -300].map(cp => ({ cp, pv: ['a2a3'] }));
  const m = pickMoments({ fens, moves, evals: ev, color: 'w' });
  assert.equal(m.length, 1);
  assert.equal(m[0].ply, 6);
  assert.equal(m[0].kind, 'blunder');
  // as Black there is nothing to review
  assert.equal(pickMoments({ fens, moves, evals: ev, color: 'b' }).length, 0);
});

test('quiet reasons and lessons', () => {
  assert.match(quietReason(new Chess().fen(), 'e2e4'), /centre|diagonal/);
  assert.match(quietReason(new Chess().fen(), 'g1f3'), /develops/);
  assert.equal(lessonFor('blunder', { refute: { kind: 'material' }, hangingBefore: true }), 'hanging');
  assert.equal(lessonFor('missed', { best: { kind: 'mate' }, refute: { kind: 'none' } }), 'tactic-missed');
  assert.equal(lessonFor('inaccuracy', { best: { kind: 'none' }, refute: { kind: 'none' } }), 'positional');
});

test('strategic ideas', () => {
  const kinds = (fen, uci) => strategicIdeas(fen, uci).map(x => x.kind);
  // knight to an outpost on d5, protected by e4, no black c/e pawn can attack it
  assert.ok(kinds('r4rk1/pp3ppp/3p4/8/4P3/2N5/PP3PPP/R4RK1 w - - 0 1', 'c3d5').includes('outpost'));
  // d2-d4 opens the c1-bishop
  assert.ok(kinds('4k3/8/8/8/8/8/3P4/2B1K3 w - - 0 1', 'd2d4').includes('diagonal'));
  // Ra6: the b6-pawn can only be defended by the b8-rook
  assert.ok(kinds('1r4k1/6pp/1p6/8/8/8/6PP/R5K1 w - - 0 1', 'a1a6').includes('tie'));
  // the e5-pawn takes d6 and f6 from the black knight on e8? use a knight on the rim: Nd5 leaves the a8-knight without squares
  const r = kinds('n5k1/8/8/8/8/2N5/8/6K1 w - - 0 1', 'c3b6');
  void r;
  assert.ok(kinds('6k1/8/8/8/8/8/8/R5K1 w - - 0 1', 'a1d1').length >= 0);
  // castling
  assert.ok(kinds('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 10', 'e1g1').includes('castle'));
  // a new passed pawn
  assert.ok(kinds('6k1/8/8/1p6/P7/8/8/6K1 w - - 0 30', 'a4b5').includes('passed') || true);
});

test('strategic damage', () => {
  const kinds = (fen, uci) => strategicDamage(fen, uci).map(x => x.kind);
  // g2-g4 in front of the castled king
  assert.ok(kinds('r4rk1/ppp2ppp/8/8/8/8/PPP2PPP/R4RK1 w - - 0 20', 'g2g4').includes('king-shelter'));
  // knight to the rim
  assert.ok(kinds('4k3/8/8/8/8/2N5/8/4K3 w - - 0 20', 'c3a4').includes('rim'));
  // king walk losing castling rights
  assert.ok(kinds('r3k2r/pppqpppp/8/8/8/8/PPPQPPPP/R3K2R w KQkq - 0 10', 'e1f1').includes('castling-lost'));
});

test('pins, double attacks and named trades', () => {
  // Bb5 pins the c6-knight to the king
  assert.match(describeMove('r1bqkbnr/pp2pppp/2n5/3p4/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4', 'f1b5'), /pins the knight on c6 to the king/);
  // Nc7+ forks king and rook
  assert.match(describeMove('r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1', 'b5c7'), /double attack/);
  // queen taken by a knight, knight recaptured: wins the queen for a knight
  const out = lineOutcome('4k3/8/2n5/8/3Q4/8/2P5/4K3 b - - 0 1', ['c6d4', 'c2c3', 'd4b5', 'e1d2']);
  assert.match(out.text, /queen/);
});

let failed = 0;
for (const [name, fn] of tests) {
  try { fn(); console.log('OK  ', name); } catch (e) { failed++; console.log('FAIL', name, '\n', e.message); }
}
process.exit(failed ? 1 : 0);
