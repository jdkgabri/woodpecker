import { Chess } from 'chess.js';
import { authHeaders } from './lichess.js';
import { t } from './i18n.js';

// Levels of the book "The Woodpecker Method" (Smith & Tikkanen)
export const WP_LEVELS = [
  { key: 'easy', label: 'Easy|levels', from: 1, to: 222 },
  { key: 'mid', label: 'Intermediate|levels', from: 223, to: 984 },
  { key: 'hard', label: 'Advanced|levels', from: 985, to: 1128 },
  { key: 'all', label: 'All', from: 1, to: 1128 },
];
export const WP_TOTAL = 1128;

export function wpLevel(n) {
  if (n <= 222) return t('Easy');
  if (n <= 984) return t('Intermediate');
  return t('Advanced');
}

let wpCache = null;
export async function loadWoodpecker() {
  if (wpCache) return wpCache;
  const res = await fetch(import.meta.env.BASE_URL + 'woodpecker.json');
  if (!res.ok) throw new Error(t('Could not load the puzzle database'));
  const list = await res.json();
  wpCache = new Map(list.map(p => [p.n, p]));
  return wpCache;
}

// Returns { fen, tree, title, sub, notes } for a set item
export async function resolveItem(item) {
  if (item.wp) {
    const db = await loadWoodpecker();
    const p = db.get(item.wp);
    return { fen: p.fen, tree: p.t, title: t('Puzzle {n}', { n: p.n }), sub: wpLevel(p.n) };
  }
  if (item.pgn) return { fen: item.fen, tree: item.tree, title: t('Puzzle {n}', { n: item.n }), sub: item.label || '', notes: item.notes };
  return { fen: item.fen, tree: item.tree, title: t('Puzzle {id}', { id: item.id }), sub: item.rating ? `Elo ${item.rating}` : '', lichessId: item.id };
}

// ---- Lichess (opcional) ----
export const LICHESS_THEMES = [
  ['mix', 'Mix'], ['fork', 'Fork'], ['pin', 'Pin'], ['skewer', 'Skewer'],
  ['mate', 'Mate'], ['mateIn2', 'Mate in 2'], ['mateIn3', 'Mate in 3'], ['backRankMate', 'Back-rank mate'],
  ['sacrifice', 'Sacrifice'], ['discoveredAttack', 'Discovered attack'], ['deflection', 'Deflection'],
  ['attraction', 'Attraction'], ['hangingPiece', 'Hanging piece'], ['trappedPiece', 'Trapped piece'],
  ['endgame', 'Endgame'],
];
export const LICHESS_DIFFS = [
  ['easiest', 'Easiest'], ['easier', 'Easy'], ['normal', 'Normal'], ['harder', 'Harder'], ['hardest', 'Hardest'],
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

// Approximate offset of each level from the user's puzzle rating
export const DIFF_OFFSET = { easiest: -600, easier: -300, normal: 0, harder: 300, hardest: 600 };

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- Lichess API (requires a connected account) ----------
class RateLimited extends Error {}

// GET with one retry after Lichess' rate limit (429)
async function getJson(url, signal, onStatus) {
  for (let attempt = 0; ; attempt++) {
    if (signal?.aborted) throw new Error(t('Cancelled'));
    const res = await fetch(url, { signal, headers: { Accept: 'application/json', ...authHeaders() } });
    if (res.status === 429) {
      if (attempt >= 1) throw new RateLimited();
      onStatus?.(t('Lichess asks to wait a minute…'));
      await sleep(61000);
      continue;
    }
    if (!res.ok) throw new Error(t('Lichess responded {s}', { s: res.status }));
    return res.json();
  }
}

function toItem(j) {
  const chess = new Chess();
  for (const san of j.game.pgn.split(' ')) chess.move(san);
  return { id: j.puzzle.id, fen: chess.fen(), tree: solutionToTree(j.puzzle.solution), rating: j.puzzle.rating, themes: j.puzzle.themes };
}

/**
 * Downloads puzzles with the user's account: Lichess picks them by puzzle rating and does not
 * repeat them across batches. opts: { theme, count, difficulty }. Returns { items, complete, rateLimited }.
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

// ---------- Local collection (selection from the Lichess database, CC0) ----------
const localCache = new Map();
let localIndex = null;

export async function loadLocalIndex() {
  if (localIndex) return localIndex;
  const res = await fetch(import.meta.env.BASE_URL + 'lichess/index.json');
  if (!res.ok) throw new Error(t('Could not load the puzzle collection'));
  return (localIndex = await res.json());
}

// A theme's puzzles: [[id, fen, moves, rating, themes?], ...] sorted by rating
async function loadLocalTheme(theme) {
  if (localCache.has(theme)) return localCache.get(theme);
  const res = await fetch(import.meta.env.BASE_URL + `lichess/${theme}.txt`);
  if (!res.ok) throw new Error(t('Could not load the puzzle collection'));
  const rows = (await res.text()).split(/\r?\n/).filter(Boolean).map(l => {
    const [id, fen, moves, rating, themes] = l.split(';');
    return [id, fen, moves, +rating, themes];
  });
  localCache.set(theme, rows);
  return rows;
}

// How many puzzles the collection has for a theme and range (from the index)
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
 * Picks random puzzles from the local collection. Prefers those not in any other
 * set (avoid) and, if there are not enough, fills up with the rest.
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

// ---------- Full collection download (for offline use) ----------
const COLLECTION_CACHE = 'lichess-collection'; // the same cache the service worker uses
const collectionUrls = () => [
  new URL(import.meta.env.BASE_URL + 'lichess/index.json', location.href).href,
  ...LICHESS_THEMES.map(([k]) => new URL(import.meta.env.BASE_URL + `lichess/${k}.txt`, location.href).href),
];

// { saved, total }: how many themes are stored on the device
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
    if (signal?.aborted) throw new Error(t('Cancelled'));
    if (!(await cache.match(u))) {
      const res = await fetch(u, { signal, cache: 'no-cache' });
      if (!res.ok) throw new Error(t('Could not load the puzzle collection'));
      await cache.put(u, res);
    }
    onProgress?.(++done, urls.length);
  }
}

export async function clearCollection() {
  localCache.clear();
  await caches.delete(COLLECTION_CACHE);
}
