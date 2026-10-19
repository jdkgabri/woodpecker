import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import './style.css';

import * as store from './store.js';
import { wpLevel as wpLevelLabel, WP_LEVELS, WP_TOTAL, LICHESS_THEMES, LICHESS_DIFFS, DIFF_OFFSET, themeLabel, diffLabel, resolveItem, fetchLichessPuzzles, pickLocalPuzzles, localAvailable, collectionStatus, downloadCollection, clearCollection, loadWoodpecker } from './puzzles.js';
import { formPgn, bindPgn } from './importpgn.js';
import { PuzzleBoard } from './puzzleboard.js';
import * as lichess from './lichess.js';
import * as sync from './sync.js';
import { viewAnalysis, openAnalysis, mainLine } from './analysis.js';
import { habitOn, gamifyOn, levelCard, progressSnapshot, notifyProgress, streakCard, bindStreakCard, celebrate, habitSettings, bindHabitSettings } from './ui-habit.js';
import { viewStats } from './stats.js';
import { t, tn, locale, LANGS, langSetting, applyDocumentLang } from './i18n.js';

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
const date = ts => new Date(ts).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
const go = h => { location.hash = h; };

// ---------- instalación PWA ----------
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (location.hash === '' || location.hash === '#/') route(); });
// Pedir almacenamiento persistente para que Android no borre los datos
navigator.storage?.persist?.().catch(() => {});
applyDocumentLang();

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
  if (view === 'stats') return viewStats(app);
  if (view === 'analysis') { cleanup = viewAnalysis(app); return; }
  return viewHome();
}
window.addEventListener('hashchange', route);

// ---------- inicio ----------
function viewHome() {
  const sets = store.sets();
  const h = habitOn() ? store.habitState() : null;
  app.innerHTML = `
    <header class="top">
      <h1><span class="logo">♞</span> Woodpecker</h1>
      <div class="top-right">
        ${h ? `<span class="badge" title="${t('Racha de días')}">🔥 ${h.streak}</span>` : ''}
        ${syncBadge()}
        <a class="icon-btn" href="#/stats" aria-label="${t('Estadísticas')}">📊</a>
        <a class="icon-btn" href="#/settings" aria-label="${t('Ajustes')}">⚙</a>
      </div>
    </header>
    <main class="wrap">
      ${installEvt ? `<button class="btn ghost full" id="install">📲 ${t('Instalar la app')}</button>` : ''}
      ${streakCard()}
      ${gamifyOn() ? levelCard(false) : ''}
      <a class="btn primary full" href="#/new">＋ ${t('Nuevo set')}</a>
      ${sets.length ? '' : `
        <section class="card">
          <h2>${t('Empieza con el método Woodpecker')}</h2>
          <p class="muted">${t('Los 1128 ejercicios del libro, repetidos en ciclos cada vez más rápidos.')}</p>
          <div class="chips">
            ${WP_LEVELS.slice(0, 3).map(l => `<button class="chip" data-quick="${l.key}">${t(l.label)} <small>${l.from}–${l.to}</small></button>`).join('')}
          </div>
        </section>`}
      <section class="list">
        ${sets.map(setCard).join('')}
      </section>
    </main>`;
  bindStreakCard(app, route);
  $('#install')?.addEventListener('click', async () => { installEvt.prompt(); await installEvt.userChoice; installEvt = null; route(); });
  app.querySelectorAll('[data-quick]').forEach(b => b.addEventListener('click', () => {
    const l = WP_LEVELS.find(x => x.key === b.dataset.quick);
    const set = createWpSet(l.from, l.to, 'seq', wpSetName(l.from, l.to));
    go('#/set/' + set.id);
  }));
}

function wpSetName(a, b) {
  const l = WP_LEVELS.find(x => x.from === a && x.to === b);
  return `Woodpecker ${l ? t(l.label).toLowerCase() + ' ' : ''}(${a}–${b})`;
}

function syncBadge() {
  const st = sync.state;
  if (!st.configured || !st.user) return '';
  const icon = { ok: '☁︎ ✓', syncing: '☁︎ …', error: '☁︎ ⚠' }[st.status] || '☁︎';
  return `<a class="badge ${st.status === 'error' ? 'bad' : ''}" href="#/settings" title="${t('Sincronización')}">${icon}</a>`;
}

function setCard(set) {
  const cur = store.currentCycle(set);
  const fin = set.cycles.filter(c => c.finishedAt).length;
  const st = cur ? store.cycleStats(cur) : null;
  return `
    <a class="card set-card" href="#/set/${set.id}">
      <div class="row">
        <strong>${esc(set.name)}</strong>
        <span class="muted">${tn(set.items.length, '{n} ejercicio', '{n} ejercicios')}</span>
      </div>
      <div class="row muted small">
        <span>${set.targetCycles ? t('{n} de {m} ciclos completados', { n: fin, m: set.targetCycles }) : tn(fin, '{n} ciclo completado', '{n} ciclos completados')}</span>
        ${cur ? `<span>${t('Ciclo {n}', { n: cur.n })}: ${cur.pos}/${set.items.length} · ${fmt(cur.elapsedMs)}</span>` : ''}
      </div>
      ${cur ? `<div class="bar"><i style="width:${(cur.pos / set.items.length) * 100}%"></i></div>` : ''}
      ${st && st.done ? `<div class="small muted">${t('Acierto del ciclo: {p}', { p: pct(st.acc) })}</div>` : ''}
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
      <header class="top"><a class="icon-btn" href="#/">‹</a><h1>${t('Nuevo set')}</h1><span></span></header>
      <main class="wrap">
        <div class="tabs">
          <button class="tab ${tab === 'wp' ? 'on' : ''}" data-tab="wp">The Woodpecker Method</button>
          <button class="tab ${tab === 'li' ? 'on' : ''}" data-tab="li">Lichess</button>
          <button class="tab ${tab === 'pgn' ? 'on' : ''}" data-tab="pgn">PGN</button>
        </div>
        ${tab === 'wp' ? formWp() : tab === 'li' ? formLichess() : formPgn()}
      </main>`;
    app.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { if (cleanup) { cleanup(); cleanup = null; } tab = b.dataset.tab; render(); }));
    if (tab === 'wp') bindWp();
    else if (tab === 'li') bindLichess();
    else cleanup = bindPgn(app, go);
  };
  render();
}

