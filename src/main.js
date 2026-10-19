import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import './style.css';

import * as store from './store.js';
import { wpLevel as wpLevelLabel, WP_LEVELS, WP_TOTAL, LICHESS_THEMES, LICHESS_DIFFS, resolveItem, fetchLichessPuzzles, loadWoodpecker } from './puzzles.js';
import { PuzzleBoard } from './puzzleboard.js';
import * as lichess from './lichess.js';
import * as sync from './sync.js';
import { viewAnalysis, openAnalysis, mainLine } from './analysis.js';

const app = document.getElementById('app');
let cleanup = null; // función de salida de la vista actual

// ---------- utilidades ----------
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel, root = app) => root.querySelector(sel);
function fmt(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  const p = n => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(x)}` : `${p(m)}:${p(x)}`;
}
const pct = x => Math.round(x * 100) + '%';
const date = t => new Date(t).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
const go = h => { location.hash = h; };

// ---------- instalación PWA ----------
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (location.hash === '' || location.hash === '#/') route(); });
// Pedir almacenamiento persistente para que Android no borre los datos
navigator.storage?.persist?.().catch(() => {});

// ---------- router ----------
function route() {
  if (cleanup) { cleanup(); cleanup = null; }
  window.scrollTo(0, 0);
  const [, view, id] = (location.hash.slice(1) || '/').split('/');
  if (view === 'new') return viewNew();
  if (view === 'set') return viewSet(id);
  if (view === 'train') return viewTrain(id);
  if (view === 'review') return viewReview(id);
  if (view === 'cycle') return viewCycle(id, +location.hash.split('/')[3]);
  if (view === 'settings') return viewSettings();
  if (view === 'analysis') { cleanup = viewAnalysis(app); return; }
  return viewHome();
}
window.addEventListener('hashchange', route);

// ---------- inicio ----------
function viewHome() {
  const sets = store.sets();
  const streak = store.streak();
  app.innerHTML = `
    <header class="top">
      <h1><span class="logo">♞</span> Woodpecker</h1>
      <div class="top-right">
        ${streak ? `<span class="badge" title="Racha de días">🔥 ${streak}</span>` : ''}
        ${syncBadge()}
        <a class="icon-btn" href="#/settings" aria-label="Ajustes">⚙</a>
      </div>
    </header>
    <main class="wrap">
      ${installEvt ? `<button class="btn ghost full" id="install">📲 Instalar la app</button>` : ''}
      <a class="btn primary full" href="#/new">＋ Nuevo set</a>
      ${sets.length ? '' : `
        <section class="card">
          <h2>Empieza con el método Woodpecker</h2>
          <p class="muted">Los 1128 ejercicios del libro, repetidos en ciclos cada vez más rápidos.</p>
          <div class="chips">
            ${WP_LEVELS.slice(0, 3).map(l => `<button class="chip" data-quick="${l.key}">${l.label} <small>${l.from}–${l.to}</small></button>`).join('')}
          </div>
        </section>`}
      <section class="list">
        ${sets.map(setCard).join('')}
      </section>
    </main>`;
  $('#install')?.addEventListener('click', async () => { installEvt.prompt(); await installEvt.userChoice; installEvt = null; route(); });
  app.querySelectorAll('[data-quick]').forEach(b => b.addEventListener('click', () => {
    const l = WP_LEVELS.find(x => x.key === b.dataset.quick);
    const set = createWpSet(l.from, l.to, 'seq', `Woodpecker ${l.label.toLowerCase()} (${l.from}–${l.to})`);
    go('#/set/' + set.id);
  }));
}

function syncBadge() {
  const st = sync.state;
  if (!st.configured || !st.user) return '';
  const icon = { ok: '☁︎ ✓', syncing: '☁︎ …', error: '☁︎ ⚠' }[st.status] || '☁︎';
  return `<a class="badge ${st.status === 'error' ? 'bad' : ''}" href="#/settings" title="Sincronización">${icon}</a>`;
}

function setCard(set) {
  const cur = store.currentCycle(set);
  const fin = set.cycles.filter(c => c.finishedAt).length;
  const st = cur ? store.cycleStats(cur) : null;
  return `
    <a class="card set-card" href="#/set/${set.id}">
      <div class="row">
        <strong>${esc(set.name)}</strong>
        <span class="muted">${set.items.length} ejercicios</span>
      </div>
      <div class="row muted small">
        <span>${fin} ciclo${fin === 1 ? '' : 's'} completado${fin === 1 ? '' : 's'}${set.targetCycles ? ' de ' + set.targetCycles : ''}</span>
        ${cur ? `<span>Ciclo ${cur.n}: ${cur.pos}/${set.items.length} · ${fmt(cur.elapsedMs)}</span>` : ''}
      </div>
      ${cur ? `<div class="bar"><i style="width:${(cur.pos / set.items.length) * 100}%"></i></div>` : ''}
      ${st && st.done ? `<div class="small muted">Acierto del ciclo: ${pct(st.acc)}</div>` : ''}
    </a>`;
}

function createWpSet(from, to, order, name, targetCycles = 7) {
  const items = [];
  for (let n = from; n <= to; n++) items.push({ wp: n });
  return store.addSet({ id: store.uid(), name, source: 'woodpecker', range: [from, to], order, targetCycles, createdAt: Date.now(), items, cycles: [] });
}

// ---------- nuevo set ----------
function viewNew() {
  let tab = 'wp';
  const render = () => {
    app.innerHTML = `
      <header class="top"><a class="icon-btn" href="#/">‹</a><h1>Nuevo set</h1><span></span></header>
      <main class="wrap">
        <div class="tabs">
          <button class="tab ${tab === 'wp' ? 'on' : ''}" data-tab="wp">The Woodpecker Method</button>
          <button class="tab ${tab === 'li' ? 'on' : ''}" data-tab="li">Lichess</button>
        </div>
        ${tab === 'wp' ? formWp() : formLichess()}
      </main>`;
    app.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
    tab === 'wp' ? bindWp() : bindLichess();
  };
  render();
}

function formWp() {
  return `
    <section class="card form">
      <label>Nivel</label>
      <div class="chips" id="levels">
        ${WP_LEVELS.map((l, i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-from="${l.from}" data-to="${l.to}">${l.label}<small>${l.from}–${l.to}</small></button>`).join('')}
        <button class="chip" data-custom="1">Personalizado</button>
      </div>
      <div class="grid2">
        <div><label for="from">Desde el nº</label><input id="from" type="number" min="1" max="${WP_TOTAL}" value="1" inputmode="numeric"></div>
        <div><label for="to">Hasta el nº</label><input id="to" type="number" min="1" max="${WP_TOTAL}" value="222" inputmode="numeric"></div>
      </div>
      <p class="muted small" id="count"></p>
      <label for="order">Orden</label>
      <select id="order">
        <option value="seq">Orden del libro</option>
        <option value="random">Aleatorio (se baraja en cada ciclo)</option>
      </select>
      <label for="cycles">Ciclos objetivo</label>
      <input id="cycles" type="number" min="1" max="20" value="7" inputmode="numeric">
      <label for="name">Nombre</label>
      <input id="name" type="text" placeholder="Woodpecker fáciles (1–222)">
      <button class="btn primary full" id="create">Crear set</button>
    </section>
    <p class="muted small">Niveles del libro: 1–222 fáciles, 223–984 intermedios, 985–1128 avanzados.
    Las soluciones se han calculado con Stockfish; si una jugada tuya también gana y no se acepta, puedes marcarla como correcta.</p>`;
}

function bindWp() {
  const from = $('#from'), to = $('#to'), name = $('#name');
  let nameTouched = false;
  const levelName = () => {
    const a = +from.value, b = +to.value;
    const l = WP_LEVELS.find(x => x.from === a && x.to === b);
    return `Woodpecker ${l ? l.label.toLowerCase() + ' ' : ''}(${a}–${b})`;
  };
  const upd = () => {
    const a = Math.max(1, Math.min(WP_TOTAL, +from.value || 1));
    const b = Math.max(1, Math.min(WP_TOTAL, +to.value || 1));
    $('#count').textContent = b >= a ? `${b - a + 1} ejercicios` : 'El rango no es válido';
    if (!nameTouched) name.value = levelName();
    app.querySelectorAll('#levels .chip').forEach(c => c.classList.toggle('on', c.dataset.from == a && c.dataset.to == b));
    if (!app.querySelector('#levels .chip.on')) app.querySelector('[data-custom]').classList.add('on');
  };
  app.querySelectorAll('#levels .chip').forEach(c => c.addEventListener('click', () => {
    if (c.dataset.custom) { from.focus(); return; }
    from.value = c.dataset.from; to.value = c.dataset.to; upd();
  }));
  from.addEventListener('input', upd);
  to.addEventListener('input', upd);
  name.addEventListener('input', () => { nameTouched = true; });
  upd();
  $('#create').addEventListener('click', () => {
    const a = +from.value, b = +to.value;
    if (!(a >= 1 && b <= WP_TOTAL && b >= a)) return alert('Rango no válido (1–1128).');
    const set = createWpSet(a, b, $('#order').value, name.value.trim() || levelName(), +$('#cycles').value || 7);
    go('#/set/' + set.id);
  });
}

function formLichess() {
  const a = lichess.getAuth();
  const ref = a?.puzzleRating ? `tu Elo de puzles (${a.puzzleRating})` : 'un Elo de unos 1500 (conecta tu cuenta para usar el tuyo)';
  return `
    ${lichessNotice()}
    <section class="card form">
      <label for="theme">Tema</label>
      <select id="theme">${LICHESS_THEMES.map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      <label>Dificultad</label>
      <div class="tabs small-tabs">
        <button class="tab on" data-mode="rel">Relativa a mi Elo</button>
        <button class="tab" data-mode="abs">Rango de Elo</button>
      </div>
      <div id="modeRel">
        <select id="diff">${LICHESS_DIFFS.map(([k, v]) => `<option value="${k}" ${k === 'normal' ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <p class="muted small">Respecto a ${ref}. Cada nivel sube o baja unos 300 puntos.</p>
      </div>
      <div id="modeAbs" hidden>
        <div class="grid2">
          <div><label for="minR">Elo mínimo</label><input id="minR" type="number" min="400" max="3200" step="50" value="1400" inputmode="numeric"></div>
          <div><label for="maxR">Elo máximo</label><input id="maxR" type="number" min="400" max="3200" step="50" value="1600" inputmode="numeric"></div>
        </div>
        <p class="muted small">${a ? 'Con tu cuenta se alcanzan aproximadamente 600 puntos por encima y por debajo de tu Elo de puzles.' : 'Sin cuenta se alcanzan aproximadamente de 800 a 2300.'}</p>
      </div>
      <label for="n">Número de puzles</label>
      <input id="n" type="number" min="10" max="500" value="100" inputmode="numeric">
      <label for="order">Orden</label>
      <select id="order">
        <option value="seq">Fijo</option>
        <option value="random">Aleatorio (se baraja en cada ciclo)</option>
      </select>
      <label for="cycles">Ciclos objetivo</label>
      <input id="cycles" type="number" min="1" max="20" value="5" inputmode="numeric">
      <label for="name">Nombre</label>
      <input id="name" type="text" placeholder="Automático">
      <button class="btn primary full" id="create">Descargar y crear</button>
      <p class="muted small" id="status"></p>
    </section>
    <p class="muted small">Se descargan una sola vez desde la base de puzles de Lichess y quedan guardados para usarlos sin conexión.</p>`;
}

function lichessNotice() {
  const a = lichess.getAuth();
  return a
    ? `<p class="small muted">Conectado a Lichess como <b>${esc(a.username || '')}</b>${a.puzzleRating ? ` · Elo de puzles ${a.puzzleRating}` : ''}</p>`
    : `<section class="card"><p class="small">Conecta tu cuenta de Lichess para que la dificultad relativa use tu Elo de puzles y llegar a rangos más altos o más bajos.</p>
       <button class="btn ghost" id="liLogin">Conectar con Lichess</button></section>`;
}

function bindLichess() {
  $('#liLogin')?.addEventListener('click', () => lichess.login());
  let mode = 'rel';
  app.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    app.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x === b));
    $('#modeRel').hidden = mode !== 'rel';
    $('#modeAbs').hidden = mode !== 'abs';
  }));
  let ctrl = null;
  cleanup = () => ctrl?.abort();
  $('#create').addEventListener('click', async e => {
    const btn = e.currentTarget;
    const status = msg => { if ($('#status')) $('#status').textContent = msg; };
    const theme = $('#theme').value;
    const count = Math.max(10, Math.min(500, +$('#n').value || 100));
    const tName = LICHESS_THEMES.find(t => t[0] === theme)[1];
    const opts = { theme, count };
    let label;
    if (mode === 'rel') {
      opts.difficulty = $('#diff').value;
      label = LICHESS_DIFFS.find(d => d[0] === opts.difficulty)[1].toLowerCase();
    } else {
      opts.minRating = +$('#minR').value;
      opts.maxRating = +$('#maxR').value;
      if (!(opts.minRating > 0 && opts.maxRating >= opts.minRating)) return status('El rango de Elo no es válido.');
      opts.baseRating = lichess.getAuth()?.puzzleRating || 1500;
      label = `${opts.minRating}–${opts.maxRating}`;
    }
    const name = $('#name').value.trim() || `Lichess · ${tName} (${label})`;
    btn.disabled = true;
    ctrl = new AbortController();
    try {
      const { items, complete } = await fetchLichessPuzzles(opts, (n, msg) => status(msg || `Descargando… ${n}/${count}`), ctrl.signal);
      if (!items.length) throw new Error('No se encontraron puzles con esos criterios. Prueba un rango más amplio.');
      if (!complete && !confirm(`Solo se encontraron ${items.length} de ${count} puzles con esos criterios. ¿Crear el set con ${items.length}?`)) {
        btn.disabled = false;
        return status('');
      }
      const ratings = items.map(x => x.rating);
      const set = store.addSet({
        id: store.uid(), name, source: 'lichess', order: $('#order').value, targetCycles: +$('#cycles').value || 5, createdAt: Date.now(),
        lichess: { theme, mode, difficulty: opts.difficulty, minRating: opts.minRating, maxRating: opts.maxRating, eloMin: Math.min(...ratings), eloMax: Math.max(...ratings), eloAvg: Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) },
        items, cycles: [],
      });
      go('#/set/' + set.id);
    } catch (err) {
      status('Error: ' + err.message);
      btn.disabled = false;
    }
  });
}

// ---------- detalle del set ----------
function viewSet(id) {
  const set = store.getSet(id);
  if (!set) return go('#/');
  const cur = store.currentCycle(set);
  const finished = set.cycles.filter(c => c.finishedAt);
  const last = set.cycles[set.cycles.length - 1];
  const failedIdx = last ? Object.entries(last.results).filter(([, r]) => !r.ok).map(([k]) => +k) : [];
  const prev = finished[finished.length - 1];
  const target = prev ? prev.elapsedMs / 2 : null;
  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/">‹</a><h1 class="ellipsis">${esc(set.name)}</h1>
      <button class="icon-btn" id="menu" aria-label="Opciones">⋯</button></header>
    <main class="wrap">
      <section class="card opts" id="opts" hidden>
        <button class="btn ghost" id="rename">Renombrar</button>
        ${cur ? '<button class="btn ghost" id="reset">Reiniciar ciclo en curso</button>' : ''}
        <button class="btn danger" id="del">Borrar set</button>
      </section>
      <section class="card">
        <div class="row"><span class="muted">${set.source === 'woodpecker' ? `The Woodpecker Method · nº ${set.range[0]}–${set.range[1]}` : `Lichess · ${esc(LICHESS_THEMES.find(t => t[0] === set.lichess?.theme)?.[1] || 'puzles')}${set.lichess?.eloAvg ? ` · Elo ${set.lichess.eloMin}–${set.lichess.eloMax} (media ${set.lichess.eloAvg})` : ''}`}</span>
        <span class="muted">${set.items.length} ejercicios</span></div>
        <div class="row muted small"><span>${set.order === 'random' ? 'Orden aleatorio' : set.source === 'woodpecker' ? 'Orden del libro' : 'Orden fijo'}</span>
        <span>${finished.length}/${set.targetCycles || '–'} ciclos</span></div>
        ${cur ? `
          <div class="bar big"><i style="width:${(cur.pos / set.items.length) * 100}%"></i></div>
          <div class="row small"><span>Ciclo ${cur.n}: ${cur.pos}/${set.items.length}</span><span>⏱ ${fmt(cur.elapsedMs)}</span></div>
          <a class="btn primary full" href="#/train/${set.id}">▶ Continuar ciclo ${cur.n}</a>
        ` : `
          ${target ? `<p class="small muted">Objetivo del método: completar el ciclo ${set.cycles.length + 1} en la mitad de tiempo (≈ ${fmt(target)}).</p>` : ''}
          <button class="btn primary full" id="start">▶ Empezar ciclo ${set.cycles.length + 1}</button>
        `}
        ${failedIdx.length ? `<a class="btn ghost full" href="#/review/${set.id}">Repasar fallos del ciclo ${last.n} (${failedIdx.length})</a>` : ''}
      </section>
      ${set.cycles.length ? `
      <section class="card">
        <h2>Ciclos</h2>
        ${chart(set)}
        <table class="tbl">
          <thead><tr><th>#</th><th>Inicio</th><th>Tiempo</th><th>Hechos</th><th>Acierto</th></tr></thead>
          <tbody>${set.cycles.map(c => {
            const st = store.cycleStats(c);
            return `<tr class="${c.finishedAt ? '' : 'live'} clickable" data-cycle="${c.n}"><td>${c.n} ›</td><td>${date(c.startedAt)}</td><td>${fmt(c.elapsedMs)}</td>
              <td>${st.done}/${set.items.length}</td><td>${st.done ? pct(st.acc) : '–'}</td></tr>`;
          }).join('')}</tbody>
        </table>
        <p class="small muted">Toca un ciclo para ver sus ejercicios uno a uno y analizarlos.</p>
        ${finished.length ? `<p class="small muted">Tiempo medio por ejercicio en el último ciclo: ${fmt(prev.elapsedMs / set.items.length)}</p>` : ''}
      </section>` : ''}
    </main>`;
  $('#start')?.addEventListener('click', () => { store.startCycle(set); go('#/train/' + set.id); });
  app.querySelectorAll('[data-cycle]').forEach(r => r.addEventListener('click', () => go(`#/cycle/${set.id}/${r.dataset.cycle}`)));
  $('#menu').addEventListener('click', () => { $('#opts').hidden = !$('#opts').hidden; });
  $('#rename').onclick = () => {
    const n = prompt('Nuevo nombre', set.name);
    if (n && n.trim()) { set.name = n.trim(); store.save(); route(); }
  };
  $('#reset') && ($('#reset').onclick = () => {
    if (confirm('¿Reiniciar el ciclo en curso? Se perderá su progreso.')) { set.cycles.pop(); store.save(); route(); }
  });
  $('#del').onclick = () => {
    if (confirm(`¿Borrar "${set.name}" y todo su historial?`)) { store.deleteSet(set.id); go('#/'); }
  };
}

function chart(set) {
  const cs = set.cycles.filter(c => c.finishedAt);
  if (cs.length < 1) return '';
  const max = Math.max(...cs.map(c => c.elapsedMs));
  const W = 300, H = 120, bw = Math.min(40, (W - 20) / cs.length - 8);
  const bars = cs.map((c, i) => {
    const h = (c.elapsedMs / max) * (H - 30);
    const x = 10 + i * ((W - 20) / cs.length) + 4;
    const acc = store.cycleStats(c).acc;
    return `<rect x="${x}" y="${H - 18 - h}" width="${bw}" height="${h}" rx="3" class="cbar"/>
      <text x="${x + bw / 2}" y="${H - 22 - h}" class="clabel">${fmt(c.elapsedMs)}</text>
      <text x="${x + bw / 2}" y="${H - 5}" class="clabel">C${c.n} · ${pct(acc)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Tiempo por ciclo">${bars}</svg>`;
}

// ---------- entrenamiento (ciclo cronometrado) ----------
async function viewTrain(id) {
  const set = store.getSet(id);
  if (!set) return go('#/');
  const cycle = store.currentCycle(set);
  if (!cycle) return go('#/set/' + id);
  const settings = store.getSettings();
  store.touchActivity();
  store.setLocked(set.id);

  app.innerHTML = `
    <div class="train">
      <header class="top"><a class="icon-btn" href="#/set/${set.id}">‹</a>
        <h1 class="ellipsis">Ciclo ${cycle.n} · ${esc(set.name)}</h1>
        <button class="icon-btn pause-btn" id="pause" aria-label="Pausar">⏸</button></header>
      <div class="stats">
        <div><small>Ciclo</small><b id="tCycle">00:00</b></div>
        <div><small>Ejercicio</small><b id="tPuzzle">00:00</b></div>
        <div><small>Progreso</small><b id="prog"></b></div>
        <div><small>Acierto</small><b id="acc"></b></div>
      </div>
      <div class="board-wrap">
        <div class="board" id="board"></div>
        <div class="overlay" id="overlay"><div>
          <p id="ovText">Listo para continuar</p>
          <button class="btn primary" id="resume">▶ Empezar</button></div></div>
      </div>
      <div class="info">
        <div class="turn" id="turn"></div>
        <div class="feedback" id="fb"></div>
      </div>
      <div class="actions" id="actions"></div>
    </div>`;

  const board = new PuzzleBoard($('#board'), { coords: settings.coords, onEvent });
  let running = false, runStart = 0;
  let curMs = cycle.curMs || 0;        // tiempo del ejercicio actual
  let puzzle = null, solved = false, advanceTimer = null, tickTimer = null;
  let wrongMoves = [];
  // último ejercicio terminado, para poder analizarlo aunque se haya pasado al siguiente
  const PREV_KEY = 'wp:prev:' + set.id;
  let prevPayload = null;
  try { prevPayload = JSON.parse(sessionStorage.getItem(PREV_KEY) || 'null'); } catch {}

  const now = () => performance.now();
  const live = () => (running ? now() - runStart : 0);

  function commit() {
    if (!running) return;
    const d = now() - runStart;
    cycle.elapsedMs += d;
    curMs += d;
    runStart = now();
    cycle.curMs = curMs;
    store.save();
  }
  function pause(text = 'En pausa') {
    if (!running) return;
    commit();
    running = false;
    board.setPaused(true);
    $('#ovText').textContent = text;
    $('#resume').textContent = '▶ Reanudar';
    $('#overlay').classList.add('show');
    $('#overlay').classList.toggle('hide-board', settings.hidePaused);
    $('#pause').textContent = '▶';
    tick();
    sync.flush().catch(() => {});
  }
  function resume() {
    if (running) return;
    running = true;
    runStart = now();
    board.setPaused(false);
    $('#overlay').classList.remove('show');
    $('#pause').textContent = '⏸';
  }
  function tick() {
    $('#tCycle').textContent = fmt(cycle.elapsedMs + live());
    $('#tPuzzle').textContent = fmt(curMs + (solved ? 0 : live()));
  }

  function updHeader() {
    const st = store.cycleStats(cycle);
    $('#prog').textContent = `${Math.min(cycle.pos + (solved ? 0 : 1), set.items.length)}/${set.items.length}`;
    $('#acc').textContent = st.done ? pct(st.acc) : '–';
  }

  async function loadCurrent() {
    clearTimeout(advanceTimer);
    if (cycle.pos >= set.items.length) return finishCycle();
    const idx = cycle.order[cycle.pos];
    puzzle = await resolveItem(set.items[idx]);
    solved = false;
    wrongMoves = [];
    board.load(puzzle);
    board.failed = !!cycle.curFailed;
    board.setPaused(!running);
    const white = board.hero === 'w';
    $('#turn').innerHTML = `<span class="dot ${white ? 'w' : 'b'}"></span> <b>${esc(puzzle.title)}</b> · Juegan ${white ? 'blancas' : 'negras'} <span class="muted">${esc(puzzle.sub || '')}</span>`;
    feedback('', '');
    renderActions();
    updHeader();
  }

  function feedback(cls, html) {
    const fb = $('#fb');
    fb.className = 'feedback ' + cls;
    fb.innerHTML = html;
  }

  function renderActions() {
    const a = $('#actions');
    if (solved) {
      const r = cycle.results[cycle.order[cycle.pos - 1]];
      a.innerHTML = `
        ${r && !r.ok ? `<button class="btn ghost" id="markOk">✓ Contar como correcta</button>` : ''}
        <button class="btn ghost" id="analyse">🔍 Analizar</button>
        <button class="btn primary" id="next">Siguiente ›</button>`;
      $('#next').onclick = loadCurrent;
      $('#analyse').onclick = () => openAnalysis(prevPayload);
      $('#markOk') && ($('#markOk').onclick = () => {
        r.ok = true; store.save(); updHeader();
        feedback('ok', '✓ Marcada como correcta'); renderActions();
      });
    } else {
      a.innerHTML = `
        ${prevPayload ? `<button class="btn ghost" id="prevAn">🔍 Analizar el anterior</button>` : ''}
        <button class="btn ghost" id="sol">Ver solución</button>`;
      $('#prevAn') && ($('#prevAn').onclick = () => { pause(); openAnalysis(prevPayload); });
      $('#sol').onclick = () => {
        if (!running) return;
        cycle.curFailed = true; store.save();
        board.showSolution();
      };
    }
  }

  function onEvent(type, info) {
    if (type === 'wrong') {
      cycle.curFailed = true; store.save();
      if (!wrongMoves.includes(info.uci)) wrongMoves.push(info.uci);
      feedback('bad', `✗ ${esc(info.san)} no es la solución. Inténtalo otra vez.`);
    } else if (type === 'good') {
      feedback('ok', '✓ ¡Bien! Sigue…');
    } else if (type === 'progress') {
      feedback('ok', '✓ Sigue, te toca');
    } else if (type === 'solved') {
      commit();
      const idx = cycle.order[cycle.pos];
      const ok = info.ok && !cycle.curFailed;
      cycle.results[idx] = { ok, ms: Math.round(curMs), ...(wrongMoves.length ? { w: wrongMoves.slice(0, 5) } : {}) };
      prevPayload = {
        fen: puzzle.fen, solution: mainLine(puzzle.tree), wrong: wrongMoves, title: puzzle.title,
        ref: { setId: set.id, cycleN: cycle.n, idx },
      };
      try { sessionStorage.setItem(PREV_KEY, JSON.stringify(prevPayload)); } catch {}
      cycle.pos++;
      cycle.curMs = 0; cycle.curFailed = false;
      curMs = 0;
      solved = true;
      store.save();
      updHeader();
      feedback(ok ? 'ok' : 'bad', ok ? '✓ ¡Correcto!' : 'Ejercicio fallado — queda para repasar');
      renderActions();
      if (ok && settings.autoNext) advanceTimer = setTimeout(() => { if (running) loadCurrent(); }, 700);
    }
  }

  function finishCycle() {
    commit();
    running = false;
    cycle.finishedAt = Date.now();
    delete cycle.curMs; delete cycle.curFailed;
    store.save();
    const st = store.cycleStats(cycle);
    const prev = set.cycles[set.cycles.length - 2];
    app.querySelector('.train').innerHTML = `
      <header class="top"><a class="icon-btn" href="#/set/${set.id}">‹</a><h1>Ciclo ${cycle.n} completado</h1><span></span></header>
      <main class="wrap"><section class="card center">
        <div class="big-num">${fmt(cycle.elapsedMs)}</div>
        <p>${st.ok}/${st.done} correctos · ${pct(st.acc)} de acierto</p>
        ${prev ? `<p class="muted">Ciclo anterior: ${fmt(prev.elapsedMs)} · ${pct(store.cycleStats(prev).acc)}</p>` : ''}
        <p class="muted small">El método recomienda descansar y repetir el set en la mitad de tiempo.</p>
        <a class="btn primary full" href="#/set/${set.id}">Volver al set</a>
      </section></main>`;
  }

  // Pausa automática al salir de la app o bloquear el móvil
  const onVis = () => {
    if (document.hidden && settings.autoPause) pause('Pausado automáticamente');
    else commit();
  };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('pagehide', onVis);
  const onKey = e => {
    if (e.key === ' ' || e.key === 'p') { e.preventDefault(); running ? pause() : resume(); }
  };
  document.addEventListener('keydown', onKey);

  $('#pause').onclick = () => (running ? pause() : resume());
  $('#resume').onclick = resume;
  $('#overlay').classList.add('show');
  $('#overlay').classList.toggle('hide-board', settings.hidePaused);
  $('#ovText').textContent = cycle.pos === 0 && !cycle.elapsedMs ? `Ciclo ${cycle.n} · ${set.items.length} ejercicios` : 'Ciclo en pausa';
  $('#resume').textContent = cycle.pos === 0 && !cycle.elapsedMs ? '▶ Empezar' : '▶ Reanudar';
  $('#pause').textContent = '▶';
  tickTimer = setInterval(() => { tick(); if (running && Math.random() < 0.05) commit(); }, 250);

  cleanup = () => {
    commit();
    store.setLocked(null);
    sync.flush().catch(() => {});
    running = false;
    clearInterval(tickTimer);
    clearTimeout(advanceTimer);
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('pagehide', onVis);
    document.removeEventListener('keydown', onKey);
    board.destroy();
  };

  try { await loadCurrent(); }
  catch (e) { feedback('bad', 'Error cargando ejercicio: ' + esc(e.message)); }
  tick();
}

// ---------- ejercicios de un ciclo ----------
const CYCLE_UI = {}; // filtro y orden recordados por set durante la sesión
function viewCycle(id, n) {
  const set = store.getSet(id);
  const cycle = set?.cycles.find(c => c.n === n);
  if (!cycle) return go('#/set/' + id);
  const ui = CYCLE_UI[id] || (CYCLE_UI[id] = { filter: 'all', sort: 'played' });
  const st = store.cycleStats(cycle);
  const title = item => (item.wp ? `Ejercicio ${item.wp}` : `Puzle ${item.id}`);
  const sub = item => (item.wp ? wpLevelLabel(item.wp) : item.rating ? `Elo ${item.rating}` : '');

  // posición en que se jugó cada ejercicio
  const playedAt = new Map(cycle.order.map((idx, k) => [idx, k]));
  let rows = cycle.order.filter(idx => cycle.results[idx]).map(idx => ({ idx, r: cycle.results[idx] }));
  if (ui.filter === 'bad') rows = rows.filter(x => !x.r.ok);
  if (ui.filter === 'ok') rows = rows.filter(x => x.r.ok);
  if (ui.sort === 'slow') rows.sort((a, b) => b.r.ms - a.r.ms);
  if (ui.sort === 'num') rows.sort((a, b) => a.idx - b.idx);
  const history = idx => set.cycles.map(c => {
    const r = c.results[idx];
    return `<i class="hdot ${r ? (r.ok ? 'ok' : 'bad') : ''}" title="Ciclo ${c.n}: ${r ? (r.ok ? 'acierto' : 'fallo') : 'sin hacer'}"></i>`;
  }).join('');

  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/set/${set.id}">‹</a><h1 class="ellipsis">Ciclo ${cycle.n} · ${esc(set.name)}</h1><span></span></header>
    <main class="wrap">
      <section class="card">
        <div class="row small"><span>${st.done}/${set.items.length} hechos · ${pct(st.acc)} de acierto</span><span>⏱ ${fmt(cycle.elapsedMs)}</span></div>
        <div class="chips">
          ${[['all', `Todos (${st.done})`], ['bad', `Fallados (${st.failed})`], ['ok', `Acertados (${st.ok})`]].map(([k, l]) => `<button class="chip ${ui.filter === k ? 'on' : ''}" data-filter="${k}">${l}</button>`).join('')}
        </div>
        <label class="small muted" for="sort">Ordenar por</label>
        <select id="sort">
          <option value="played" ${ui.sort === 'played' ? 'selected' : ''}>Orden en que los hiciste</option>
          <option value="num" ${ui.sort === 'num' ? 'selected' : ''}>Número de ejercicio</option>
          <option value="slow" ${ui.sort === 'slow' ? 'selected' : ''}>Más lentos primero</option>
        </select>
        <p class="small muted">Los puntos muestran tu resultado en cada ciclo (verde acierto, rojo fallo). Toca un ejercicio para analizarlo.</p>
      </section>
      <section class="plist">
        ${rows.length ? rows.map(({ idx, r }) => `
          <button class="prow" data-idx="${idx}">
            <span class="pres ${r.ok ? 'ok' : 'bad'}">${r.ok ? '✓' : '✗'}</span>
            <span class="ptitle"><b>${esc(title(set.items[idx]))}</b> <small class="muted">${esc(sub(set.items[idx]))} · nº ${playedAt.get(idx) + 1} del ciclo</small></span>
            <span class="phist">${history(idx)}</span>
            <span class="ptime">${fmt(r.ms)}</span>
          </button>`).join('') : '<p class="muted center">No hay ejercicios con este filtro.</p>'}
      </section>
    </main>`;
  app.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { ui.filter = b.dataset.filter; route(); }));
  $('#sort').addEventListener('change', e => { ui.sort = e.target.value; route(); });
  app.querySelectorAll('[data-idx]').forEach(b => b.addEventListener('click', async () => {
    const idx = +b.dataset.idx;
    const p = await resolveItem(set.items[idx]);
    openAnalysis({ fen: p.fen, solution: mainLine(p.tree), wrong: cycle.results[idx]?.w || [], title: p.title, ref: { setId: set.id, cycleN: cycle.n, idx } });
  }));
}

// ---------- repaso de fallos (sin cronómetro) ----------
async function viewReview(id) {
  const set = store.getSet(id);
  if (!set) return go('#/');
  const last = set.cycles[set.cycles.length - 1];
  const list = last ? Object.entries(last.results).filter(([, r]) => !r.ok).map(([k]) => +k) : [];
  if (!list.length) return go('#/set/' + id);
  const settings = store.getSettings();
  let i = 0, cur = null, wrong = [];
  app.innerHTML = `
    <div class="train">
      <header class="top"><a class="icon-btn" href="#/set/${set.id}">‹</a><h1 class="ellipsis">Repaso · ciclo ${last.n}</h1><span class="badge" id="cnt"></span></header>
      <div class="board-wrap"><div class="board" id="board"></div></div>
      <div class="info"><div class="turn" id="turn"></div><div class="feedback" id="fb"></div></div>
      <div class="actions">
        <button class="btn ghost" id="prev">‹ Anterior</button>
        <button class="btn ghost" id="sol">Solución</button>
        <button class="btn ghost" id="analyse" aria-label="Analizar">🔍</button>
        <button class="btn ghost" id="retry" aria-label="Reintentar">↺</button>
        <button class="btn primary" id="next">Siguiente ›</button>
      </div>
    </div>`;
  const fb = (c, h) => { $('#fb').className = 'feedback ' + c; $('#fb').innerHTML = h; };
  const board = new PuzzleBoard($('#board'), {
    coords: settings.coords,
    onEvent: (t, info) => {
      if (t === 'wrong') { fb('bad', `✗ ${esc(info.san)} no es la solución`); if (!wrong.includes(info.uci)) wrong.push(info.uci); }
      if (t === 'good' || t === 'progress') fb('ok', '✓ Sigue…');
      if (t === 'solved') fb(info.ok ? 'ok' : 'bad', info.ok ? '✓ ¡Correcto!' : 'Solución mostrada');
    },
  });
  async function show() {
    const p = await resolveItem(set.items[list[i]]);
    cur = p; wrong = [];
    board.load(p);
    const white = board.hero === 'w';
    $('#cnt').textContent = `${i + 1}/${list.length}`;
    $('#turn').innerHTML = `<span class="dot ${white ? 'w' : 'b'}"></span> <b>${esc(p.title)}</b> · Juegan ${white ? 'blancas' : 'negras'}`;
    fb('', '');
  }
  $('#prev').onclick = () => { i = (i - 1 + list.length) % list.length; show(); };
  $('#next').onclick = () => { i = (i + 1) % list.length; show(); };
  $('#retry').onclick = show;
  $('#analyse').onclick = () => cur && openAnalysis({
    fen: cur.fen, solution: mainLine(cur.tree), wrong, title: cur.title,
    ref: { setId: set.id, cycleN: last.n, idx: list[i] },
  });
  $('#sol').onclick = () => board.showSolution();
  cleanup = () => board.destroy();
  show();
}

// ---------- ajustes ----------
function syncCard() {
  const st = sync.state;
  if (!st.configured) return `<h2>Sincronización</h2><p class="small muted">No configurada: el progreso se guarda solo en este dispositivo.</p>`;
  if (!st.user) return `<h2>Sincronización</h2>
    <p class="small muted">Inicia sesión con Google para tener el mismo progreso en el móvil y en el PC. Solo hace falta una vez por dispositivo.</p>
    <button class="btn primary" id="gLogin">Iniciar sesión con Google</button>
    ${st.error ? `<p class="small bad-text">${esc(st.error)}</p>` : ''}`;
  const status = { ok: '✓ Sincronizado', syncing: 'Sincronizando…', error: '⚠ Error' }[st.status] || '';
  return `<h2>Sincronización</h2>
    <p class="small">Conectado como <b>${esc(st.user.email || st.user.name || '')}</b></p>
    <p class="small ${st.status === 'error' ? 'bad-text' : 'muted'}">${status}${st.lastSync ? ' · ' + new Date(st.lastSync).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}${st.error ? ' · ' + esc(st.error) : ''}</p>
    <button class="btn ghost" id="gLogout">Cerrar sesión</button>`;
}

function bindSyncCard() {
  const card = $('#syncCard');
  if (!card) return;
  card.innerHTML = syncCard();
  $('#gLogin')?.addEventListener('click', () => sync.signIn().catch(e => alert('No se pudo iniciar sesión: ' + e.message)));
  $('#gLogout')?.addEventListener('click', async () => {
    if (confirm('¿Cerrar sesión? Tu progreso seguirá en este dispositivo y en la nube.')) await sync.signOut();
  });
}

function viewSettings() {
  const s = store.getSettings();
  const opts = [
    ['autoPause', 'Pausar automáticamente al salir de la app o bloquear la pantalla'],
    ['hidePaused', 'Ocultar el tablero mientras está en pausa'],
    ['autoNext', 'Pasar al siguiente ejercicio al acertar'],
    ['sound', 'Sonidos'],
    ['coords', 'Coordenadas en el tablero'],
  ];
  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/">‹</a><h1>Ajustes</h1><span></span></header>
    <main class="wrap">
      <section class="card form">
        ${opts.map(([k, l]) => `<label class="switch"><input type="checkbox" data-k="${k}" ${s[k] ? 'checked' : ''}><span>${l}</span></label>`).join('')}
      </section>
      <section class="card" id="syncCard">${syncCard()}</section>
      <section class="card">
        <h2>Lichess</h2>
        ${(() => {
          const a = lichess.getAuth();
          return a
            ? `<p class="small">Conectado como <b>${esc(a.username || '…')}</b>${a.puzzleRating ? ` · Elo de puzles ${a.puzzleRating}` : ''}</p>
               <button class="btn ghost" id="liLogout">Desconectar</button>`
            : `<p class="small muted">Conecta tu cuenta para que los sets de Lichess se adapten a tu Elo de puzles.</p>
               <button class="btn ghost" id="liLogin">Conectar con Lichess</button>`;
        })()}
      </section>
      <section class="card">
        <h2>Tus datos</h2>
        <p class="muted small">No hay cuentas ni contraseñas: el progreso se guarda en este dispositivo y la app nunca te pedirá iniciar sesión.
        Para pasar tu progreso a otro dispositivo (o como copia de seguridad), exporta y luego importa el archivo.</p>
        <p class="small" id="persist"></p>
        <div class="grid2">
          <button class="btn ghost" id="exp">⬇ Exportar copia</button>
          <label class="btn ghost" for="imp">⬆ Importar copia</label>
        </div>
        <input type="file" id="imp" accept="application/json,.json" hidden>
      </section>
      <p class="muted small center">Ejercicios: <i>The Woodpecker Method</i> (Axel Smith y Hans Tikkanen), 1128 diagramas.</p>
    </main>`;
  app.querySelectorAll('[data-k]').forEach(c => c.addEventListener('change', () => { s[c.dataset.k] = c.checked; store.setSettings(s); }));
  $('#liLogin')?.addEventListener('click', () => lichess.login());
  $('#liLogout')?.addEventListener('click', async () => { await lichess.logout(); route(); });
  bindSyncCard();
  cleanup = sync.onChange(bindSyncCard);
  navigator.storage?.persisted?.().then(p => {
    $('#persist') && ($('#persist').textContent = p ? '✓ Almacenamiento persistente activado' : 'El navegador podría borrar los datos si falta espacio: instala la app para protegerlos y exporta copias de vez en cuando.');
  });
  $('#exp').onclick = () => {
    const blob = new Blob([store.exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `woodpecker-copia-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('#imp').onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    if (!confirm('Esto sustituirá todos los datos de este dispositivo por los de la copia. ¿Continuar?')) return;
    try { store.importData(await f.text()); alert('Copia importada'); go('#/'); }
    catch (err) { alert('Error: ' + err.message); }
  };
}

lichess.handleRedirect()
  .catch(err => alert(err.message))
  .finally(() => {
    route();
    lichess.refreshAccount().catch(() => {});
    sync.start(onRemoteChange).catch(e => console.error(e));
    sync.onChange(() => { if (currentView() === 'home') route(); });
  });

const currentView = () => (location.hash.slice(1) || '/').split('/')[1] || 'home';
// Llegan datos de otro dispositivo: refrescar las vistas que solo muestran información
function onRemoteChange() {
  if (['home', 'set'].includes(currentView())) route();
}
loadWoodpecker().catch(() => {});
