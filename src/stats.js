// Estadísticas globales de todos los sets.
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

const itemTitle = item => (item.wp ? t('Ejercicio {n}', { n: item.wp }) : item.pgn ? t('Ejercicio {n}', { n: item.n }) : t('Puzle {id}', { id: item.id }));
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

  // Mapa de actividad: últimas 16 semanas, columnas = semanas (lunes arriba)
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
    let evo = `<span class="muted">${t('Sin ciclos terminados')}</span>`;
    if (first && last && first !== last) {
      const dt = (last.elapsedMs - first.elapsedMs) / first.elapsedMs;
      const da = store.cycleStats(last).acc - store.cycleStats(first).acc;
      evo = `${t('Tiempo')} <b class="${dt <= 0 ? 'ok-text' : 'bad-text'}">${dt <= 0 ? '−' : '+'}${Math.abs(Math.round(dt * 100))}%</b> · ${t('Acierto')} <b class="${da >= 0 ? 'ok-text' : 'bad-text'}">${da >= 0 ? '+' : '−'}${Math.abs(Math.round(da * 100))} pts</b> <span class="muted">(${t('ciclo 1 → {n}', { n: last.n })})</span>`;
    } else if (last) {
      evo = `${t('Ciclo {n}', { n: 1 })}: ${fmt(last.elapsedMs)} · ${pct(store.cycleStats(last).acc)}`;
    }
    const cur = store.currentCycle(s);
    return `<a class="card set-card" href="#/set/${s.id}">
      <div class="row"><strong>${esc(s.name)}</strong><span class="muted small">${t('{n}/{m} ciclos', { n: fin.length, m: s.targetCycles || '–' })}</span></div>
      <div class="small">${evo}</div>
      ${cur ? `<div class="small muted">${t('En curso: ciclo {n}, {p}/{m}', { n: cur.n, p: cur.pos, m: s.items.length })}</div>` : ''}
    </a>`;
  }).join('');

  // Rendimiento por tema (sets de Lichess)
  const themes = themeStats(sets).filter(x => x.attempts >= 3);
  const themeHtml = themes.length ? `
    <section class="card">
      <h2>${t('Rendimiento por tema')}</h2>
      ${themes.map(x => `
        <div class="trow">
          <span class="tname">${esc(themeLabel(x.theme))}</span>
          <span class="tbar"><i style="width:${Math.round(x.acc * 100)}%" class="${x.acc >= 0.8 ? 'good' : x.acc >= 0.6 ? 'mid' : 'low'}"></i></span>
          <span class="tval">${pct(x.acc)}</span>
          <small class="muted">${tn(x.attempts, '{n} intento', '{n} intentos')} · ${Math.round(x.avgMs / 1000)} s</small>
        </div>`).join('')}
      <p class="small muted">${t('De los sets de Lichess, contando todos los ciclos. Los temas más flojos, arriba.')}</p>
    </section>` : '';

  // Posiciones que más fallas
  const missed = mostMissed(sets, 15);
  const setById = new Map(sets.map(s => [s.id, s]));
  const missedHtml = missed.length ? `
    <section class="card">
      <h2>${t('Las que más fallas')}</h2>
      <div class="plist">
        ${missed.map((m, k) => {
          const s = setById.get(m.setId), item = s.items[m.idx];
          return `<button class="prow" data-miss="${k}">
            <span class="pres bad">${m.fails}✗</span>
            <span class="ptitle"><b>${esc(itemTitle(item))}</b> <small class="muted">${esc(s.name)}${itemSub(item) ? ' · ' + esc(itemSub(item)) : ''}</small></span>
            <span class="phist muted small">${t('{f} de {a}', { f: m.fails, a: m.attempts })}</span>
            <span class="ptime ${m.lastOk ? 'ok-text' : 'bad-text'}">${m.lastOk ? '✓' : '✗'}</span>
          </button>`;
        }).join('')}
      </div>
      <p class="small muted">${t('Veces fallada de las veces jugada; a la derecha, el resultado la última vez. Toca una para analizarla.')}</p>
      <button class="btn ghost" id="missSet">＋ ${t('Crear un set con estas posiciones')}</button>
    </section>` : '';

  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/">‹</a><h1>${t('Estadísticas')}</h1><span></span></header>
    <main class="wrap">
      ${gamifyOn() ? levelCard(false) : ''}
      <section class="kpis">
        <div class="kpi"><b>${done}</b><span>${t('ejercicios hechos')}</span></div>
        <div class="kpi"><b>${done ? pct(ok / done) : '–'}</b><span>${t('acierto global')}</span></div>
        <div class="kpi"><b>${fmtLong(time)}</b><span>${t('entrenando')}</span></div>
        <div class="kpi"><b>${cyclesDone}</b><span>${t('ciclos completados')}</span></div>
        <div class="kpi"><b>${days.size}</b><span>${t('días entrenados')}</span></div>
        ${h ? `<div class="kpi"><b>${h.streak} / ${bestStreak([...days, ...frozen])}</b><span>${t('racha actual / mejor')}</span></div>` : ''}
      </section>
      <section class="card">
        <h2>${t('Actividad')}</h2>
        <div class="heatmap">${cells.join('')}</div>
        <p class="small muted">${t('Últimas {n} semanas. Cuenta un día si hiciste al menos un ejercicio de un ciclo.', { n: WEEKS })}${h ? ' ' + t('En azul, días cubiertos con un protector.') : ''}</p>
      </section>
      ${themeHtml}
      ${missedHtml}
      <h2 class="section-title">${t('Evolución por set')}</h2>
      ${sets.length ? setRows : `<p class="muted">${t('Aún no tienes sets.')}</p>`}
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
      id: store.uid(), name: t('Las que más fallo ({n})', { n: items.length }), source: 'review', order: 'random',
      targetCycles: 5, createdAt: Date.now(), items: JSON.parse(JSON.stringify(items)), cycles: [],
    });
    location.hash = '#/set/' + set.id;
  });
}
