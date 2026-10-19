import { Chess } from 'chess.js';
import { authHeaders } from './lichess.js';

// Niveles del libro "The Woodpecker Method" (Smith & Tikkanen)
export const WP_LEVELS = [
  { key: 'easy', label: 'Fáciles', from: 1, to: 222 },
  { key: 'mid', label: 'Intermedios', from: 223, to: 984 },
  { key: 'hard', label: 'Avanzados', from: 985, to: 1128 },
  { key: 'all', label: 'Todos', from: 1, to: 1128 },
];
export const WP_TOTAL = 1128;

export function wpLevel(n) {
  if (n <= 222) return 'Fácil';
  if (n <= 984) return 'Intermedio';
  return 'Avanzado';
}

let wpCache = null;
export async function loadWoodpecker() {
  if (wpCache) return wpCache;
  const res = await fetch(import.meta.env.BASE_URL + 'woodpecker.json');
  if (!res.ok) throw new Error('No se pudo cargar la base de ejercicios');
  const list = await res.json();
  wpCache = new Map(list.map(p => [p.n, p]));
  return wpCache;
}

// Devuelve { fen, tree, title, sub, lichessUrl } para un item de un set
export async function resolveItem(item) {
  if (item.wp) {
    const db = await loadWoodpecker();
    const p = db.get(item.wp);
    return { fen: p.fen, tree: p.t, title: `Ejercicio ${p.n}`, sub: wpLevel(p.n) };
  }
  return { fen: item.fen, tree: item.tree, title: `Puzle ${item.id}`, sub: item.rating ? `Elo ${item.rating}` : '', lichessId: item.id };
}

// ---- Lichess (opcional) ----
export const LICHESS_THEMES = [
  ['mix', 'Mezcla'], ['fork', 'Ataque doble'], ['pin', 'Clavada'], ['skewer', 'Enfilada'],
  ['mate', 'Mate'], ['mateIn2', 'Mate en 2'], ['mateIn3', 'Mate en 3'], ['backRankMate', 'Mate del pasillo'],
  ['sacrifice', 'Sacrificio'], ['discoveredAttack', 'Ataque a la descubierta'], ['deflection', 'Desviación'],
  ['attraction', 'Atracción'], ['hangingPiece', 'Pieza colgada'], ['trappedPiece', 'Pieza atrapada'],
  ['endgame', 'Final'],
];
export const LICHESS_DIFFS = [
  ['easiest', 'Muy fácil'], ['easier', 'Fácil'], ['normal', 'Normal'], ['harder', 'Difícil'], ['hardest', 'Muy difícil'],
];

function solutionToTree(sol) {
  // sol: [hero, opp, hero, opp, ..., hero]
  let tree = null;
  for (let i = sol.length - 1; i >= 0; i -= 2) {
    const reply = i + 1 < sol.length ? sol[i + 1] : null;
    tree = [[sol[i], tree ? reply : null, tree]];
  }
  return tree;
}

// Desplazamiento aproximado de cada nivel respecto al Elo de puzles del usuario
// (sin cuenta, Lichess usa ~1500 como referencia).
const DIFF_OFFSET = { easiest: -600, easier: -300, normal: 0, harder: 300, hardest: 600 };

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchBatch(theme, difficulty, signal, onStatus) {
  for (;;) {
    if (signal?.aborted) throw new Error('Cancelado');
    const url = `https://lichess.org/api/puzzle/batch/${theme}?nb=50&difficulty=${difficulty}&_=${Math.random()}`;
    const res = await fetch(url, { signal, headers: { Accept: 'application/json', ...authHeaders() } });
    if (res.status === 429) {
      onStatus?.('Lichess pide esperar un minuto…');
      await sleep(61000);
      continue;
    }
    if (!res.ok) throw new Error('Lichess respondió ' + res.status);
    return (await res.json()).puzzles || [];
  }
}

function toItem(j) {
  const chess = new Chess();
  for (const san of j.game.pgn.split(' ')) chess.move(san);
  return { id: j.puzzle.id, fen: chess.fen(), tree: solutionToTree(j.puzzle.solution), rating: j.puzzle.rating, themes: j.puzzle.themes };
}

/**
 * opts: { theme, count, difficulty }            -> dificultad relativa a tu Elo
 *       { theme, count, minRating, maxRating, baseRating } -> rango absoluto
 * Devuelve { items, complete }.
 */
export async function fetchLichessPuzzles(opts, onProgress, signal) {
  const { theme, count } = opts;
  const seen = new Set();
  const out = [];
  const absolute = opts.minRating != null;
  const inRange = r => !absolute || (r >= opts.minRating && r <= opts.maxRating);

  // Niveles a pedir: el elegido, o los que mejor cubren el rango absoluto
  let levels;
  if (!absolute) levels = [opts.difficulty];
  else {
    const base = opts.baseRating || 1500;
    const mid = (opts.minRating + opts.maxRating) / 2;
    const ranked = Object.keys(DIFF_OFFSET).sort((a, b) => Math.abs(base + DIFF_OFFSET[a] - mid) - Math.abs(base + DIFF_OFFSET[b] - mid));
    const overlapping = ranked.filter(d => base + DIFF_OFFSET[d] + 300 >= opts.minRating && base + DIFF_OFFSET[d] - 300 <= opts.maxRating);
    levels = overlapping.length ? overlapping : ranked.slice(0, 1);
  }
  const fruitless = Object.fromEntries(levels.map(l => [l, 0]));
  const maxRequests = Math.max(10, Math.ceil(count / 50) * 6);
  let requests = 0, turn = 0;

  while (out.length < count && levels.length && requests < maxRequests) {
    const level = levels[turn++ % levels.length];
    const batch = await fetchBatch(theme, level, signal, onProgress && (msg => onProgress(out.length, msg)));
    requests++;
    let added = 0;
    for (const j of batch) {
      if (out.length >= count) break;
      if (seen.has(j.puzzle.id) || !inRange(j.puzzle.rating)) continue;
      seen.add(j.puzzle.id);
      out.push(toItem(j));
      added++;
    }
    // un nivel que no aporta nada dos veces seguidas se descarta
    fruitless[level] = added ? 0 : fruitless[level] + 1;
    if (fruitless[level] >= 2) levels = levels.filter(l => l !== level);
    onProgress?.(out.length);
    await sleep(300);
  }
  return { items: out, complete: out.length >= count };
}