function formWp() {
  return `
    <section class="card form">
      <label>${t('Nivel')}</label>
      <div class="chips" id="levels">
        ${WP_LEVELS.map((l, i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-from="${l.from}" data-to="${l.to}">${t(l.label)}<small>${l.from}–${l.to}</small></button>`).join('')}
        <button class="chip" data-custom="1">${t('Personalizado')}</button>
      </div>
      <div class="grid2">
        <div><label for="from">${t('Desde el nº')}</label><input id="from" type="number" min="1" max="${WP_TOTAL}" value="1" inputmode="numeric"></div>
        <div><label for="to">${t('Hasta el nº')}</label><input id="to" type="number" min="1" max="${WP_TOTAL}" value="222" inputmode="numeric"></div>
      </div>
      <p class="muted small" id="count"></p>
      <label for="order">${t('Orden')}</label>
      <select id="order">
        <option value="seq">${t('Orden del libro')}</option>
        <option value="random">${t('Aleatorio (se baraja en cada ciclo)')}</option>
      </select>
      <label for="cycles">${t('Ciclos objetivo')}</label>
      <input id="cycles" type="number" min="1" max="20" value="7" inputmode="numeric">
      <label for="name">${t('Nombre')}</label>
      <input id="name" type="text">
      <button class="btn primary full" id="create">${t('Crear set')}</button>
    </section>
    <p class="muted small">${t('Niveles del libro: 1–222 fáciles, 223–984 intermedios, 985–1128 avanzados.')}
    ${t('Las soluciones se han calculado con Stockfish; si una jugada tuya también gana y no se acepta, puedes marcarla como correcta.')}</p>`;
}

function bindWp() {
  const from = $('#from'), to = $('#to'), name = $('#name');
  let nameTouched = false;
  const upd = () => {
    const a = Math.max(1, Math.min(WP_TOTAL, +from.value || 1));
    const b = Math.max(1, Math.min(WP_TOTAL, +to.value || 1));
    $('#count').textContent = b >= a ? tn(b - a + 1, '{n} ejercicio', '{n} ejercicios') : t('El rango no es válido');
    if (!nameTouched) name.value = wpSetName(+from.value, +to.value);
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
    if (!(a >= 1 && b <= WP_TOTAL && b >= a)) return alert(t('Rango no válido (1–1128).'));
    const set = createWpSet(a, b, $('#order').value, name.value.trim() || wpSetName(a, b), +$('#cycles').value || 7);
    go('#/set/' + set.id);
  });
}

// Ids de puzles de Lichess que ya están en algún set (para dar preferencia a los nuevos)
const usedLichessIds = () => new Set(store.sets().filter(x => x.source === 'lichess').flatMap(x => x.items.map(i => i.id)));

function formLichess() {
  const a = lichess.getAuth();
  const myElo = a?.puzzleRating || '';
  return `
    <section class="card form">
      <label>${t('Origen de los puzles')}</label>
      <div class="tabs small-tabs">
        <button class="tab on" data-src="local">${t('Colección local')}</button>
        <button class="tab" data-src="api">${t('Lichess (tu cuenta)')}</button>
      </div>
      <p class="muted small" id="srcHelp"></p>
      <div id="apiLogin" hidden>
        ${a ? `<p class="small">${t('Conectado a Lichess como {u}', { u: `<b>${esc(a.username || '')}</b>` })}${a.puzzleRating ? ` · ${t('Elo de puzles {r}', { r: a.puzzleRating })}` : ''}</p>`
          : `<p class="small">${t('Para usar este origen conecta tu cuenta de Lichess.')}</p><button class="btn ghost" id="liLogin">${t('Conectar con Lichess')}</button>`}
      </div>
      <label for="theme">${t('Tema')}</label>
      <select id="theme">${LICHESS_THEMES.map(([k]) => `<option value="${k}">${themeLabel(k)}</option>`).join('')}</select>
      <label>${t('Dificultad')}</label>
      <div class="tabs small-tabs" id="modeTabs">
        <button class="tab on" data-mode="abs">${t('Rango de Elo')}</button>
        <button class="tab" data-mode="rel">${t('Relativa a mi Elo')}</button>
      </div>
      <div id="modeAbs">
        <div class="grid2">
          <div><label for="minR">${t('Elo mínimo')}</label><input id="minR" type="number" min="300" max="3100" step="50" value="${myElo ? Math.max(400, Math.round((myElo - 200) / 50) * 50) : 1400}" inputmode="numeric"></div>
          <div><label for="maxR">${t('Elo máximo')}</label><input id="maxR" type="number" min="300" max="3100" step="50" value="${myElo ? Math.round((myElo + 200) / 50) * 50 : 1600}" inputmode="numeric"></div>
        </div>
      </div>
      <div id="modeRel" hidden>
        <select id="diff">${LICHESS_DIFFS.map(([k]) => `<option value="${k}" ${k === 'normal' ? 'selected' : ''}>${diffLabel(k)}</option>`).join('')}</select>
        <div id="myEloBox"><label for="myElo">${t('Tu Elo de puzles')}</label><input id="myElo" type="number" min="400" max="3200" step="10" value="${myElo || 1500}" inputmode="numeric"></div>
        <p class="muted small" id="relHelp"></p>
      </div>
      <p class="small muted" id="avail"></p>
      <label for="n">${t('Número de puzles')}</label>
      <input id="n" type="number" min="10" max="500" value="100" inputmode="numeric">
      <label class="switch" id="preferBox"><input type="checkbox" id="preferNew" checked><span>${t('Preferir puzles que no estén en otros sets')}</span></label>
      <label for="order">${t('Orden')}</label>
      <select id="order">
        <option value="seq">${t('Fijo')}</option>
        <option value="random">${t('Aleatorio (se baraja en cada ciclo)')}</option>
      </select>
      <label for="cycles">${t('Ciclos objetivo')}</label>
      <input id="cycles" type="number" min="1" max="20" value="5" inputmode="numeric">
      <label for="name">${t('Nombre')}</label>
      <input id="name" type="text" placeholder="${t('Automático')}">
      <button class="btn primary full" id="create">${t('Crear set')}</button>
      <p class="muted small" id="status"></p>
    </section>`;
}

function bindLichess() {
  $('#liLogin')?.addEventListener('click', () => lichess.login());
  const auth = lichess.getAuth();
  let src = 'local', mode = 'abs';
  const relRange = () => {
    const c = (+$('#myElo').value || 1500) + DIFF_OFFSET[$('#diff').value];
    return [Math.max(300, c - 150), c + 150];
  };
  const range = () => (mode === 'abs' ? [+$('#minR').value, +$('#maxR').value] : relRange());
  async function refresh() {
    $('#srcHelp').textContent = src === 'local'
      ? t('Una selección de unos 450.000 puzles de la base de datos de Lichess incluida en la app: cualquier tema y rango, al instante y sin conexión.')
      : t('Lichess elige los puzles según tu Elo de puzles, en lotes de 50 y sin repetir. Necesita conexión.');
    $('#apiLogin').hidden = src !== 'api';
    $('#modeTabs').hidden = src === 'api';
    $('#modeAbs').hidden = src === 'api' || mode !== 'abs';
    $('#modeRel').hidden = src === 'local' && mode !== 'rel';
    $('#myEloBox').hidden = src === 'api';
    $('#preferBox').hidden = src === 'api';
    $('#create').disabled = src === 'api' && !auth;
    $('#create').textContent = src === 'api' ? t('Descargar y crear') : t('Crear set');
    if (src === 'local' && mode === 'rel') {
      const [lo, hi] = relRange();
      $('#relHelp').textContent = t('Puzles de {a} a {b}.', { a: lo, b: hi });
    } else if (src === 'api') {
      $('#relHelp').textContent = auth?.puzzleRating ? t('Respecto a tu Elo de puzles ({r}). Cada nivel sube o baja unos 300 puntos.', { r: auth.puzzleRating }) : '';
    }
    if (src === 'local') {
      const [lo, hi] = range();
      const n = lo > 0 && hi >= lo ? await localAvailable($('#theme').value, lo, hi).catch(() => null) : null;
      $('#avail').textContent = n == null ? '' : t('Disponibles en la colección: ~{n}', { n });
    } else $('#avail').textContent = '';
  }
  app.querySelectorAll('[data-src]').forEach(b => b.addEventListener('click', () => {
    src = b.dataset.src;
    app.querySelectorAll('[data-src]').forEach(x => x.classList.toggle('on', x === b));
    refresh();
  }));
  app.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    app.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x === b));
    refresh();
  }));
  ['#theme', '#minR', '#maxR', '#diff', '#myElo'].forEach(sel => $(sel).addEventListener('input', refresh));
  refresh();

  let ctrl = null;
  cleanup = () => ctrl?.abort();
  $('#create').addEventListener('click', async e => {
    const btn = e.currentTarget;
    const status = msg => { if ($('#status')) $('#status').textContent = msg; };
    const theme = $('#theme').value;
    const count = Math.max(10, Math.min(500, +$('#n').value || 100));
    btn.disabled = true;
    try {
      let items, meta, label;
      if (src === 'local') {
        const [lo, hi] = range();
        if (!(lo > 0 && hi >= lo)) { btn.disabled = false; return status(t('El rango de Elo no es válido.')); }
        status(t('Cargando la colección…'));
        const r = await pickLocalPuzzles({ theme, min: lo, max: hi, count, avoid: $('#preferNew').checked ? usedLichessIds() : new Set() });
        items = r.items;
        if (!items.length) throw new Error(t('No hay puzles de ese tema en ese rango. Prueba un rango más amplio.'));
        if (items.length < count && !confirm(t('Solo hay {n} puzles de ese tema en ese rango. ¿Crear el set con {n}?', { n: items.length }))) { btn.disabled = false; return status(''); }
        if (r.repeated) alert(t('{n} puzles ya estaban en otros sets (no había suficientes nuevos en ese rango).', { n: r.repeated }));
        label = `${lo}–${hi}`;
        meta = { theme, source: 'local', mode, minRating: lo, maxRating: hi };
      } else {
        ctrl = new AbortController();
        const difficulty = $('#diff').value;
        const r = await fetchLichessPuzzles({ theme, difficulty, count }, (n, msg) => status(msg || t('Descargando… {n}/{m}', { n, m: count })), ctrl.signal);
        items = r.items;
        if (!items.length) throw new Error(r.rateLimited ? t('Lichess está limitando las peticiones. Vuelve a intentarlo dentro de un rato.') : t('Lichess no ha devuelto puzles.'));
        const q = r.rateLimited
          ? t('Lichess ha limitado las peticiones y solo se descargaron {n} de {m} puzles. ¿Crear el set con {n}?', { n: items.length, m: count })
          : t('Solo se encontraron {n} de {m} puzles. ¿Crear el set con {n}?', { n: items.length, m: count });
        if (!r.complete && !confirm(q)) { btn.disabled = false; return status(''); }
        label = diffLabel(difficulty).toLowerCase();
        meta = { theme, source: 'api', mode: 'rel', difficulty };
      }
      const ratings = items.map(x => x.rating);
      const name = $('#name').value.trim() || `Lichess · ${themeLabel(theme)} (${label})`;
      const set = store.addSet({
        id: store.uid(), name, source: 'lichess', order: $('#order').value, targetCycles: +$('#cycles').value || 5, createdAt: Date.now(),
        lichess: { ...meta, eloMin: Math.min(...ratings), eloMax: Math.max(...ratings), eloAvg: Math.round(ratings.reduce((x, y) => x + y, 0) / ratings.length) },
        items, cycles: [],
      });
      go('#/set/' + set.id);
    } catch (err) {
      status(t('Error: {e}', { e: err.message }));
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
  // último ciclo con ejercicios hechos (un ciclo recién empezado aún no tiene fallos que repasar)
  const last = [...set.cycles].reverse().find(c => Object.keys(c.results).length) || null;
  const failedIdx = last ? Object.entries(last.results).filter(([, r]) => !r.ok).map(([k]) => +k) : [];
  const prev = finished[finished.length - 1];
  const target = prev ? prev.elapsedMs / 2 : null;
  const source = set.source === 'woodpecker'
    ? `The Woodpecker Method · ${t('nº {a}–{b}', { a: set.range[0], b: set.range[1] })}`
    : set.source === 'pgn' ? t('PGN importado')
    : set.source === 'review' ? t('Selección de las posiciones que más fallas')
    : `Lichess · ${esc(set.lichess?.theme ? themeLabel(set.lichess.theme) : t('puzles'))}${set.lichess?.eloAvg ? ` · Elo ${set.lichess.eloMin}–${set.lichess.eloMax} (${t('media {n}', { n: set.lichess.eloAvg })})` : ''}`;
  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/">‹</a><h1 class="ellipsis">${esc(set.name)}</h1>
      <button class="icon-btn" id="menu" aria-label="${t('Opciones')}">⋯</button></header>
    <main class="wrap">
      <section class="card opts" id="opts" hidden>
        <button class="btn ghost" id="rename">${t('Renombrar')}</button>
        ${cur ? `<button class="btn ghost" id="reset">${t('Reiniciar ciclo en curso')}</button>` : ''}
        <button class="btn danger" id="del">${t('Borrar set')}</button>
      </section>
      <section class="card">
        <div class="row"><span class="muted">${source}</span>
        <span class="muted">${tn(set.items.length, '{n} ejercicio', '{n} ejercicios')}</span></div>
        <div class="row muted small"><span>${set.order === 'random' ? t('Orden aleatorio') : set.source === 'woodpecker' ? t('Orden del libro') : set.source === 'pgn' ? t('Orden del archivo') : t('Orden fijo')}</span>
        <span>${t('{n}/{m} ciclos', { n: finished.length, m: set.targetCycles || '–' })}</span></div>
        ${cur ? `
          <div class="bar big"><i style="width:${(cur.pos / set.items.length) * 100}%"></i></div>
          <div class="row small"><span>${t('Ciclo {n}', { n: cur.n })}: ${cur.pos}/${set.items.length}</span><span>⏱ ${fmt(cur.elapsedMs)}</span></div>
          <a class="btn primary full" href="#/train/${set.id}">▶ ${t('Continuar ciclo {n}', { n: cur.n })}</a>
        ` : `
          ${target ? `<p class="small muted">${t('Objetivo del método: completar el ciclo {n} en la mitad de tiempo (≈ {time}).', { n: set.cycles.length + 1, time: fmt(target) })}</p>` : ''}
          <button class="btn primary full" id="start">▶ ${t('Empezar ciclo {n}', { n: set.cycles.length + 1 })}</button>
        `}
        ${failedIdx.length
          ? `<a class="btn ghost full" href="#/review/${set.id}">${t('Repasar fallos del ciclo {n} ({k})', { n: last.n, k: failedIdx.length })}</a>`
          : `<p class="small muted">🔁 ${last ? t('Repaso de fallos: sin fallos que repasar en el ciclo {n}.', { n: last.n }) : t('Repaso de fallos: aquí podrás repasar sin cronómetro los ejercicios que falles.')}</p>`}
      </section>
      ${!set.cycles.length ? `
      <section class="card">
        <h2>${t('Ciclos')}</h2>
        <p class="small muted">${t('Aún no has empezado ningún ciclo. Cuando lo hagas verás aquí el tiempo y el acierto de cada uno, su evolución y la lista de ejercicios para analizarlos.')}</p>
      </section>` : ''}
      ${set.cycles.length ? `
      <section class="card">
        <h2>${t('Ciclos')}</h2>
        ${chart(set)}
        <table class="tbl">
          <thead><tr><th>#</th><th>${t('Inicio')}</th><th>${t('Tiempo')}</th><th>${t('Hechos')}</th><th>${t('Acierto')}</th></tr></thead>
          <tbody>${set.cycles.map(c => {
            const st = store.cycleStats(c);
            return `<tr class="${c.finishedAt ? '' : 'live'} clickable" data-cycle="${c.n}"><td>${c.n} ›</td><td>${date(c.startedAt)}</td><td>${fmt(c.elapsedMs)}</td>
              <td>${st.done}/${set.items.length}</td><td>${st.done ? pct(st.acc) : '–'}</td></tr>`;
          }).join('')}</tbody>
        </table>
        <p class="small muted">${t('Toca un ciclo para ver sus ejercicios uno a uno y analizarlos.')}</p>
        ${finished.length ? `<p class="small muted">${t('Tiempo medio por ejercicio en el último ciclo: {time}', { time: fmt(prev.elapsedMs / set.items.length) })}</p>` : ''}
      </section>` : ''}
    </main>`;
  $('#start')?.addEventListener('click', () => { store.startCycle(set); go('#/train/' + set.id); });
  app.querySelectorAll('[data-cycle]').forEach(r => r.addEventListener('click', () => go(`#/cycle/${set.id}/${r.dataset.cycle}`)));
  $('#menu').addEventListener('click', () => { $('#opts').hidden = !$('#opts').hidden; });
  $('#rename').onclick = () => {
    const n = prompt(t('Nuevo nombre'), set.name);
    if (n && n.trim()) { set.name = n.trim(); store.save(); route(); }
  };
  $('#reset') && ($('#reset').onclick = () => {
    if (confirm(t('¿Reiniciar el ciclo en curso? Se perderá su progreso.'))) { set.cycles.pop(); store.save(); route(); }
  });
  $('#del').onclick = () => {
    if (confirm(t('¿Borrar "{name}" y todo su historial?', { name: set.name }))) { store.deleteSet(set.id); go('#/'); }
  };
}

