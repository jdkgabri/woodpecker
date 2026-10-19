// Progress statistics computed from the sets (pure functions, no storage).
import { addDays } from './habit.js';

const allResults = set => set.cycles.flatMap(c => Object.entries(c.results).map(([idx, r]) => ({ idx: +idx, ...r, cycle: c })));

// ---------- performance by theme (Lichess sets) ----------
export function themeStats(sets) {
  const acc = new Map();
  for (const s of sets) {
    if (s.source !== 'lichess') continue;
    const setTheme = s.lichess?.theme && s.lichess.theme !== 'mix' ? [s.lichess.theme] : [];
    for (const r of allResults(s)) {
      const item = s.items[r.idx];
      const themes = [...new Set([...(item?.themes || []), ...setTheme])];
      for (const th of themes) {
        const a = acc.get(th) || { theme: th, attempts: 0, ok: 0, ms: 0 };
        a.attempts++; a.ok += r.ok ? 1 : 0; a.ms += r.ms || 0;
        acc.set(th, a);
      }
    }
  }
  return [...acc.values()].map(a => ({ ...a, acc: a.ok / a.attempts, avgMs: a.ms / a.attempts })).sort((x, y) => x.acc - y.acc);
}

// ---------- most missed positions ----------
export function mostMissed(sets, limit = 20) {
  const out = [];
  for (const s of sets) {
    const per = new Map();
    for (const c of s.cycles) for (const [idx, r] of Object.entries(c.results)) {
      const e = per.get(+idx) || { setId: s.id, idx: +idx, fails: 0, attempts: 0, lastOk: null, lastN: 0 };
      e.attempts++;
      if (!r.ok) e.fails++;
      if (c.n >= e.lastN) { e.lastN = c.n; e.lastOk = r.ok; }
      per.set(+idx, e);
    }
    for (const e of per.values()) if (e.fails) out.push(e);
  }
  return out.sort((a, b) => b.fails - a.fails || b.fails / b.attempts - a.fails / a.attempts).slice(0, limit);
}

// ---------- XP, levels and achievements ----------
export const RANKS = [
  [1, 'Pawn'], [5, 'Knight'], [10, 'Bishop'], [15, 'Rook'], [20, 'Queen'], [30, 'King'], [40, 'Master'], [50, 'Grandmaster'],
];
const RANK_ICON = { 'Pawn': '♟', 'Knight': '♞', 'Bishop': '♝', 'Rook': '♜', 'Queen': '♛', 'King': '♚', 'Master': '🎓', 'Grandmaster': '👑' };

export const xpForLevel = L => 50 * (L - 1) ** 2;
export function levelInfo(xp) {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const rank = [...RANKS].reverse().find(([l]) => level >= l)[1];
  const from = xpForLevel(level), to = xpForLevel(level + 1);
  return { level, rank, icon: RANK_ICON[rank], xp, from, to, progress: (xp - from) / (to - from) };
}

function coveredStreaks(days, frozen) {
  // streak length on each trained day
  const cov = new Set([...days, ...frozen]);
  const res = new Map();
  for (const d of [...days].sort()) {
    const prev = addDays(d, -1);
    res.set(d, (cov.has(prev) ? (res.get(prev) ?? runBack(prev, cov)) : 0) + 1);
  }
  return res;
}
function runBack(d, cov) { let n = 0; while (cov.has(d)) { n++; d = addDays(d, -1); } return n; }

export function computeXp({ sets, days = [], frozen = [] }) {
  let xp = 0;
  for (const s of sets) {
    const fin = s.cycles.filter(c => c.finishedAt);
    for (const c of s.cycles) {
      for (const r of Object.values(c.results)) xp += r.ok ? 10 : 3;
      if (!c.finishedAt) continue;
      const res = Object.values(c.results);
      const acc = res.length ? res.filter(r => r.ok).length / res.length : 0;
      xp += 50;
      if (acc >= 0.9 && res.length >= 20) xp += 25;
      const prev = fin[fin.indexOf(c) - 1];
      if (prev && c.elapsedMs < prev.elapsedMs) xp += 25;
    }
  }
  for (const len of coveredStreaks(days, frozen).values()) xp += 5 * Math.min(len, 10);
  return xp;
}

