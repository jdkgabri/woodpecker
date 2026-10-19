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

export async function fetchLichessPuzzles({ theme, difficulty, count }, onProgress, signal) {
  const seen = new Set();
  const out = [];
  let misses = 0;
  while (out.length < count && misses < Math.max(40, count)) {
    if (signal?.aborted) throw new Error('Cancelado');
    const url = `https://lichess.org/api/puzzle/next?angle=${theme}&difficulty=${difficulty}&_=${Math.random()}`;
    const res = await fetch(url, { signal, headers: { Accept: 'application/json', ...authHeaders() } });
    if (res.status === 429) { await new Promise(r => setTimeout(r, 61000)); continue; }
    if (!res.ok) throw new Error('Lichess respondió ' + res.status);
    const j = await res.json();
    const id = j.puzzle.id;
    if (seen.has(id)) { misses++; continue; }
    seen.add(id);
    const chess = new Chess();
    for (const san of j.game.pgn.split(' ')) chess.move(san);
    out.push({ id, fen: chess.fen(), tree: solutionToTree(j.puzzle.solution), rating: j.puzzle.rating, themes: j.puzzle.themes });
    onProgress?.(out.length);
    await new Promise(r => setTimeout(r, 250));
  }
  return out;
}
