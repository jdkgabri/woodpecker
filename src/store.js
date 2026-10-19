// Persistencia local: todo vive en el dispositivo (sin login).
const KEY = 'wp:data:v1';
const SETTINGS_KEY = 'wp:settings:v1';

const DEFAULT_SETTINGS = {
  autoPause: true,      // pausar al salir de la app / cambiar de pestaña
  autoNext: true,       // pasar al siguiente ejercicio al resolver
  sound: true,
  coords: true,
  hidePaused: true,     // ocultar el tablero mientras está en pausa
};

let data = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.error(e); }
  return { sets: [] };
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch (e) { console.error(e); alert('No se pudo guardar el progreso: ' + e.message); }
}

export function getSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
  catch { return { ...DEFAULT_SETTINGS }; }
}
export function setSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const sets = () => data.sets;
export const getSet = id => data.sets.find(s => s.id === id);

export function addSet(set) {
  data.sets.unshift(set);
  save();
  return set;
}
export function deleteSet(id) {
  data.sets = data.sets.filter(s => s.id !== id);
  save();
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function currentCycle(set) {
  const c = set.cycles[set.cycles.length - 1];
  return c && !c.finishedAt ? c : null;
}

export function startCycle(set) {
  const idx = set.items.map((_, i) => i);
  const cycle = {
    n: set.cycles.length + 1,
    startedAt: Date.now(),
    finishedAt: null,
    elapsedMs: 0,
    order: set.order === 'random' ? shuffle(idx) : idx,
    pos: 0,
    results: {},  // itemIndex -> { ok, ms }
  };
  set.cycles.push(cycle);
  save();
  return cycle;
}

export function cycleStats(cycle) {
  const res = Object.values(cycle.results);
  const done = res.length;
  const ok = res.filter(r => r.ok).length;
  return { done, ok, failed: done - ok, acc: done ? ok / done : 0 };
}

export function exportData() {
  return JSON.stringify({ app: 'woodpecker-trainer', version: 1, exportedAt: new Date().toISOString(), data, settings: getSettings() });
}
export function importData(json) {
  const obj = JSON.parse(json);
  if (!obj || !obj.data || !Array.isArray(obj.data.sets)) throw new Error('Archivo de copia no válido');
  data = obj.data;
  save();
  if (obj.settings) setSettings(obj.settings);
}

// Último uso, para la racha diaria
const localDay = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function touchActivity() {
  const day = localDay(new Date());
  data.days = data.days || [];
  if (!data.days.includes(day)) { data.days.push(day); save(); }
}
export function streak() {
  const days = new Set(data.days || []);
  let n = 0;
  const d = new Date();
  if (!days.has(localDay(d))) d.setDate(d.getDate() - 1);
  while (days.has(localDay(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
