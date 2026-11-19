// Games played on Lichess, as study time: for the connected account, each game's duration (from its
// start to its last move) is added to the day it was played, grouped by speed. Correspondence games
// are left out (they last days). The result is kept on this device and only the new games are fetched.
// Cache: { user, from, until, days: { "YYYY-MM-DD": { speed: { sec, n } } } }
import { getAuth, authHeaders } from './lichess.js';
import { dayKey } from './habit.js';

const HOST = 'https://lichess.org';
const KEY = 'wp:lichess-games:v1';
const FIRST_DAYS = 120;          // how far back the first fetch goes
const MAX_GAME = 3 * 3600e3;     // a longer game (an abandoned one) counts as this much
const SPEEDS = ['ultraBullet', 'bullet', 'blitz', 'rapid', 'classical'];

const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
const write = c => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {} };

export const lichessUser = () => getAuth()?.username || null;

// Games between two times (ms), added to `days`
async function fetchRange(user, since, until, days) {
  const url = `${HOST}/api/games/user/${encodeURIComponent(user)}?since=${since}&until=${until}&moves=false&tags=false&clocks=false&evals=false&opening=false`;
  const res = await fetch(url, { headers: { Accept: 'application/x-ndjson', ...authHeaders() } });
  if (!res.ok) throw new Error('Lichess ' + res.status);
  const text = await res.text();
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let g;
    try { g = JSON.parse(line); } catch { continue; }
    // only the range asked for, so that a game is never counted twice
    if (!SPEEDS.includes(g.speed) || !g.createdAt || g.createdAt < since || g.createdAt >= until) continue;
    const ms = Math.min(MAX_GAME, Math.max(0, (g.lastMoveAt || g.createdAt) - g.createdAt));
    const day = (days[dayKey(new Date(g.createdAt))] ||= {});
    const s = (day[g.speed] ||= { sec: 0, n: 0 });
    s.sec += Math.round(ms / 1000);
    s.n++;
  }
}

// Days with games, from `fromMs` (at least) until now; null without a connected account
export async function lichessDays(fromMs) {
  const user = lichessUser();
  if (!user) return null;
  const now = Date.now();
  const want = Math.min(fromMs ?? now, now - FIRST_DAYS * 864e5);
  let c = read();
  if (!c || c.user !== user) {
    c = { user, from: want, until: now, days: {} };
    await fetchRange(user, want, now, c.days);
  } else {
    // the newest games: the whole day of the last fetch again (a game may have been in progress)
    const since = dayStart(c.until);
    for (const d of Object.keys(c.days)) if (d >= dayKey(new Date(since))) delete c.days[d];
    await fetchRange(user, since, now, c.days);
    c.until = now;
  }
  // older months than those already fetched
  if (want < c.from) {
    await fetchRange(user, want, c.from, c.days);
    c.from = want;
  }
  write(c);
  return c.days;
}
const dayStart = ms => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
// What is cached, without fetching (to show something at once)
export const cachedLichessDays = () => (read()?.user === lichessUser() ? read()?.days || null : null);