// Gráfico de evolución: barras = tiempo de cada ciclo, línea = acierto
function chart(set) {
  const cs = set.cycles.filter(c => c.finishedAt);
  if (!cs.length) return '';
  const W = 320, H = 170, L = 34, R = 34, T = 18, B = 28;
  const iw = W - L - R, ih = H - T - B;
  const max = Math.max(...cs.map(c => c.elapsedMs));
  const slot = iw / cs.length, bw = Math.min(36, slot * 0.6);
  const x = i => L + slot * i + slot / 2;
  const accs = cs.map(c => store.cycleStats(c).acc);
  const yAcc = a => T + ih * (1 - a);
  const bars = cs.map((c, i) => {
    const h = (c.elapsedMs / max) * ih;
    return `<rect x="${x(i) - bw / 2}" y="${T + ih - h}" width="${bw}" height="${h}" rx="2" class="cbar"/>
      <text x="${x(i)}" y="${H - 10}" class="clabel">C${c.n}</text>
      <text x="${x(i)}" y="${T + ih - h - 4}" class="clabel">${fmt(c.elapsedMs)}</text>`;
  }).join('');
  const pts = accs.map((a, i) => `${x(i)},${yAcc(a)}`).join(' ');
  const dots = accs.map((a, i) => `<circle cx="${x(i)}" cy="${yAcc(a)}" r="3.5" class="cdot"/><text x="${x(i) + 6}" y="${yAcc(a) - 6}" class="clabel acc" text-anchor="start">${pct(a)}</text>`).join('');
  const grid = [0, 0.5, 1].map(a => `<line x1="${L}" x2="${W - R}" y1="${yAcc(a)}" y2="${yAcc(a)}" class="cgrid"/><text x="${W - R + 4}" y="${yAcc(a) + 3}" class="clabel acc" text-anchor="start">${a * 100}%</text>`).join('');
  let compare = '';
  if (cs.length >= 2) {
    const first = cs[0], last = cs[cs.length - 1];
    const dt = (last.elapsedMs - first.elapsedMs) / first.elapsedMs;
    const da = accs[accs.length - 1] - accs[0];
    compare = `<p class="small">${t('Ciclo {n} frente al ciclo 1:', { n: last.n })}
      ${t('tiempo')} <b class="${dt <= 0 ? 'ok-text' : 'bad-text'}">${dt <= 0 ? '−' : '+'}${Math.abs(Math.round(dt * 100))}%</b> ·
      ${t('Acierto').toLowerCase()} <b class="${da >= 0 ? 'ok-text' : 'bad-text'}">${da >= 0 ? '+' : '−'}${Math.abs(Math.round(da * 100))} pts</b></p>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${t('Tiempo por ciclo')}">
      ${grid}${bars}<polyline points="${pts}" class="cline"/>${dots}
    </svg>
    <p class="small muted legend"><i class="lg-bar"></i> ${t('Tiempo')} &nbsp; <i class="lg-line"></i> ${t('Acierto')}</p>
    ${compare}`;
}

// Recuadro de estado del puzle, al estilo de Lichess
function feedbackHtml(state, hero, title, sub) {
  const icon = state === 'play'
    ? `<div class="cg-wrap fb-piece"><piece class="king ${hero === 'w' ? 'white' : 'black'}"></piece></div>`
    : `<div class="fb-icon ${['good', 'ok'].includes(state) ? 'good' : 'bad'}">${['good', 'ok'].includes(state) ? '✓' : '✗'}</div>`;
  const tt = title ?? { play: t('Tu turno'), good: t('¡Mejor jugada!'), bad: t('¡Esa no es la jugada!'), ok: t('¡Correcto!'), failed: t('Ejercicio fallado') }[state];
  const st = sub ?? {
    play: hero === 'w' ? t('Encuentra la mejor jugada para las blancas.') : t('Encuentra la mejor jugada para las negras.'),
    good: t('Sigue…'), bad: t('Prueba otra cosa.'), ok: t('Ejercicio resuelto'), failed: t('Queda para el repaso de fallos'),
  }[state];
  return `<div class="pfb ${state}">${icon}<div class="pfb-text"><strong>${tt}</strong><em>${st}</em></div></div>`;
}

// ---------- entrenamiento (ciclo cronometrado) ----------
async function viewTrain(id) {
  const set = store.getSet(id);
  if (!set) return go('#/');
  const cycle = store.currentCycle(set);
  if (!cycle) return go('#/set/' + id);
  const settings = store.getSettings();
  store.setLocked(set.id);

  app.innerHTML = `
    <div class="train">
      <header class="top"><a class="icon-btn" href="#/set/${set.id}">‹</a>
        <h1 class="ellipsis">${t('Ciclo {n}', { n: cycle.n })} · ${esc(set.name)}</h1>
        <button class="icon-btn pause-btn" id="pause" aria-label="${t('Pausar')}">⏸</button></header>
      <div class="stats">
        <div><small>${t('Ciclo')}</small><b id="tCycle">00:00</b></div>
        <div><small>${t('Ejercicio')}</small><b id="tPuzzle">00:00</b></div>
        <div><small>${t('Progreso')}</small><b id="prog"></b></div>
        <div><small>${t('Acierto')}</small><b id="acc"></b></div>
      </div>
      <div class="board-wrap">
        <div class="board" id="board"></div>
        <div class="overlay" id="overlay"><div>
          <p id="ovText"></p>
          <button class="btn primary" id="resume"></button></div></div>
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
  function pause(text = t('En pausa')) {
    if (!running) return;
    commit();
    running = false;
    board.setPaused(true);
    $('#ovText').textContent = text;
    $('#resume').textContent = '▶ ' + t('Reanudar');
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
    $('#turn').innerHTML = `<span class="dot ${white ? 'w' : 'b'}"></span> <b>${esc(puzzle.title)}</b> <span class="muted">${esc(puzzle.sub || '')}</span>`;
    if (cycle.curFailed) feedback('bad', t('Sigue intentándolo'), t('Este ejercicio ya cuenta como fallado.'));
    else feedback('play');
    renderActions();
    updHeader();
  }

  function feedback(state, title, sub) {
    $('#fb').innerHTML = state ? feedbackHtml(state, board.hero, title, sub) : '';
  }

  function renderActions() {
    const a = $('#actions');
    if (solved) {
      const r = cycle.results[cycle.order[cycle.pos - 1]];
      a.innerHTML = `
        ${r && !r.ok ? `<button class="btn ghost" id="markOk">✓ ${t('Contar como correcta')}</button>` : ''}
        <button class="btn ghost" id="analyse">🔍 ${t('Analizar')}</button>
        <button class="btn success" id="next">${t('Siguiente')} ›</button>`;
      $('#next').onclick = loadCurrent;
      $('#analyse').onclick = () => openAnalysis(prevPayload);
      $('#markOk') && ($('#markOk').onclick = () => {
        r.ok = true; store.save(); updHeader();
        feedback('ok', t('Marcada como correcta'), t('Cuenta como acierto en este ciclo')); renderActions();
      });
    } else {
      a.innerHTML = `
        ${prevPayload ? `<button class="btn ghost" id="prevAn">🔍 ${t('Analizar el anterior')}</button>` : ''}
        <button class="btn ghost" id="sol">${t('Ver solución')}</button>`;
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
      feedback('bad', undefined, t('{m} no es la solución. Prueba otra cosa.', { m: esc(info.san) }));
    } else if (type === 'good') {
      feedback('good');
    } else if (type === 'progress') {
      feedback('good', undefined, t('Sigue, te toca.'));
    } else if (type === 'solved') {
      commit();
      const before = progressSnapshot();
      const idx = cycle.order[cycle.pos];
      const ok = info.ok && !cycle.curFailed;
      cycle.results[idx] = { ok, ms: Math.round(curMs), t: Date.now(), ...(wrongMoves.length ? { w: wrongMoves.slice(0, 5) } : {}) };
      if (store.touchActivity()) celebrate(store.habitState().streak);
      prevPayload = {
        fen: puzzle.fen, solution: mainLine(puzzle.tree), wrong: wrongMoves, title: puzzle.title, notes: puzzle.notes,
        ref: { setId: set.id, cycleN: cycle.n, idx },
      };
      try { sessionStorage.setItem(PREV_KEY, JSON.stringify(prevPayload)); } catch {}
      cycle.pos++;
      cycle.curMs = 0; cycle.curFailed = false;
      curMs = 0;
      solved = true;
      store.save();
      updHeader();
      feedback(ok ? 'ok' : 'failed');
      renderActions();
      notifyProgress(before);
      if (ok && settings.autoNext) advanceTimer = setTimeout(() => { if (running) loadCurrent(); }, 700);
    }
  }

  function finishCycle() {
    commit();
    running = false;
    const before = progressSnapshot();
    cycle.finishedAt = Date.now();
    delete cycle.curMs; delete cycle.curFailed;
    store.save();
    notifyProgress(before);
    const st = store.cycleStats(cycle);
    const prev = set.cycles[set.cycles.length - 2];
    app.querySelector('.train').innerHTML = `
      <header class="top"><a class="icon-btn" href="#/set/${set.id}">‹</a><h1>${t('Ciclo {n} completado', { n: cycle.n })}</h1><span></span></header>
      <main class="wrap"><section class="card center">
        <div class="big-num">${fmt(cycle.elapsedMs)}</div>
        <p>${t('{ok}/{done} correctos · {p} de acierto', { ok: st.ok, done: st.done, p: pct(st.acc) })}</p>
        ${prev ? `<p class="muted">${t('Ciclo anterior: {time} · {p}', { time: fmt(prev.elapsedMs), p: pct(store.cycleStats(prev).acc) })}</p>` : ''}
        <p class="muted small">${t('El método recomienda descansar y repetir el set en la mitad de tiempo.')}</p>
        <a class="btn primary full" href="#/set/${set.id}">${t('Volver al set')}</a>
      </section></main>`;
  }

  // Pausa automática al salir de la app o bloquear el móvil
  const onVis = () => {
    if (document.hidden && settings.autoPause) pause(t('Pausado automáticamente'));
    else commit();
  };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('pagehide', onVis);
  const onKey = e => {
    if (e.key === ' ' || e.key === 'p') { e.preventDefault(); running ? pause() : resume(); }
  };
  document.addEventListener('keydown', onKey);

  const fresh = cycle.pos === 0 && !cycle.elapsedMs;
  $('#pause').onclick = () => (running ? pause() : resume());
  $('#resume').onclick = resume;
  $('#overlay').classList.add('show');
  $('#overlay').classList.toggle('hide-board', settings.hidePaused);
  $('#ovText').textContent = fresh ? `${t('Ciclo {n}', { n: cycle.n })} · ${tn(set.items.length, '{n} ejercicio', '{n} ejercicios')}` : t('Ciclo en pausa');
  $('#resume').textContent = '▶ ' + (fresh ? t('Empezar') : t('Reanudar'));
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
  catch (e) { feedback('failed', t('Error cargando el ejercicio'), esc(e.message)); }
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
  const title = item => (item.wp ? t('Ejercicio {n}', { n: item.wp }) : item.pgn ? t('Ejercicio {n}', { n: item.n }) : t('Puzle {id}', { id: item.id }));
  const sub = item => (item.wp ? wpLevelLabel(item.wp) : item.rating ? `Elo ${item.rating}` : item.label || '');

  // posición en que se jugó cada ejercicio
  const playedAt = new Map(cycle.order.map((idx, k) => [idx, k]));
  let rows = cycle.order.filter(idx => cycle.results[idx]).map(idx => ({ idx, r: cycle.results[idx] }));
  if (ui.filter === 'bad') rows = rows.filter(x => !x.r.ok);
  if (ui.filter === 'ok') rows = rows.filter(x => x.r.ok);
  if (ui.sort === 'slow') rows.sort((a, b) => b.r.ms - a.r.ms);
  if (ui.sort === 'num') rows.sort((a, b) => a.idx - b.idx);
  const history = idx => set.cycles.map(c => {
    const r = c.results[idx];
    return `<i class="hdot ${r ? (r.ok ? 'ok' : 'bad') : ''}" title="${t('Ciclo {n}', { n: c.n })}: ${r ? (r.ok ? t('acierto') : t('fallo')) : t('sin hacer')}"></i>`;
  }).join('');

  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/set/${set.id}">‹</a><h1 class="ellipsis">${t('Ciclo {n}', { n: cycle.n })} · ${esc(set.name)}</h1><span></span></header>
    <main class="wrap">
      <section class="card">
        <div class="row small"><span>${t('{n}/{m} hechos · {p} de acierto', { n: st.done, m: set.items.length, p: pct(st.acc) })}</span><span>⏱ ${fmt(cycle.elapsedMs)}</span></div>
        <div class="chips">
          ${[['all', t('Todos ({n})', { n: st.done })], ['bad', t('Fallados ({n})', { n: st.failed })], ['ok', t('Acertados ({n})', { n: st.ok })]].map(([k, l]) => `<button class="chip ${ui.filter === k ? 'on' : ''}" data-filter="${k}">${l}</button>`).join('')}
        </div>
        <label class="small muted" for="sort">${t('Ordenar por')}</label>
        <select id="sort">
          <option value="played" ${ui.sort === 'played' ? 'selected' : ''}>${t('Orden en que los hiciste')}</option>
          <option value="num" ${ui.sort === 'num' ? 'selected' : ''}>${t('Número de ejercicio')}</option>
          <option value="slow" ${ui.sort === 'slow' ? 'selected' : ''}>${t('Más lentos primero')}</option>
        </select>
        <p class="small muted">${t('Los puntos muestran tu resultado en cada ciclo (verde acierto, rojo fallo). Toca un ejercicio para analizarlo.')}</p>
      </section>
      <section class="plist">
        ${rows.length ? rows.map(({ idx, r }) => `
          <button class="prow" data-idx="${idx}">
            <span class="pres ${r.ok ? 'ok' : 'bad'}">${r.ok ? '✓' : '✗'}</span>
            <span class="ptitle"><b>${esc(title(set.items[idx]))}</b> <small class="muted">${esc(sub(set.items[idx]))} · ${t('nº {n} del ciclo', { n: playedAt.get(idx) + 1 })}</small></span>
            <span class="phist">${history(idx)}</span>
            <span class="ptime">${fmt(r.ms)}</span>
          </button>`).join('') : `<p class="muted center">${t('No hay ejercicios con este filtro.')}</p>`}
      </section>
    </main>`;
  app.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { ui.filter = b.dataset.filter; route(); }));
  $('#sort').addEventListener('change', e => { ui.sort = e.target.value; route(); });
  app.querySelectorAll('[data-idx]').forEach(b => b.addEventListener('click', async () => {
    const idx = +b.dataset.idx;
    const p = await resolveItem(set.items[idx]);
    openAnalysis({ fen: p.fen, solution: mainLine(p.tree), wrong: cycle.results[idx]?.w || [], title: p.title, notes: p.notes, ref: { setId: set.id, cycleN: cycle.n, idx } });
  }));
}

