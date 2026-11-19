// Study time screen: a monthly calendar coloured by the time studied each day, and the report of the
// chosen day (total, time per section and what was studied in each), with week and month totals.
import { allDays, dayTotal } from './timelog.js';
import { dayKey, parseDay, addDays } from './habit.js';
import { t, locale } from './i18n.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SECTION = {
  tactics: ['🧩', 'Tactics (Woodpecker)', '#5b9bd5'],
  openings: ['📖', 'Openings', '#e0a33a'],
  courses: ['🎓', 'Opening courses', '#c46a3a'],
  studies: ['📚', 'My studies', '#9b6fd0'],
  structures: ['♟', 'Pawn structures', '#4f9a6a'],
  endgames: ['♔', 'Endgames', '#3aa6a0'],
  coach: ['🔎', 'Game review', '#d05c7a'],
  analysis: ['🔍', 'Analysis', '#8a8f98'],
};
// written out so that the translation check sees each name
const NAMES = () => ({ tactics: t('Tactics (Woodpecker)'), openings: t('Openings'), courses: t('Opening courses'), studies: t('My studies'),
  structures: t('Pawn structures'), endgames: t('Endgames'), coach: t('Game review'), analysis: t('Analysis') });
const secName = s => NAMES()[s] || s;
const secIcon = s => SECTION[s]?.[0] || '•';
const secColor = s => SECTION[s]?.[2] || '#888';

// 3725 -> "1 h 2 min"; 40 -> "< 1 min"
export function fmtTime(sec) {
  const m = Math.round(sec / 60);
  if (sec > 0 && m < 1) return t('< 1 min');
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
}
const sumBy = (days, keys) => {
  const s = {};
  for (const k of keys) for (const [sec, n] of Object.entries(days[k]?.s || {})) s[sec] = (s[sec] || 0) + n;
  return s;
};
const sorted = obj => Object.entries(obj).filter(([, n]) => n >= 30).sort((a, b) => b[1] - a[1]);

// Horizontal bars, one per section
function sectionBars(bySection) {
  const rows = sorted(bySection).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return `<p class="small muted">${t('No study time recorded.')}</p>`;
  const max = rows[0][1];
  return rows.map(([s, n]) => `
    <div class="tm-row">
      <div class="row small"><span>${secIcon(s)} ${esc(secName(s))}</span><strong>${fmtTime(n)}</strong></div>
      <div class="tm-bar"><i style="width:${Math.max(3, Math.round(100 * n / max))}%;background:${secColor(s)}"></i></div>
    </div>`).join('');
}
// The whole day as one bar split by section
function stackBar(bySection) {
  const rows = sorted(bySection);
  const total = rows.reduce((a, [, n]) => a + n, 0);
  if (!total) return '';
  return `<div class="tm-stack">${rows.map(([s, n]) => `<i title="${esc(secName(s))}" style="flex:${n};background:${secColor(s)}"></i>`).join('')}</div>`;
}

let monthOffset = 0;
let selected = null;

export function viewStudyTime(app) {
  app.innerHTML = `<header class="top"><a class="icon-btn" href="#/stats">‹</a><h1>${t('Study time')}</h1><span></span></header>
    <main class="wrap" id="tmMain"><p class="muted">${t('Loading…')}</p></main>`;
  allDays().then(days => render(app.querySelector('#tmMain'), days));
}

