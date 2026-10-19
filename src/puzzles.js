import { Chess } from 'chess.js';
import { authHeaders } from './lichess.js';
import { t } from './i18n.js';

// Niveles del libro "The Woodpecker Method" (Smith & Tikkanen)
export const WP_LEVELS = [
  { key: 'easy', label: 'Fáciles', from: 1, to: 222 },
  { key: 'mid', label: 'Intermedios', from: 223, to: 984 },
  { key: 'hard', label: 'Avanzados', from: 985, to: 1128 },
  { key: 'all', label: 'Todos', from: 1, to: 1128 },
];
export const WP_TOTAL = 1128;

export function wpLevel(n) {
  if (n <= 222) return t('Fácil');
  if (n <= 984) return t('Intermedio');
  return t('Avanzado');
}

let wpCache = null;
export async function loadWoodpecker() {
  if (wpCache) return wpCache;
  const res = await fetch(import.meta.env.BASE_URL + 'woodpecker.json');
  if (!res.ok) throw new Error(t('No se pudo cargar la base de ejercicios'));
  const list = await res.json();
  wpCache = new Map(list.map(p => [p.n, p]));
  return wpCache;
}

// Devuelve { fen, tree, title, sub, lichessUrl } para un item de un set
export async function resolveItem(item) {
  if (item.wp) {
    const db = await loadWoodpecker();
    const p = db.get(item.wp);
    return { fen: p.fen, tree: p.t, title: t('Ejercicio {n}', { n: p.n }), sub: wpLevel(p.n) };
  }
  return { fen: item.fen, tree: item.tree, title: t('Puzle {id}', { id: item.id }), sub: item.rating ? `Elo ${item.rating}` : '', lichessId: item.id };
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
export const themeLabel = k => t(LICHESS_THEMES.find(x => x[0] === k)?.[1] || k);
export const diffLabel = k => t(LICHESS_DIFFS.find(x => x[0] === k)?.[1] || k);

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

class RateLimited extends Error {}

// GET con un reintento tras el límite de peticiones de Lichess (429)
async function getJson(url, signal, onStatus, anonymous = false) {
  for (let attempt = 0; ; attempt++) {
    if (signal?.aborted) throw new Error(t('Cancelado'));
    const res = await fetch(url, { signal, headers: { Accept: 'application/json', ...(anonymous ? {} : authHeaders()) } });
    if (res.status === 429) {
      if (attempt >= 1) throw new RateLimited();
      onStatus?.(t('Lichess pide esperar un minuto…'));
      await sleep(61000);
      continue;
    }
    if (!res.ok) throw new Error(t('Lichess respondió {s}', { s: res.status }));
    return res.json();
  }
}

function toItem(j) {
  const chess = new Chess();
  for (const san of j.game.pgn.split(' ')) chess.move(san);
  return { id: j.puzzle.id, fen: chess.fen(), tree: solutionToTree(j.puzzle.solution), rating: j.puzzle.rating, themes: j.puzzle.themes };
}

/**
 * opts: { theme, count, difficulty }            -> dificultad relativa a tu Elo
 *       { theme, count, minRating, maxRating, userRating } -> rango absoluto
 * Devuelve { items, complete, rateLimited }.
 */
export async function fetchLichessPuzzles(opts, onProgress, signal) {
  const { theme, count } = opts;
  const seen = new Set();
  const out = [];
  const absolute = opts.minRating != null;
  const inRange = r => !absolute || (r >= opts.minRating && r <= opts.maxRating);

  // Niveles a pedir: el elegido, o los que mejor cubren el rango absoluto
  let levels;
  let anonymous = false;
  if (!absolute) levels = [opts.difficulty];
  else {
    // Con cuenta, Lichess centra los niveles en el Elo del usuario (±600 aprox.); sin cuenta, en ~1500.
    // Se usa la cuenta solo si el rango pedido queda a su alcance; si no, se pide sin cuenta.
    const mid = (opts.minRating + opts.maxRating) / 2;
    anonymous = !opts.userRating || Math.abs(mid - opts.userRating) > Math.abs(mid - 1500);
    const base = anonymous ? 1500 : opts.userRating;
    const ranked = Object.keys(DIFF_OFFSET).sort((a, b) => Math.abs(base + DIFF_OFFSET[a] - mid) - Math.abs(base + DIFF_OFFSET[b] - mid));
    const overlapping = ranked.filter(d => base + DIFF_OFFSET[d] + 300 >= opts.minRating && base + DIFF_OFFSET[d] - 300 <= opts.maxRating);
    levels = overlapping.length ? overlapping : ranked.slice(0, 1);
  }
  const status = onProgress && (msg => onProgress(out.length, msg));
  const add = j => {
    if (out.length >= count || seen.has(j.puzzle.id) || !inRange(j.puzzle.rating)) return false;
    seen.add(j.puzzle.id);
    out.push(toItem(j));
    return true;
  };
  let rateLimited = false;
  try {
    // 1) Lotes de 50 (rápido). Sin cuenta, Lichess puede devolver siempre el mismo lote:
    //    en cuanto un nivel no aporta nada nuevo, se deja de pedir.
    let batchLevels = [...levels], requests = 0, turn = 0;
    while (out.length < count && batchLevels.length && requests < Math.ceil(count / 50) * 6 + 4) {
      const level = batchLevels[turn++ % batchLevels.length];
      const data = await getJson(`https://lichess.org/api/puzzle/batch/${theme}?nb=50&difficulty=${level}`, signal, status, anonymous);
      requests++;
      const added = (data.puzzles || []).filter(add).length;
      if (!added) batchLevels = batchLevels.filter(l => l !== level);
      onProgress?.(out.length);
      await sleep(300);
    }
    // 2) Si faltan, de uno en uno (más lento, pero con más variedad)
    let misses = 0, turn2 = 0;
    const maxMisses = Math.max(60, (count - out.length) * 3);
    while (out.length < count && misses < maxMisses) {
      const level = levels[turn2++ % levels.length];
      const j = await getJson(`https://lichess.org/api/puzzle/next?angle=${theme}&difficulty=${level}&_=${Math.random()}`, signal, status, anonymous);
      if (!add(j)) misses++;
      onProgress?.(out.length, t('Descargando (modo lento)… {n}/{m}', { n: out.length, m: count }));
      await sleep(250);
    }
  } catch (e) {
    if (!(e instanceof RateLimited)) throw e;
    rateLimited = true;
  }
  return { items: out, complete: out.length >= count, rateLimited };
}
