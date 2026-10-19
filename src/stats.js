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

  // Puzzles done per day (only results saved with a timestamp have a count)
  const perDay = new Map();
  for (const s of sets) for (const c of s.cycles) for (const r of Object.values(c.results)) {
    if (r.t) { const k = dayKey(new Date(r.t)); perDay.set(k, (perDay.get(k) || 0) + 1); }
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
      <section class="card" id="calCard"></section>
      ${themeHtml}
      ${missedHtml}
      <h2 class="section-title">${t('Progress by set')}</h2>
      ${sets.length ? setRows : `<p class="muted">${t('You have no sets yet.')}</p>`}
      ${gamifyOn() ? levelCard(true) : ''}
    </main>`;

  renderCalendar(app.querySelector('#calCard'), { days, frozen, perDay, habit: !!h });

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

// ---------- monthly activity calendar ----------
let monthOffset = 0; // 0 = current month, -1 = previous one...

function renderCalendar(card, { days, frozen, perDay, habit }) {
  const today = dayKey(new Date());
  const first = new Date(); first.setDate(1); first.setMonth(first.getMonth() + monthOffset);
  const year = first.getFullYear(), month = first.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday first
  const keys = Array.from({ length: daysInMonth }, (_, i) => dayKey(new Date(year, month, i + 1)));
  const max = Math.max(1, ...keys.map(k => perDay.get(k) || 0));
  const level = k => {
    const n = perDay.get(k);
    if (!days.has(k)) return 0;
    if (!n) return 1;
    return 1 + Math.min(3, Math.ceil((n / max) * 3));
  };
  const trained = keys.filter(k => days.has(k)).length;
  const puzzles = keys.reduce((a, k) => a + (perDay.get(k) || 0), 0);
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale(), { weekday: 'narrow' }));
  const title = first.toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
  const cell = (k, d) => {
    const cls = ['cal-day', k === today ? 'today' : '', k > today ? 'future' : '',
      days.has(k) ? 'lv' + level(k) : habit && frozen.has(k) ? 'frozen' : ''].filter(Boolean).join(' ');
    return `<button class="${cls}" data-day="${k}">${d}</button>`;
  };
  card.innerHTML = `
    <div class="cal-head">
      <button class="icon-btn" id="calPrev" aria-label="${t('Previous month')}">‹</button>
      <h2>${title.charAt(0).toUpperCase() + title.slice(1)}</h2>
      <button class="icon-btn" id="calNext" aria-label="${t('Next month')}" ${monthOffset >= 0 ? 'disabled' : ''}>›</button>
    </div>
    <div class="cal">
      ${weekdays.map(w => `<span class="cal-wd">${w}</span>`).join('')}
      ${'<span></span>'.repeat(lead)}
      ${keys.map((k, i) => cell(k, i + 1)).join('')}
    </div>
    <p class="small" id="calInfo">${t('{d} days trained this month', { d: trained })}${puzzles ? ' · ' + tn(puzzles, '{n} puzzle', '{n} puzzles') : ''}</p>
    <p class="small muted cal-legend"><span><i class="cal-key lv2"></i> ${t('Trained (darker = more puzzles)')}</span>${habit ? `<span><i class="cal-key frozen"></i> ${t('Streak freeze')}</span>` : ''}</p>`;
  card.querySelector('#calPrev').onclick = () => { monthOffset--; renderCalendar(card, { days, frozen, perDay, habit }); };
  card.querySelector('#calNext').onclick = () => { if (monthOffset < 0) { monthOffset++; renderCalendar(card, { days, frozen, perDay, habit }); } };
  card.querySelectorAll('[data-day]').forEach(b => b.onclick = () => {
    const k = b.dataset.day, n = perDay.get(k);
    const date = parseDay(k).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });
    card.querySelector('#calInfo').textContent = days.has(k)
      ? (n ? `${date}: ${tn(n, '{n} puzzle', '{n} puzzles')}` : `${date}: ${t('trained')}`)
      : habit && frozen.has(k) ? `${date}: ${t('saved with a streak freeze')}`
      : k > today ? date : `${date}: ${t('no training')}`;
  });
}