function render(main, days) {
  const today = dayKey(new Date());
  selected ||= today;
  // this week (Monday first) and this month
  const now = new Date();
  const monday = addDays(today, -((now.getDay() + 6) % 7));
  const weekKeys = Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter(k => k <= today);
  const monthKeys = Object.keys(days).filter(k => k.slice(0, 7) === today.slice(0, 7));
  const weekTotal = weekKeys.reduce((a, k) => a + dayTotal(days[k]), 0);
  const monthTotal = monthKeys.reduce((a, k) => a + dayTotal(days[k]), 0);
  const studied = Object.keys(days).filter(k => dayTotal(days[k]) >= 60);
  const avg = studied.length ? studied.reduce((a, k) => a + dayTotal(days[k]), 0) / studied.length : 0;

  main.innerHTML = `
    <div class="tm-summary">
      <div class="card tm-kpi"><small class="muted">${t('Today')}</small><strong>${fmtTime(dayTotal(days[today]))}</strong></div>
      <div class="card tm-kpi"><small class="muted">${t('This week')}</small><strong>${fmtTime(weekTotal)}</strong></div>
      <div class="card tm-kpi"><small class="muted">${t('This month')}</small><strong>${fmtTime(monthTotal)}</strong></div>
      <div class="card tm-kpi"><small class="muted">${t('Average per day studied')}</small><strong>${fmtTime(avg)}</strong></div>
    </div>
    <section class="card" id="tmCal"></section>
    <section class="card" id="tmDay"></section>
    <section class="card" id="tmMonth"></section>
    <p class="small muted">${t('Time counts while you use the app: it stops after a few minutes without touching the screen (except while a video plays). Home, settings and statistics do not count. Each device adds its time when you are signed in.')}</p>`;

  const drawCalendar = () => {
    const card = main.querySelector('#tmCal');
    const first = new Date(); first.setDate(1); first.setMonth(first.getMonth() + monthOffset);
    const year = first.getFullYear(), month = first.getMonth();
    const keys = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => dayKey(new Date(year, month, i + 1)));
    const lead = (first.getDay() + 6) % 7;
    const level = sec => (sec < 60 ? 0 : sec < 15 * 60 ? 1 : sec < 30 * 60 ? 2 : sec < 60 * 60 ? 3 : 4);
    const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale(), { weekday: 'narrow' }));
    const title = first.toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
    const total = keys.reduce((a, k) => a + dayTotal(days[k]), 0);
    card.innerHTML = `
      <div class="cal-head">
        <button class="icon-btn" id="tmPrev" aria-label="${t('Previous month')}">‹</button>
        <h2>${title.charAt(0).toUpperCase() + title.slice(1)}</h2>
        <button class="icon-btn" id="tmNext" aria-label="${t('Next month')}" ${monthOffset >= 0 ? 'disabled' : ''}>›</button>
      </div>
      <div class="cal">
        ${weekdays.map(w => `<span class="cal-wd">${w}</span>`).join('')}
        ${'<span></span>'.repeat(lead)}
        ${keys.map((k, i) => {
          const sec = dayTotal(days[k]);
          const lv = level(sec);
          const cls = ['cal-day', k === today ? 'today' : '', k > today ? 'future' : '', lv ? 'lv' + lv : '', k === selected ? 'sel' : ''].filter(Boolean).join(' ');
          return `<button class="${cls}" data-day="${k}" ${k > today ? 'disabled' : ''}>${i + 1}${sec >= 60 ? `<small>${Math.round(sec / 60)}′</small>` : ''}</button>`;
        }).join('')}
      </div>
      <p class="small">${t('Total this month: {t}', { t: fmtTime(total) })}</p>
      <p class="small muted cal-legend"><span><i class="cal-key lv1"></i> &lt; 15 min</span><span><i class="cal-key lv2"></i> &lt; 30 min</span><span><i class="cal-key lv3"></i> &lt; 1 h</span><span><i class="cal-key lv4"></i> ≥ 1 h</span></p>`;
    card.querySelector('#tmPrev').onclick = () => { monthOffset--; drawCalendar(); drawMonth(); };
    card.querySelector('#tmNext').onclick = () => { if (monthOffset < 0) { monthOffset++; drawCalendar(); drawMonth(); } };
    card.querySelectorAll('[data-day]').forEach(b => b.onclick = () => { selected = b.dataset.day; drawCalendar(); drawDay(); });
  };

  // report of the selected day
  const drawDay = () => {
    const card = main.querySelector('#tmDay');
    const d = days[selected];
    const total = dayTotal(d);
    const date = parseDay(selected).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const details = sorted(d?.s || {}).map(([s]) => {
      // the section's own main screen says nothing new
      const items = sorted(d.d?.[s] || {}).filter(([lb]) => lb !== secName(s)).slice(0, 8);
      if (!items.length) return '';
      return `<details class="tm-det"><summary class="small">${secIcon(s)} ${esc(secName(s))}</summary>
        <ul class="small">${items.map(([lb, n]) => `<li><span>${esc(lb)}</span><span class="muted">${fmtTime(n)}</span></li>`).join('')}</ul></details>`;
    }).join('');
    card.innerHTML = `
      <h2 class="section-title">${date.charAt(0).toUpperCase() + date.slice(1)}</h2>
      <p class="tm-total">${total >= 30 ? fmtTime(total) : t('No study time recorded.')}</p>
      ${stackBar(d?.s || {})}
      ${total >= 30 ? sectionBars(d.s) : ''}
      ${details ? `<p class="small muted">${t('What you studied')}</p>${details}` : ''}`;
  };

  // the shown month by section
  const drawMonth = () => {
    const first = new Date(); first.setDate(1); first.setMonth(first.getMonth() + monthOffset);
    const prefix = dayKey(first).slice(0, 7);
    const keys = Object.keys(days).filter(k => k.startsWith(prefix));
    const title = first.toLocaleDateString(locale(), { month: 'long' });
    main.querySelector('#tmMonth').innerHTML = `<h2 class="section-title">${t('By section in {m}', { m: title })}</h2>${sectionBars(sumBy(days, keys))}`;
  };

  drawCalendar();
  drawDay();
  drawMonth();
}

