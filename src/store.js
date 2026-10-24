// Local persistence (the UI source of truth). sync.js replicates it to the cloud when signed in.
import { compute as computeHabit, dayKey } from './habit.js';
import { t } from './i18n.js';
const KEY = 'wp:data:v1';
const SETTINGS_KEY = 'wp:settings:v1';

const DEFAULT_SETTINGS = {
  autoPause: true,      // pause when leaving the app / switching tabs
  autoNext: true,       // go to the next puzzle after solving
  sound: true,
  coords: true,
  hidePaused: true,     // hide the board while paused
};

let data = load();
const snapshots = new Map(); // id -> set JSON without updatedAt, to detect changes
const saveListeners = new Set();
let lockedSetId = null;      // set being trained: not overwritten from the cloud

function load() {
  let d = { sets: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) d = JSON.parse(raw);
  } catch (e) { console.error(e); }
  d.deleted = d.deleted || {};
  d.days = d.days || [];
  d.frozen = d.frozen || [];  // days covered with a streak freeze
  d.habit = d.habit || { enabled: false, enabledAt: null, dismissed: null, updatedAt: 0 };
  for (const s of d.sets) s.updatedAt = s.updatedAt || s.createdAt || Date.now();
  return d;
}

const contentOf = set => {
  const { updatedAt, ...rest } = set;
  return JSON.stringify(rest);
};
for (const s of data.sets) snapshots.set(s.id, contentOf(s));

export function save() {
  const changed = [];
  for (const s of data.sets) {
    const c = contentOf(s);
    if (snapshots.get(s.id) !== c) {
      snapshots.set(s.id, c);
      s.updatedAt = Date.now();
      changed.push(s.id);
    }
  }
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch (e) { console.error(e); alert(t('Could not save progress: {e}', { e: e.message })); }
  saveListeners.forEach(f => f(changed));
}

export const onSave = f => { saveListeners.add(f); return () => saveListeners.delete(f); };
export const setLocked = id => { lockedSetId = id; };
export const rawData = () => data;

// Applies data coming from the cloud. Returns true if something visible changed.
export function applyRemote({ sets = [], deleted = {}, days = [], frozen = [], habit = null }) {
  let changed = false;
  for (const [id, t] of Object.entries(deleted)) {
    if (!data.deleted[id] || data.deleted[id] < t) data.deleted[id] = t;
    const local = getSet(id);
    if (local && local.updatedAt <= t && id !== lockedSetId) {
      data.sets = data.sets.filter(s => s.id !== id);
      snapshots.delete(id);
      changed = true;
    }
  }
  for (const remote of sets) {
    if (remote.id === lockedSetId) continue;
    if (data.deleted[remote.id] && data.deleted[remote.id] >= remote.updatedAt) continue;
    const i = data.sets.findIndex(s => s.id === remote.id);
    if (i === -1) data.sets.push(remote);
    else if (remote.updatedAt > data.sets[i].updatedAt) data.sets[i] = remote;
    else continue;
    snapshots.set(remote.id, contentOf(remote));
    changed = true;
  }
  const allDays = new Set([...data.days, ...days]);
  if (allDays.size !== data.days.length) { data.days = [...allDays].sort(); changed = true; }
  const allFrozen = new Set([...data.frozen, ...frozen]);
  if (allFrozen.size !== data.frozen.length) { data.frozen = [...allFrozen].sort(); changed = true; }
  if (habit && (habit.updatedAt || 0) > (data.habit.updatedAt || 0)) { data.habit = habit; changed = true; }
  if (changed) {
    data.sets.sort((a, b) => b.createdAt - a.createdAt);
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { console.error(e); }
  }
  return changed;
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
  snapshots.delete(id);
  data.deleted[id] = Date.now();
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
  if (!obj || !obj.data || !Array.isArray(obj.data.sets)) throw new Error(t('Invalid backup file'));
  const now = Date.now();
  data = { deleted: {}, days: [], frozen: [], habit: { enabled: false, enabledAt: null, dismissed: null, updatedAt: 0 }, ...obj.data };
  // imported data becomes the newest, so it gets uploaded
  for (const s of data.sets) { s.updatedAt = now; snapshots.set(s.id, contentOf(s)); }
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { console.error(e); }
  saveListeners.forEach(f => f(data.sets.map(s => s.id)));
  if (obj.settings) setSettings(obj.settings);
}

// ---- Daily activity and habit mode ----
// A day counts as trained if at least one puzzle from a cycle or a mistake review was finished.
// Returns true if it is the day's first puzzle.
export function touchActivity() {
  const day = dayKey(new Date());
  if (data.days.includes(day)) return false;
  data.days.push(day);
  save();
  return true;
}

export const habitData = () => data.habit;
export function setHabit(patch) {
  data.habit = { ...data.habit, ...patch, updatedAt: Date.now() };
  // the activation date is kept for the weekly streak-freeze count
  if (data.habit.enabled && !data.habit.enabledAt) data.habit.enabledAt = Date.now();
  save();
}
export function habitState(now = new Date()) {
  return computeHabit({ days: data.days, frozen: data.frozen, enabledAt: data.habit.enabledAt, dismissed: data.habit.dismissed }, now);
}
// Covers the gap days with streak freezes
export function useFreezes(gap) {
  data.frozen = [...new Set([...data.frozen, ...gap])].sort();
  save();
}
export function dismissBreak(lastDay) { setHabit({ dismissed: lastDay }); }