// ---------- repaso de fallos (sin cronómetro) ----------
async function viewReview(id) {
  const set = store.getSet(id);
  if (!set) return go('#/');
  // último ciclo con ejercicios hechos (un ciclo recién empezado aún no tiene fallos que repasar)
  const last = [...set.cycles].reverse().find(c => Object.keys(c.results).length) || null;
  const list = last ? Object.entries(last.results).filter(([, r]) => !r.ok).map(([k]) => +k) : [];
  if (!list.length) return go('#/set/' + id);
  const settings = store.getSettings();
  let i = 0, cur = null, wrong = [];
  app.innerHTML = `
    <div class="train">
      <header class="top"><a class="icon-btn" href="#/set/${set.id}">‹</a><h1 class="ellipsis">${t('Repaso · ciclo {n}', { n: last.n })}</h1><span class="badge" id="cnt"></span></header>
      <div class="board-wrap"><div class="board" id="board"></div></div>
      <div class="info"><div class="turn" id="turn"></div><div class="feedback" id="fb"></div></div>
      <div class="actions">
        <button class="btn ghost" id="prev">‹ ${t('Anterior')}</button>
        <button class="btn ghost" id="sol">${t('Solución')}</button>
        <button class="btn ghost" id="analyse" aria-label="${t('Analizar')}">🔍</button>
        <button class="btn ghost" id="retry" aria-label="${t('Reintentar')}">↺</button>
        <button class="btn success" id="next">${t('Siguiente')} ›</button>
      </div>
    </div>`;
  const fb = (state, title, sub) => { $('#fb').innerHTML = state ? feedbackHtml(state, board.hero, title, sub) : ''; };
  const board = new PuzzleBoard($('#board'), {
    coords: settings.coords,
    onEvent: (ev, info) => {
      if (ev === 'wrong') { fb('bad', undefined, t('{m} no es la solución. Prueba otra cosa.', { m: esc(info.san) })); if (!wrong.includes(info.uci)) wrong.push(info.uci); }
      if (ev === 'good' || ev === 'progress') fb('good');
      if (ev === 'solved') fb(info.ok ? 'ok' : 'failed', info.ok ? undefined : t('Solución mostrada'), info.ok ? undefined : t('Puedes reintentarlo con ↺'));
    },
  });
  async function show() {
    const p = await resolveItem(set.items[list[i]]);
    cur = p; wrong = [];
    board.load(p);
    const white = board.hero === 'w';
    $('#cnt').textContent = `${i + 1}/${list.length}`;
    $('#turn').innerHTML = `<span class="dot ${white ? 'w' : 'b'}"></span> <b>${esc(p.title)}</b>`;
    fb('play');
  }
  $('#prev').onclick = () => { i = (i - 1 + list.length) % list.length; show(); };
  $('#next').onclick = () => { i = (i + 1) % list.length; show(); };
  $('#retry').onclick = show;
  $('#analyse').onclick = () => cur && openAnalysis({
    fen: cur.fen, solution: mainLine(cur.tree), wrong, title: cur.title, notes: cur.notes,
    ref: { setId: set.id, cycleN: last.n, idx: list[i] },
  });
  $('#sol').onclick = () => board.showSolution();
  cleanup = () => board.destroy();
  show();
}

