// Solution computation with the app's Stockfish (same logic as tools/solve.py).
// tree = [[moveUci, replyUci|null, subtree|null], ...]   (first entry = main line)
import { Chess } from 'chess.js';

const MULTIPV = 5;
const MAX_HERO_MATE = 10;
const MAX_HERO_CP = 6;
const MAX_NODES = 30;
const MAX_FORCED = 4; // keep going (accepting every good move) up to this user move while material is down
const VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

const wc = cp => 2 / (1 + Math.exp(-0.00368208 * cp)) - 1;
const asCp = l => (l.mate != null ? (l.mate > 0 ? 100000 - l.mate : -100000 - l.mate) : l.cp);
const posKey = fen => fen.split(' ').slice(0, 4).join(' ');
// Material balance from the point of view of `side` ('w' | 'b')
function material(chess, side) {
  let m = 0;
  for (const row of chess.board()) for (const sq of row) if (sq) m += (sq.color === side ? 1 : -1) * VALUES[sq.type];
  return m;
}

function acceptable(lines) {
  const best = lines[0];
  if (best.mate != null && best.mate > 0) return { kind: 'mate', acc: lines.filter(l => l.mate === best.mate) };
  const b = asCp(best);
  const acc = lines.filter(l => {
    const c = asCp(l);
    return wc(b) - wc(c) < (b >= 150 ? 0.15 : 0.1) && (c >= 150 || b < 150);
  });
  return { kind: 'cp', acc };
}

/**
 * Computes the solution tree for the position (user to move).
 * engine: Engine instance; movetime: ms per user move.
 */
export async function solvePosition(engine, fen, { movetime = 1500, signal } = {}) {
  const chess = new Chess(fen);
  const hero = chess.turn();
  const startMat = material(chess, hero);
  const seen = new Map([[posKey(fen), 1]]);
  let nodes = 0;

  // After a capture, prefer the natural recapture when the user still wins after it,
  // so the puzzle shows why taking back fails (like the books do).
  async function naturalRecapture(square) {
    const recaptures = chess.moves({ verbose: true }).filter(m => m.to === square && m.captured)
      .sort((a, b) => VALUES[a.piece] - VALUES[b.piece]);
    for (const m of recaptures) {
      chess.move(m);
      const over = chess.isGameOver();
      const r = over ? null : (await engine.search(chess.fen(), { multipv: 1, movetime: Math.round(movetime / 2) }))[0];
      chess.undo();
      if (!r) continue;
      // r is from the user's point of view (the user is to move after the recapture)
      if ((r.mate != null && r.mate > 0) || (r.cp != null && r.cp >= 200)) return m.from + m.to + (m.promotion || '');
    }
    return null;
  }

  async function build(step, kindRoot) {
    if (signal?.aborted) throw new Error('aborted');
    nodes++;
    const lines = await engine.search(chess.fen(), { multipv: MULTIPV, movetime });
    if (!lines.length) return null;
    let { kind, acc } = acceptable(lines);
    if (step > 1) {
      // While the user is behind in material (after a sacrifice, or a capture that was taken back)
      // the point is still to be shown: keep going and accept every good move.
      const notWonYet = material(chess, hero) < startMat && step <= MAX_FORCED;
      if (kind === 'cp' && acc.length !== 1 && !notWonYet) return null; // ambiguous continuation: end before it
      if (kindRoot === 'mate' && kind !== 'mate') return null;
      if ((kind === 'cp' || kindRoot === 'cp') && step > MAX_HERO_CP) return null;
      if (step > MAX_HERO_MATE) return null;
    }
    if (!acc.length) acc = [lines[0]];
    const node = [];
    for (let idx = 0; idx < acc.length; idx++) {
      const l = acc[idx];
      const mv = chess.move({ from: l.move.slice(0, 2), to: l.move.slice(2, 4), promotion: l.move[4] });
      const entry = [l.move, null, null];
      const key = posKey(chess.fen());
      const repeated = seen.get(key);
      // alternatives, game over and repetitions end the puzzle
      if (idx > 0 || chess.isGameOver() || repeated || nodes >= MAX_NODES) {
        node.push(entry);
        chess.undo();
        continue;
      }
      seen.set(key, 1);
      let reply = mv.captured ? await naturalRecapture(mv.to) : null;
      reply = reply || l.pv[1];
      if (!reply) reply = (await engine.search(chess.fen(), { multipv: 1, movetime: Math.round(movetime / 2) }))[0]?.move;
      if (reply) {
        const rmv = chess.move({ from: reply.slice(0, 2), to: reply.slice(2, 4), promotion: reply[4] });
        if (rmv && !chess.isGameOver()) {
          const sub = await build(step + 1, kindRoot || kind);
          if (sub) { entry[1] = reply; entry[2] = sub; }
        }
        chess.undo();
      }
      seen.delete(key);
      node.push(entry);
      chess.undo();
    }
    return node;
  }
  return build(1, null);
}

/**
 * Checks the first move of a given solution. Returns null if it looks fine,
 * or a short code with the reason for doubt.
 */
export async function checkFirstMove(engine, fen, uci, { movetime = 800 } = {}) {
  const lines = await engine.search(fen, { multipv: 3, movetime });
  if (!lines.length) return null;
  const best = lines[0];
  const own = lines.find(l => l.move === uci);
  let score = own;
  if (!score) {
    // evaluate the position after the move (from the opponent's view) and flip it
    const c = new Chess(fen);
    try { c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }); } catch { return 'illegal'; }
    if (c.isCheckmate()) return null;
    const r = (await engine.search(c.fen(), { multipv: 1, movetime: Math.round(movetime / 2) }))[0];
    if (!r) return null;
    score = { cp: r.cp != null ? -r.cp : null, mate: r.mate != null ? -r.mate : null };
  }
  if (best.mate != null && best.mate > 0 && !(score.mate != null && score.mate > 0)) return 'missesMate';
  if (wc(asCp(best)) - wc(asCp(score)) > 0.3) return 'worse';
  return null;
}
