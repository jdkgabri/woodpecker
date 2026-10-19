// Estadísticas globales de todos los sets.
import * as store from './store.js';
import { habitOn } from './ui-habit.js';
import { addDays, dayKey, parseDay } from './habit.js';

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

export function viewStats(app) {
  const sets = store.sets();
  const raw = store.rawData();
  let solved = 0, ok = 0, time = 0, cyclesDone = 0;
  for (const s of sets) for (const c of s.cycles) {
    const st = store.cycleStats(c);
    solved += st.done; ok += st.ok; time += c.elapsedMs;
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
    cells.push(`<i class="hm ${cls}" title="${parseDay(k).toLocaleDateString('es-ES')}"></i>`);
  }

  const h = habitOn() ? store.habitState() : null;
  const setRows = sets.map(s => {
    const fin = s.cycles.filter(c => c.finishedAt);
    const first = fin[0], last = fin[fin.length - 1];
    let evo = '<span class="muted">Sin ciclos terminados</span>';
    if (first && last && first !== last) {
      const dt = (last.elapsedMs - first.elapsedMs) / first.elapsedMs;
      const da = store.cycleStats(last).acc - store.cycleStats(first).acc;
      evo = `Tiempo <b class="${dt <= 0 ? 'ok-text' : 'bad-text'}">${dt <= 0 ? '−' : '+'}${Math.abs(Math.round(dt * 100))}%</b> · Acierto <b class="${da >= 0 ? 'ok-text' : 'bad-text'}">${da >= 0 ? '+' : '−'}${Math.abs(Math.round(da * 100))} pts</b> <span class="muted">(ciclo 1 → ${last.n})</span>`;
    } else if (last) {
      evo = `Ciclo 1: ${fmt(last.elapsedMs)} · ${pct(store.cycleStats(last).acc)}`;
    }
    const cur = store.currentCycle(s);
    return `<a class="card set-card" href="#/set/${s.id}">
      <div class="row"><strong>${esc(s.name)}</strong><span class="muted small">${fin.length}/${s.targetCycles || '–'} ciclos</span></div>
      <div class="small">${evo}</div>
      ${cur ? `<div class="small muted">En curso: ciclo ${cur.n}, ${cur.pos}/${s.items.length}</div>` : ''}
    </a>`;
  }).join('');

  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/">‹</a><h1>Estadísticas</h1><span></span></header>
    <main class="wrap">
      <section class="kpis">
        <div class="kpi"><b>${solved}</b><span>ejercicios resueltos</span></div>
        <div class="kpi"><b>${solved ? pct(ok / solved) : '–'}</b><span>acierto global</span></div>
        <div class="kpi"><b>${fmtLong(time)}</b><span>entrenando</span></div>
        <div class="kpi"><b>${cyclesDone}</b><span>ciclos completados</span></div>
        <div class="kpi"><b>${days.size}</b><span>días entrenados</span></div>
        ${h ? `<div class="kpi"><b>${h.streak} / ${bestStreak([...days, ...frozen])}</b><span>racha actual / mejor</span></div>` : ''}
      </section>
      <section class="card">
        <h2>Actividad</h2>
        <div class="heatmap">${cells.join('')}</div>
        <p class="small muted">Últimas ${WEEKS} semanas. Cuenta un día si hiciste al menos un ejercicio de un ciclo${h ? ' (❄ en azul: día cubierto con protector)' : ''}.</p>
      </section>
      <h2 class="section-title">Evolución por set</h2>
      ${sets.length ? setRows : '<p class="muted">Aún no tienes sets.</p>'}
    </main>`;
}
