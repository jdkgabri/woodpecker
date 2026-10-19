// Prueba manual (hace peticiones reales a Lichess): node tests/lichess-range.manual.mjs
import { fetchLichessPuzzles } from '../src/puzzles.js';
const t = Date.now();
let last = '';
const r = await fetchLichessPuzzles({ theme: 'fork', count: 60, minRating: 1200, maxRating: 1400, userRating: 2432 },
  (n, msg) => { const s = msg || `${n}`; if (s !== last) { last = s; } });
const ratings = r.items.map(x => x.rating);
console.log(`${r.items.length} puzles en ${((Date.now() - t) / 1000).toFixed(1)} s · únicos ${new Set(r.items.map(x => x.id)).size} · Elo ${Math.min(...ratings)}–${Math.max(...ratings)} · completo ${r.complete} · limitado ${r.rateLimited} · último estado: ${last}`);
