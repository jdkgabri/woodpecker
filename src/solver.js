// Cálculo de soluciones con el Stockfish de la app (misma lógica que tools/solve.py).
// tree = [[jugadaUci, respuestaUci|null, subárbol|null], ...]   (primera entrada = línea principal)
import { Chess } from 'chess.js';

const MULTIPV = 5;
const MAX_HERO_MATE = 10;
const MAX_HERO_CP = 6;
const MAX_NODES = 30;

const wc = cp => 2 / (1 + Math.exp(-0.00368208 * cp)) - 1;
const asCp = l => (l.mate != null ? (l.mate > 0 ? 100000 - l.mate : -100000 - l.mate) : l.cp);
const posKey = fen => fen.split(' ').slice(0, 4).join(' ');

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
 * Calcula el árbol de solución para la posición (le toca al usuario).
 * engine: instancia de Engine; movetime: ms por jugada del usuario.
 */
export async function solvePosition(engine, fen, { movetime = 1500, signal } = {}) {
  const chess = new Chess(fen);
  const seen = new Map([[posKey(fen), 1]]);
  let nodes = 0;

  async function build(step, kindRoot) {
    if (signal?.aborted) throw new Error('aborted');
    nodes++;
    const lines = await engine.search(chess.fen(), { multipv: MULTIPV, movetime });
    if (!lines.length) return null;
    let { kind, acc } = acceptable(lines);
    if (step > 1) {
      if (kind === 'cp' && acc.length !== 1) return null; // continuación ambigua: termina antes
      if (kindRoot === 'mate' && kind !== 'mate') return null;
      if (kind === 'cp' && step > MAX_HERO_CP) return null;
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
      // las alternativas, los finales de partida y las repeticiones terminan el ejercicio
      if (idx > 0 || chess.isGameOver() || repeated || nodes >= MAX_NODES) {
        node.push(entry);
        chess.undo();
        continue;
      }
      seen.set(key, 1);
      let reply = l.pv[1];
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
      void mv;
    }
    return node;
  }
  return build(1, null);
}

/**
 * Comprueba la primera jugada de una solución dada. Devuelve null si parece buena,
 * o un texto corto con el motivo de la duda.
 */
export async function checkFirstMove(engine, fen, uci, { movetime = 800 } = {}) {
  const lines = await engine.search(fen, { multipv: 3, movetime });
  if (!lines.length) return null;
  const best = lines[0];
  const own = lines.find(l => l.move === uci);
  let score = own;
  if (!score) {
    // evaluar la posición tras la jugada (desde el punto de vista del rival) y darle la vuelta
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