// Achievements: [id, icon, name, description, check]
export const ACHIEVEMENTS = [
  ['first', '🐣', 'First peck', 'Solve your first puzzle', s => s.solved >= 1],
  ['s100', '💯', 'One hundred', 'Solve 100 puzzles', s => s.solved >= 100],
  ['s500', '🎯', 'Five hundred', 'Solve 500 puzzles', s => s.solved >= 500],
  ['s1000', '🏅', 'One thousand', 'Solve 1,000 puzzles', s => s.solved >= 1000],
  ['s5000', '🏆', 'Five thousand', 'Solve 5,000 puzzles', s => s.solved >= 5000],
  ['cycle1', '🔁', 'First cycle', 'Complete a cycle', s => s.cycles >= 1],
  ['cycle10', '♻️', 'Perseverance', 'Complete 10 cycles', s => s.cycles >= 10],
  ['perfect', '✨', 'Perfect cycle', 'Complete a cycle of at least 20 puzzles without a single mistake', s => s.perfect],
  ['half', '⚡', 'Half the time', 'Complete a cycle in half the time of the previous one', s => s.half],
  ['seven', '🐦', 'Woodpecker', 'Complete 7 cycles of a set', s => s.sevenCycles],
  ['book', '📚', 'The whole book', 'Complete a cycle with all 1,128 puzzles of the book', s => s.fullBook],
  ['marathon', '🏃', 'Marathon', 'Complete a cycle of at least 200 puzzles', s => s.marathon],
  ['fast', '⏱', 'Reflexes', 'Complete a cycle of at least 50 puzzles averaging under 10 s', s => s.fast],
  ['day50', '🔥', 'Intense day', 'Solve 50 puzzles in a single day', s => s.bestDay >= 50],
  ['streak3', '🌱', 'Three in a row', '3-day streak', s => s.bestStreak >= 3],
  ['streak7', '📅', 'One week', '7-day streak', s => s.bestStreak >= 7],
  ['streak30', '🗓', 'One month', '30-day streak', s => s.bestStreak >= 30],
  ['streak100', '💎', 'One hundred days', '100-day streak', s => s.bestStreak >= 100],
  ['days30', '📈', 'Thirty days', 'Train on 30 days in total', s => s.daysTrained >= 30],
  ['lichess', '🐴', 'Lichess puzzles', 'Create a Lichess set', s => s.hasLichess],
  ['pgn', '📄', 'Own collection', 'Import a set from a PGN', s => s.hasPgn],
];

export function summary({ sets, days = [], frozen = [] }) {
  const s = { solved: 0, cycles: 0, perfect: false, half: false, sevenCycles: false, fullBook: false, marathon: false, fast: false,
    bestDay: 0, bestStreak: 0, daysTrained: days.length, hasLichess: false, hasPgn: false };
  const perDay = new Map();
  for (const set of sets) {
    if (set.source === 'lichess') s.hasLichess = true;
    if (set.source === 'pgn') s.hasPgn = true;
    const fin = set.cycles.filter(c => c.finishedAt);
    if (fin.length >= 7) s.sevenCycles = true;
    for (const c of set.cycles) {
      const res = Object.values(c.results);
      for (const r of res) {
        if (r.ok) s.solved++;
        if (r.t) { const d = new Date(r.t).toDateString(); perDay.set(d, (perDay.get(d) || 0) + 1); }
      }
      if (!c.finishedAt) continue;
      s.cycles++;
      const ok = res.filter(r => r.ok).length;
      if (res.length >= 20 && ok === res.length) s.perfect = true;
      if (res.length >= 200) s.marathon = true;
      if (res.length >= 50 && c.elapsedMs / res.length < 10000) s.fast = true;
      if (set.source === 'woodpecker' && set.items.length >= 1128) s.fullBook = true;
      const prev = fin[fin.indexOf(c) - 1];
      if (prev && c.elapsedMs <= prev.elapsedMs / 2) s.half = true;
    }
  }
  s.bestDay = Math.max(0, ...perDay.values());
  s.bestStreak = Math.max(0, ...coveredStreaks(days, frozen).values());
  return s;
}

export function unlocked(data) {
  const s = summary(data);
  return ACHIEVEMENTS.filter(a => a[4](s)).map(a => a[0]);
}
