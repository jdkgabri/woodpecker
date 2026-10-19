// Global statistics across all sets.
import * as store from './store.js';
import { habitOn, gamifyOn, levelCard } from './ui-habit.js';
import { addDays, dayKey, parseDay } from './habit.js';
import { themeStats, mostMissed } from './progress.js';
import { resolveItem, themeLabel, wpLevel } from './puzzles.js';
import { openAnalysis, mainLine } from './analysis.js';
import { t, tn, locale } from './i18n.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = x => Math.round(x * 100) + '%';
function fmtLong(ms) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}
function fmt(ms) {
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  const p = n => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(x)}` : `${p(m)}:${p(x)}`;
}

function bestStreak(keys) {
  const sorted = [...new Set(keys)].sort();
  let best = 0, run = 0, prev = null;
  for (const k of sorted) {
    run = prev && addDays(prev, 1) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}

const itemTitle = item => (item.wp ? t('Puzzle {n}', { n: item.wp }) : item.pgn ? t('Puzzle {n}', { n: item.n }) : t('Puzzle {id}', { id: item.id }));
const itemSub = item => (item.wp ? wpLevel(item.wp) : item.rating ? `Elo ${item.rating}` : item.label || '');

export function viewStats(app) {
  const sets = store.sets();
  const raw = store.rawData();
  let done = 0, ok = 0, time = 0, cyclesDone = 0;
  for (const s of sets) for (const c of s.cycles) {
    const st = store.cycleStats(c);
    done += st.done; ok += st.ok; time += c.elapsedMs;
    if (c.finishedAt) cyclesDone++;
  }
  const days = new Set(raw.days);
  const frozen = new Set(habitOn() ? raw.frozen : []);

  // Activity map: last 16 weeks, columns = weeks (Monday on top)
  const today = dayKey(new Date());
  const WEEKS = 16;
  const end = new Date(); end.setDate(end.getDate() + (6 - ((end.getDay() + 6) % 7)));
  const startKey = addDays(dayKey(end), -(WEEKS * 7 - 1));
  const cells = [];
  for (let i = 0; i < WEEKS * 7; i++) {
    const k = addDays(startKey, i);
    const cls = k > today ? 'future' : days.has(k) ? 'done' : frozen.has(k) ? 'frozen' : '';
    cells.push(`<i class="hm ${cls}" title="${parseDay(k).toLocaleDateString(locale())}"></i>`);
  }

  const h = habitOn() ? store.habitState() : null;
  const setRows = sets.map(s => {
    const fin = s.cycles.filter(c => c.finishedAt);
    const first = fin[0], last = fin[fin.length - 1];
    let evo = `<span class="muted">${t('No finished cycles')}</span>`;
    if (first && last && first !== last) {
      const dt = (last.elapsedMs - first.elapsedMs) / first.elapsedMs;
      const da = store.cycleStats(last).acc - store.cycleStats(first).acc;
      evo = `${t('Time')} <b class="${dt <= 0 ? 'ok-text' : 'bad-text'}">${dt <= 0 ? '−' : '+'}${Math.abs(Math.round(dt * 100))}%</b> · ${t('Accuracy')} <b class="${da >= 0 ? 'ok-text' : 'bad-text'}">${da >= 0 ? '+' : '−'}${Math.abs(Math.round(da * 100))} pts</b> <span class="muted">(${t('cycle 1 → {n}', { n: last.n })})</span>`;
    } else if (last) {
      evo = `${t('Cycle {n}', { n: 1 })}: ${fmt(last.elapsedMs)} · ${pct(store.cycleStats(last).acc)}`;
    }
    const cur = store.currentCycle(s);
    return `<a class="card set-card" href="#/set/${s.id}">
      <div class="row"><strong>${esc(s.name)}</strong><span class="muted small">${t('{n}/{m} cycles', { n: fin.length, m: s.targetCycles || '–' })}</span></div>
      <div class="small">${evo}</div>
      ${cur ? `<div class="small muted">${t('In progress: cycle {n}, {p}/{m}', { n: cur.n, p: cur.pos, m: s.items.length })}</div>` : ''}
    </a>`;
  }).join('');

  // Performance by theme (Lichess sets)
  const themes = themeStats(sets).filter(x => x.attempts >= 3);
  const themeHtml = themes.length ? `
    <section class="card">
      <h2>${t('Performance by theme')}</h2>
      ${themes.map(x => `
        <div class="trow">
          <span class="tname">${esc(themeLabel(x.theme))}</span>
          <span class="tbar"><i style="width:${Math.round(x.acc * 100)}%" class="${x.acc >= 0.8 ? 'good' : x.acc >= 0.6 ? 'mid' : 'low'}"></i></span>
          <span class="tval">${pct(x.acc)}</span>
          <small class="muted">${tn(x.attempts, '{n} attempt', '{n} attempts')} · ${Math.round(x.avgMs / 1000)} s</small>
        </div>`).join('')}
      <p class="small muted">${t('From Lichess sets, counting all cycles. Weakest themes at the top.')}</p>
    </section>` : '';

  // Most missed positions
  const missed = mostMissed(sets, 15);
  const setById = new Map(sets.map(s => [s.id, s]));
  const missedHtml = missed.length ? `
    <section class="card">
      <h2>${t('Most missed')}</h2>
      <div class="plist">
        ${missed.map((m, k) => {
          const s = setById.get(m.setId), item = s.items[m.idx];
          return `<button class="prow" data-miss="${k}">
            <span class="pres bad">${m.fails}✗</span>
            <span class="ptitle"><b>${esc(itemTitle(item))}</b> <small class="muted">${esc(s.name)}${itemSub(item) ? ' · ' + esc(itemSub(item)) : ''}</small></span>
            <span class="phist muted small">${t('{f} of {a}', { f: m.fails, a: m.attempts })}</span>
            <span class="ptime ${m.lastOk ? 'ok-text' : 'bad-text'}">${m.lastOk ? '✓' : '✗'}</span>
          </button>`;
        }).join('')}
      </div>
      <p class="small muted">${t('Times failed out of times played; on the right, the result last time. Tap one to analyse it.')}</p>
      <button class="btn ghost" id="missSet">＋ ${t('Create a set with these positions')}</button>
    </section>` : '';

  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/">‹</a><h1>${t('Statistics')}</h1><span></span></header>
    <main class="wrap">
      ${gamifyOn() ? levelCard(false) : ''}
      <section class="kpis">
        <div class="kpi"><b>${done}</b><span>${t('puzzles done')}</span></div>
        <div class="kpi"><b>${done ? pct(ok / done) : '–'}</b><span>${t('overall accuracy')}</span></div>
        <div class="kpi"><b>${fmtLong(time)}</b><span>${t('training')}</span></div>
        <div class="kpi"><b>${cyclesDone}</b><span>${t('cycles completed')}</span></div>
        <div class="kpi"><b>${days.size}</b><span>${t('days trained')}</span></div>
        ${h ? `<div class="kpi"><b>${h.streak} / ${bestStreak([...days, ...frozen])}</b><span>${t('current / best streak')}</span></div>` : ''}
      </section>
      <section class="card">
        <h2>${t('Activity')}</h2>
        <div class="heatmap">${cells.join('')}</div>
        <p class="small muted">${t('Last {n} weeks. A day counts if you did at least one puzzle from a cycle.', { n: WEEKS })}${h ? ' ' + t('In blue, days covered by a streak freeze.') : ''}</p>
      </section>
      ${themeHtml}
      ${missedHtml}
      <h2 class="section-title">${t('Progress by set')}</h2>
      ${sets.length ? setRows : `<p class="muted">${t('You have no sets yet.')}</p>`}
      ${gamifyOn() ? levelCard(true) : ''}
    </main>`;

  app.querySelectorAll('[data-miss]').forEach(b => b.addEventListener('click', async () => {
    const m = missed[+b.dataset.miss];
    const s = setById.get(m.setId);
    const last = s.cycles.filter(c => c.results[m.idx]).pop();
    const p = await resolveItem(s.items[m.idx]);
    openAnalysis({ fen: p.fen, solution: mainLine(p.tree), wrong: last?.results[m.idx]?.w || [], title: p.title, notes: p.notes, ref: last ? { setId: s.id, cycleN: last.n, idx: m.idx } : undefined });
  }));
  app.querySelector('#missSet')?.addEventListener('click', () => {
    const items = missed.map(m => setById.get(m.setId).items[m.idx]);
    const set = store.addSet({
      id: store.uid(), name: t('My most missed ({n})', { n: items.length }), source: 'review', order: 'random',
      targetCycles: 5, createdAt: Date.now(), items: JSON.parse(JSON.stringify(items)), cycles: [],
    });
    location.hash = '#/set/' + set.id;
  });
}
