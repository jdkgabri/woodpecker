// Study time: how long the app is actively used each day, and in which section.
// Time counts while the page is visible and there was some input (tap, key, scroll) in the last few
// minutes, or a video is playing. Each device keeps its own log (localStorage) and, when signed in,
// copies it to users/{uid}/timelog/{device} (sync.js); the report adds up every device.
// Log: { device, days: { "YYYY-MM-DD": { s: { section: seconds }, d: { section: { label: seconds } } } } }
import { dayKey } from './habit.js';
import * as sync from './sync.js';

const KEY = 'wp:timelog:v1';
const TICK = 5;            // seconds between checks
const IDLE = 180;          // seconds without input after which time stops counting
const PUSH_EVERY = 60000;  // ms between uploads while studying

// Sections by the first part of the route. Screens that are only for moving around (home, settings,
// statistics) do not count.
const SECTIONS = {
  new: 'tactics', set: 'tactics', train: 'tactics', review: 'tactics', cycle: 'tactics',
  openings: 'openings', opening: 'openings', drill: 'openings', tree: 'openings', tdrill: 'openings', videos: 'openings',
  courses: 'courses', course: 'courses', cstudy: 'courses', cdrill: 'courses',
  studies: 'studies',
  endgames: 'endgames', endgame: 'endgames',
  coach: 'coach',
  analysis: 'analysis',
  structures: 'structures', structure: 'structures', 'structure-sol': 'structures', 'structure-ex': 'structures',
};

function sectionOf(hash) {
  const [, view, id] = (hash.slice(1) || '/').split('/');
  let s = SECTIONS[view];
  if (!s) return null;
  // a course from one of "my studies" counts as studies
  if (s === 'courses' && id?.startsWith('u-')) s = 'studies';
  return s;
}
// What was being studied: the title of the screen (a course, an opening, a structure chapter…)
function labelOf() {
  const h = document.querySelector('header.top h1, h1');
  return (h?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

let log = null;
function load() {
  if (log) return log;
  try { log = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { log = null; }
  if (!log?.device) log = { device: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), days: {} };
  return log;
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(log)); } catch {} };

function add(seconds) {
  const section = sectionOf(location.hash);
  if (!section) return;
  const l = load();
  const day = (l.days[dayKey(new Date())] ||= { s: {}, d: {} });
  day.s[section] = (day.s[section] || 0) + seconds;
  const label = labelOf();
  if (label) { const d = (day.d[section] ||= {}); d[label] = (d[label] || 0) + seconds; }
  dirty = true;
  save();
}

let lastInput = Date.now(), dirty = false, lastPush = 0, started = false;
const videoPlaying = () => [...document.querySelectorAll('video')].some(v => !v.paused && !v.ended);

export function startTimelog() {
  if (started) return;
  started = true;
  load();
  const touch = () => { lastInput = Date.now(); };
  for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll']) window.addEventListener(ev, touch, { passive: true, capture: true });
  window.addEventListener('hashchange', touch);
  setInterval(() => {
    if (document.hidden) return;
    if (Date.now() - lastInput > IDLE * 1000 && !videoPlaying()) return;
    add(TICK);
    if (dirty && Date.now() - lastPush > PUSH_EVERY) push();
  }, TICK * 1000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) push(); else lastInput = Date.now(); });
}

function push() {
  if (!dirty || !sync.state.user) return;
  dirty = false;
  lastPush = Date.now();
  sync.timelogPut(log.device, log.days).catch(() => { dirty = true; });
}

// Every device's log added up: { day: { s: {section: sec}, d: {section: {label: sec}} } }
export async function allDays() {
  const l = load();
  push();
  const logs = [{ device: l.device, days: l.days }];
  try {
    for (const r of (await sync.timelogAll()) || []) if (r.device !== l.device) logs.push(r);
  } catch {}
  const out = {};
  for (const { days } of logs) for (const [k, v] of Object.entries(days || {})) {
    const o = (out[k] ||= { s: {}, d: {} });
    for (const [s, n] of Object.entries(v.s || {})) o.s[s] = (o.s[s] || 0) + n;
    for (const [s, labels] of Object.entries(v.d || {})) {
      const od = (o.d[s] ||= {});
      for (const [lb, n] of Object.entries(labels)) od[lb] = (od[lb] || 0) + n;
    }
  }
  return out;
}
export const dayTotal = day => Object.values(day?.s || {}).reduce((a, b) => a + b, 0);
// Seconds counted today on this device (for a quick look without waiting for the cloud)
export const todayLocal = () => dayTotal(load().days[dayKey(new Date())]);
