// node tests/progress.test.mjs
import { themeStats, mostMissed, computeXp, levelInfo, summary, unlocked } from '../src/progress.js';

let failed = 0;
const check = (name, ok, extra) => { if (!ok) failed++; console.log(ok ? 'OK  ' : 'FAIL', name, ok ? '' : JSON.stringify(extra)); };

const cyc = (n, results, elapsedMs, finished = true) => ({ n, results, elapsedMs, finishedAt: finished ? 1 : null });
const T = new Date(2026, 9, 19, 10).getTime();
const wp = {
  id: 'wp', source: 'woodpecker', items: Array.from({ length: 30 }, (_, i) => ({ wp: i + 1 })),
  cycles: [
    cyc(1, Object.fromEntries(Array.from({ length: 30 }, (_, i) => [i, { ok: i % 3 !== 0, ms: 20000, t: T }])), 600000),
    cyc(2, Object.fromEntries(Array.from({ length: 30 }, (_, i) => [i, { ok: i !== 0, ms: 9000, t: T }])), 270000),
  ],
};
const li = {
  id: 'li', source: 'lichess', lichess: { theme: 'mix' },
  items: [{ id: 'a', themes: ['fork', 'mate'] }, { id: 'b', themes: ['pin'] }, { id: 'c', themes: ['fork'] }],
  cycles: [cyc(1, { 0: { ok: false, ms: 1000 }, 1: { ok: true, ms: 2000 }, 2: { ok: true, ms: 3000 } }, 6000, false)],
};
const data = { sets: [wp, li], days: ['2026-10-17', '2026-10-18', '2026-10-19'], frozen: [] };

const th = themeStats(data.sets);
check('performance by theme', th.find(x => x.theme === 'fork').attempts === 2 && th.find(x => x.theme === 'fork').acc === 0.5 && th[0].acc <= th[th.length - 1].acc, th);
const mm = mostMissed(data.sets);
check('most missed first (failed in both cycles)', mm[0].setId === 'wp' && mm[0].idx === 0 && mm[0].fails === 2 && mm[0].lastOk === false, mm[0]);
const xp = computeXp(data);
// results: cycle 1 20 ok + 10 failed, cycle 2 29 ok + 1 failed, lichess 2 ok + 1 failed
const expected = (20 * 10 + 10 * 3) + (29 * 10 + 1 * 3) + (2 * 10 + 3) + 50 + (50 + 25 + 25) + 5 * (1 + 2 + 3);
check('XP computed', xp === expected, { xp, expected });
const L = levelInfo(xp);
check('level and rank', L.level === Math.floor(Math.sqrt(xp / 50)) + 1 && L.rank === 'Pawn' && L.progress >= 0 && L.progress < 1, L);
check('Knight rank at level 5', levelInfo(50 * 16).rank === 'Knight' && levelInfo(50 * 16).level === 5);
const s = summary(data);
check('summary', s.solved === 51 && s.cycles === 2 && s.half && !s.perfect && !s.fast && s.bestStreak === 3 && s.bestDay === 60 && s.hasLichess, s);
const u = unlocked(data);
check('unlocked achievements', ['first', 'cycle1', 'half', 'day50', 'streak3', 'lichess'].every(x => u.includes(x)) && !u.includes('s100'), u);

process.exit(failed ? 1 : 0);
