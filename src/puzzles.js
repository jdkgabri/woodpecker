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
  if (item.pgn) return { fen: item.fen, tree: item.tree, title: t('Ejercicio {n}', { n: item.n }), sub: item.label || '', notes: item.notes };
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
export const DIFF_OFFSET = { easiest: -600, easier: -300, normal: 0, harder: 300, hardest: 600 };

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- API de Lichess (requiere cuenta conectada) ----------
class RateLimited extends Error {}

// GET con un reintento tras el límite de peticiones de Lichess (429)
async function getJson(url, signal, onStatus) {
  for (let attempt = 0; ; attempt++) {
    if (signal?.aborted) throw new Error(t('Cancelado'));
    const res = await fetch(url, { signal, headers: { Accept: 'application/json', ...authHeaders() } });
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
 * Descarga puzles con la cuenta del usuario: Lichess los elige según su Elo de puzles y no
 * los repite entre lotes. opts: { theme, count, difficulty }. Devuelve { items, complete, rateLimited }.
 */
export async function fetchLichessPuzzles({ theme, count, difficulty }, onProgress, signal) {
  const seen = new Set();
  const out = [];
  let rateLimited = false, empty = 0;
  try {
    while (out.length < count && empty < 2) {
      const data = await getJson(`https://lichess.org/api/puzzle/batch/${theme}?nb=50&difficulty=${difficulty}`, signal, msg => onProgress?.(out.length, msg));
      let added = 0;
      for (const j of data.puzzles || []) {
        if (out.length >= count || seen.has(j.puzzle.id)) continue;
        seen.add(j.puzzle.id);
        out.push(toItem(j));
        added++;
      }
      empty = added ? 0 : empty + 1;
      onProgress?.(out.length);
      await sleep(300);
    }
  } catch (e) {
    if (!(e instanceof RateLimited)) throw e;
    rateLimited = true;
  }
  return { items: out, complete: out.length >= count, rateLimited };
}

// ---------- Colección local (selección de la base de datos de Lichess, CC0) ----------
const localCache = new Map();
let localIndex = null;

export async function loadLocalIndex() {
  if (localIndex) return localIndex;
  const res = await fetch(import.meta.env.BASE_URL + 'lichess/index.json');
  if (!res.ok) throw new Error(t('No se pudo cargar la colección de puzles'));
  return (localIndex = await res.json());
}

// Puzles de un tema: [[id, fen, jugadas, elo, temas?], ...] ordenados por Elo
async function loadLocalTheme(theme) {
  if (localCache.has(theme)) return localCache.get(theme);
  const res = await fetch(import.meta.env.BASE_URL + `lichess/${theme}.txt`);
  if (!res.ok) throw new Error(t('No se pudo cargar la colección de puzles'));
  const rows = (await res.text()).split(/\r?\n/).filter(Boolean).map(l => {
    const [id, fen, moves, rating, themes] = l.split(';');
    return [id, fen, moves, +rating, themes];
  });
  localCache.set(theme, rows);
  return rows;
}

// Cuántos puzles hay en la colección para un tema y rango (según el índice)
export async function localAvailable(theme, min, max) {
  const idx = await loadLocalIndex();
  const bands = idx.themes[theme]?.bands || {};
  let n = 0;
  for (const [b, c] of Object.entries(bands)) {
    const lo = +b, hi = lo + idx.band - 1;
    if (hi < min || lo > max) continue;
    n += Math.round(c * (Math.min(hi, max) - Math.max(lo, min) + 1) / idx.band);
  }
  return n;
}

/**
 * Elige al azar puzles de la colección local. Da preferencia a los que no están en ningún
 * otro set (avoid) y, si no llegan, completa con el resto.
 */
export async function pickLocalPuzzles({ theme, min, max, count, avoid = new Set() }) {
  const rows = (await loadLocalTheme(theme)).filter(r => r[3] >= min && r[3] <= max);
  const fresh = [], used = [];
  for (const r of rows) (avoid.has(r[0]) ? used : fresh).push(r);
  const pick = (arr, n) => {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr.slice(0, n);
  };
  const chosen = pick(fresh, count);
  const repeated = chosen.length < count ? pick(used, count - chosen.length) : [];
  const items = [...chosen, ...repeated].map(([id, fen, moves, rating, themes]) => ({
    id, fen, tree: solutionToTree(moves.split(' ')), rating, ...(themes ? { themes: themes.split(' ') } : {}),
  }));
  return { items, repeated: repeated.length, available: rows.length };
}

// ---------- Descarga completa de la colección (para usarla sin conexión) ----------
const COLLECTION_CACHE = 'lichess-collection'; // la misma caché que usa el service worker
const collectionUrls = () => [
  new URL(import.meta.env.BASE_URL + 'lichess/index.json', location.href).href,
  ...LICHESS_THEMES.map(([k]) => new URL(import.meta.env.BASE_URL + `lichess/${k}.txt`, location.href).href),
];

// { saved, total }: cuántos temas están guardados en el dispositivo
export async function collectionStatus() {
  if (!('caches' in window)) return null;
  const cache = await caches.open(COLLECTION_CACHE);
  const urls = collectionUrls().slice(1);
  let saved = 0;
  for (const u of urls) if (await cache.match(u)) saved++;
  return { saved, total: urls.length };
}

export async function downloadCollection(onProgress, signal) {
  const cache = await caches.open(COLLECTION_CACHE);
  const urls = collectionUrls();
  let done = 0;
  for (const u of urls) {
    if (signal?.aborted) throw new Error(t('Cancelado'));
    if (!(await cache.match(u))) {
      const res = await fetch(u, { signal, cache: 'no-cache' });
      if (!res.ok) throw new Error(t('No se pudo cargar la colección de puzles'));
      await cache.put(u, res);
    }
    onProgress?.(++done, urls.length);
  }
}

export async function clearCollection() {
  localCache.clear();
  await caches.delete(COLLECTION_CACHE);
}