// ---------- ajustes ----------
function syncCard() {
  const st = sync.state;
  if (!st.configured) return `<h2>${t('Sincronización')}</h2><p class="small muted">${t('No configurada: el progreso se guarda solo en este dispositivo.')}</p>`;
  if (!st.user) return `<h2>${t('Sincronización')}</h2>
    <p class="small muted">${t('Inicia sesión con Google para tener el mismo progreso en el móvil y en el PC. Solo hace falta una vez por dispositivo.')}</p>
    <button class="btn primary" id="gLogin">${t('Iniciar sesión con Google')}</button>
    ${st.error ? `<p class="small bad-text">${esc(st.error)}</p>` : ''}`;
  const status = { ok: '✓ ' + t('Sincronizado'), syncing: t('Sincronizando…'), error: '⚠ ' + t('Error') }[st.status] || '';
  return `<h2>${t('Sincronización')}</h2>
    <p class="small">${t('Conectado como {u}', { u: `<b>${esc(st.user.email || st.user.name || '')}</b>` })}</p>
    <p class="small ${st.status === 'error' ? 'bad-text' : 'muted'}">${status}${st.lastSync ? ' · ' + new Date(st.lastSync).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : ''}${st.error ? ' · ' + esc(st.error) : ''}</p>
    <button class="btn ghost" id="gLogout">${t('Cerrar sesión')}</button>`;
}

function bindSyncCard() {
  const card = $('#syncCard');
  if (!card) return;
  card.innerHTML = syncCard();
  $('#gLogin')?.addEventListener('click', () => sync.signIn().catch(e => alert(t('No se pudo iniciar sesión: {e}', { e: e.message }))));
  $('#gLogout')?.addEventListener('click', async () => {
    if (confirm(t('¿Cerrar sesión? Tu progreso seguirá en este dispositivo y en la nube.'))) await sync.signOut();
  });
}

function viewSettings() {
  const s = store.getSettings();
  const opts = [
    ['autoPause', t('Pausar automáticamente al salir de la app o bloquear la pantalla')],
    ['hidePaused', t('Ocultar el tablero mientras está en pausa')],
    ['autoNext', t('Pasar al siguiente ejercicio al acertar')],
    ['sound', t('Sonidos')],
    ['coords', t('Coordenadas en el tablero')],
  ];
  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/">‹</a><h1>${t('Ajustes')}</h1><span></span></header>
    <main class="wrap">
      <section class="card form">
        <label for="lang">${t('Idioma')}</label>
        <select id="lang">${LANGS.map(([k, l]) => `<option value="${k}" ${langSetting() === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
        ${opts.map(([k, l]) => `<label class="switch"><input type="checkbox" data-k="${k}" ${s[k] ? 'checked' : ''}><span>${l}</span></label>`).join('')}
      </section>
      <section class="card" id="syncCard">${syncCard()}</section>
      <section class="card form" id="habitCard">${habitSettings()}</section>
      <section class="card">
        <h2>Lichess</h2>
        ${(() => {
          const a = lichess.getAuth();
          return a
            ? `<p class="small">${t('Conectado como {u}', { u: `<b>${esc(a.username || '…')}</b>` })}${a.puzzleRating ? ` · ${t('Elo de puzles {r}', { r: a.puzzleRating })}` : ''}</p>
               <button class="btn ghost" id="liLogout">${t('Desconectar')}</button>`
            : `<p class="small muted">${t('Conecta tu cuenta para que los sets de Lichess se adapten a tu Elo de puzles.')}</p>
               <button class="btn ghost" id="liLogin">${t('Conectar con Lichess')}</button>`;
        })()}
      </section>
      <section class="card" id="collCard">
        <h2>${t('Colección de puzles de Lichess')}</h2>
        <p class="small muted">${t('Cada tema se descarga la primera vez que lo usas. Puedes descargar ahora los 15 temas para crear sets sin conexión: unos 17 MB de descarga y unos 39 MB de espacio en el dispositivo.')}</p>
        <p class="small" id="collStatus"></p>
        <div class="grid2">
          <button class="btn ghost" id="collDownload">⬇ ${t('Descargar todo')}</button>
          <button class="btn ghost" id="collClear">${t('Liberar espacio')}</button>
        </div>
      </section>
      <section class="card">
        <h2>${t('Tus datos')}</h2>
        <p class="muted small">${t('El progreso se guarda en este dispositivo y, si has iniciado sesión con Google, también en la nube. Puedes exportar una copia de seguridad o importarla en otro dispositivo.')}</p>
        <p class="small" id="persist"></p>
        <div class="grid2">
          <button class="btn ghost" id="exp">⬇ ${t('Exportar copia')}</button>
          <label class="btn ghost" for="imp">⬆ ${t('Importar copia')}</label>
        </div>
        <input type="file" id="imp" accept="application/json,.json" hidden>
      </section>
      <p class="muted small center">${t('Ejercicios: {book} (Axel Smith y Hans Tikkanen), 1128 diagramas.', { book: '<i>The Woodpecker Method</i>' })}</p>
    </main>`;
  $('#lang').addEventListener('change', e => {
    store.setSettings({ ...store.getSettings(), lang: e.target.value });
    applyDocumentLang();
    sync.saveLang().catch(() => {});
    route();
  });
  app.querySelectorAll('[data-k]').forEach(c => c.addEventListener('change', () => { s[c.dataset.k] = c.checked; store.setSettings(s); }));
  $('#liLogin')?.addEventListener('click', () => lichess.login());
  $('#liLogout')?.addEventListener('click', async () => { await lichess.logout(); route(); });
  bindSyncCard();
  bindHabitSettings(app, route);
  cleanup = sync.onChange(bindSyncCard);
  bindCollection();
  navigator.storage?.persisted?.().then(p => {
    $('#persist') && ($('#persist').textContent = p ? '✓ ' + t('Almacenamiento persistente activado') : t('El navegador podría borrar los datos si falta espacio: instala la app para protegerlos y exporta copias de vez en cuando.'));
  });
  $('#exp').onclick = () => {
    const blob = new Blob([store.exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `woodpecker-${t('copia')}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('#imp').onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    if (!confirm(t('Esto sustituirá todos los datos de este dispositivo por los de la copia. ¿Continuar?'))) return;
    try { store.importData(await f.text()); alert(t('Copia importada')); go('#/'); }
    catch (err) { alert(t('Error: {e}', { e: err.message })); }
  };
}

function bindCollection() {
  let ctrl = null;
  const show = async () => {
    const st = await collectionStatus().catch(() => null);
    if (!$('#collStatus')) return;
    if (!st) { $('#collCard').hidden = true; return; }
    $('#collStatus').textContent = st.saved === st.total
      ? '✓ ' + t('Colección completa guardada en este dispositivo')
      : t('Temas guardados en este dispositivo: {n} de {m}', { n: st.saved, m: st.total });
    $('#collDownload').hidden = st.saved === st.total;
    $('#collClear').disabled = !st.saved;
  };
  $('#collDownload').onclick = async () => {
    const btn = $('#collDownload');
    btn.disabled = true;
    ctrl = new AbortController();
    try {
      await downloadCollection((n, m) => { if ($('#collStatus')) $('#collStatus').textContent = t('Descargando… {n}/{m}', { n, m }); }, ctrl.signal);
    } catch (err) {
      if ($('#collStatus')) { await show(); $('#collStatus').textContent += ' · ' + t('Error: {e}', { e: err.message }); }
    }
    btn.disabled = false;
    show();
  };
  $('#collClear').onclick = async () => {
    if (!confirm(t('¿Borrar la colección guardada? Se volverá a descargar cada tema cuando lo uses.'))) return;
    await clearCollection();
    show();
  };
  show();
  const prev = cleanup;
  cleanup = () => { ctrl?.abort(); prev?.(); };
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
