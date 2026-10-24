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
import { viewOpenings, viewOpening, viewOpeningLine, localVideos, importLocalVideos, clearLocalVideos, csvVideos, importCsvVideos, clearCsvVideos, videoPlayer } from './openings.js';
import { viewOpeningTree } from './opening-tree.js';
import { viewCoach, viewCoachGame } from './coach.js';
import { viewEndgames, viewEndgameChapter, viewEndgame } from './endgames.js';
import { t, tn, locale, san, LANGS, langSetting, applyDocumentLang } from './i18n.js';

const app = document.getElementById('app');

// Phones: the docked action bar (style.css) needs room below the content; track its height
const dockRO = new ResizeObserver(es => { for (const e of es) document.documentElement.style.setProperty('--dock-h', e.target.offsetHeight + 'px'); });
let docked = null;
new MutationObserver(() => {
  const bar = app.querySelector('.train .actions');
  if (bar === docked) return;
  if (docked) dockRO.unobserve(docked);
  docked = bar;
  if (bar) dockRO.observe(bar);
}).observe(app, { childList: true, subtree: true });
let cleanup = null; // exit function of the current view

// ---------- utilities ----------
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

// ---------- PWA install ----------
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (location.hash === '' || location.hash === '#/') route(); });
// Ask for persistent storage so Android does not evict the data
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
  if (view === 'videos') return viewVideos();
  if (view === 'openings') return viewOpenings(app);
  if (view === 'opening') {
    const lineId = location.hash.split('/')[3];
    if (lineId) { cleanup = viewOpeningLine(app, id, lineId, 'study', go); return; }
    return viewOpening(app, id, go);
  }
  if (view === 'drill') { cleanup = viewOpeningLine(app, id, location.hash.split('/')[3], 'drill', go); return; }
  if (view === 'tree' || view === 'tdrill') {
    const [, , , lineId, start] = location.hash.split('/');
    cleanup = viewOpeningTree(app, id, lineId, view === 'tree' ? 'study' : 'drill', go, start);
    return;
  }
  if (view === 'analysis') { cleanup = viewAnalysis(app); return; }
  if (view === 'endgames') { if (id) viewEndgameChapter(app, id); else viewEndgames(app); return; }
  if (view === 'endgame') { cleanup = viewEndgame(app, id, location.hash.split('/')[3], go); return; }
  if (view === 'coach') {
    if (id) cleanup = viewCoachGame(app, id, location.hash.split('/')[3], go);
    else viewCoach(app, go);
    return;
  }
  return viewHome();
}
window.addEventListener('hashchange', route);

// ---------- home ----------
function viewHome() {
  const sets = store.sets();
  const h = habitOn() ? store.habitState() : null;
  app.innerHTML = `
    <header class="top">
      <h1><span class="logo">♞</span> Woodpecker</h1>
      <div class="top-right">
        ${h ? `<span class="badge" title="${t('Day streak')}">🔥 ${h.streak}</span>` : ''}
        ${syncBadge()}
        <a class="icon-btn" href="#/stats" aria-label="${t('Statistics')}">📊</a>
        <a class="icon-btn" href="#/settings" aria-label="${t('Settings')}">⚙</a>
      </div>
    </header>
    <main class="wrap">
      ${installEvt ? `<button class="btn ghost full" id="install">📲 ${t('Install the app')}</button>` : ''}
      ${streakCard()}
      ${gamifyOn() ? levelCard(false) : ''}
      <nav class="home-tiles">
        <a class="card home-tile" href="#/endgames"><span class="tile-icon">♔</span><strong>${t('Endgames')}</strong><small class="muted">${t('The 100 endgames you must know')}</small></a>
        <a class="card home-tile" href="#/coach"><span class="tile-icon">🎓</span><strong>${t('Game review')}</strong><small class="muted">${t('Review your Lichess games')}</small></a>
        <a class="card home-tile" href="#/openings"><span class="tile-icon">📖</span><strong>${t('Openings')}</strong><small class="muted">${t('Repertoire trees and traps')}</small></a>
        ${csvVideos().length ? `<a class="card home-tile" href="#/videos"><span class="tile-icon">🎬</span><strong>${t('Opening videos')}</strong><small class="muted">${tn(csvVideos().length, '{n} video', '{n} videos')}</small></a>` : ''}
      </nav>
      <a class="btn primary full" href="#/new">＋ ${t('New set')}</a>
      ${sets.length ? '' : `
        <section class="card">
          <h2>${t('Start with the Woodpecker Method')}</h2>
          <p class="muted">${t('The 1,128 puzzles from the book, repeated in faster and faster cycles.')}</p>
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

function viewVideos() {
  const vids = csvVideos();
  if (!vids.length) return go('#/');
  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/">‹</a><h1>${t('Opening videos')}</h1><span></span></header>
    <main class="wrap">
      <section class="card video-home">
        ${vids.map(([title, url], i) => `<details data-video="${i}"><summary>${esc(title || url)}</summary></details>`).join('')}
      </section>
    </main>`;
  // the player is only created when a video is opened, and removed when it is closed
  app.querySelectorAll('[data-video]').forEach(d => d.addEventListener('toggle', () => {
    d.querySelector('.video-frame')?.remove();
    if (d.open) d.insertAdjacentHTML('beforeend', videoPlayer(vids[d.dataset.video]?.[1] || ''));
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
  return `<a class="badge ${st.status === 'error' ? 'bad' : ''}" href="#/settings" title="${t('Sync')}">${icon}</a>`;
}

function setCard(set) {
  const cur = store.currentCycle(set);
  const fin = set.cycles.filter(c => c.finishedAt).length;
  const st = cur ? store.cycleStats(cur) : null;
  return `
    <a class="card set-card" href="#/set/${set.id}">
      <div class="row">
        <strong>${esc(set.name)}</strong>
        <span class="muted">${tn(set.items.length, '{n} puzzle', '{n} puzzles')}</span>
      </div>
      <div class="row muted small">
        <span>${set.targetCycles ? t('{n} of {m} cycles completed', { n: fin, m: set.targetCycles }) : tn(fin, '{n} cycle completed', '{n} cycles completed')}</span>
        ${cur ? `<span>${t('Cycle {n}', { n: cur.n })}: ${cur.pos}/${set.items.length} · ${fmt(cur.elapsedMs)}</span>` : ''}
      </div>
      ${cur ? `<div class="bar"><i style="width:${(cur.pos / set.items.length) * 100}%"></i></div>` : ''}
      ${st && st.done ? `<div class="small muted">${t('Cycle accuracy: {p}', { p: pct(st.acc) })}</div>` : ''}
    </a>`;
}

function createWpSet(from, to, order, name, targetCycles = 7) {
  const items = [];
  for (let n = from; n <= to; n++) items.push({ wp: n });
  return store.addSet({ id: store.uid(), name, source: 'woodpecker', range: [from, to], order, targetCycles, createdAt: Date.now(), items, cycles: [] });
}

// ---------- new set ----------
function viewNew() {
  let tab = 'wp';
  const render = () => {
    app.innerHTML = `
      <header class="top"><a class="icon-btn" href="#/">‹</a><h1>${t('New set')}</h1><span></span></header>
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
      <label>${t('Level')}</label>
      <div class="chips" id="levels">
        ${WP_LEVELS.map((l, i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-from="${l.from}" data-to="${l.to}">${t(l.label)}<small>${l.from}–${l.to}</small></button>`).join('')}
        <button class="chip" data-custom="1">${t('Custom')}</button>
      </div>
      <div class="grid2">
        <div><label for="from">${t('From no.')}</label><input id="from" type="number" min="1" max="${WP_TOTAL}" value="1" inputmode="numeric"></div>
        <div><label for="to">${t('To no.')}</label><input id="to" type="number" min="1" max="${WP_TOTAL}" value="222" inputmode="numeric"></div>
      </div>
      <p class="muted small" id="count"></p>
      <label for="order">${t('Order')}</label>
      <select id="order">
        <option value="seq">${t('Book order')}</option>
        <option value="random">${t('Random (reshuffled every cycle)')}</option>
      </select>
      <label for="cycles">${t('Target cycles')}</label>
      <input id="cycles" type="number" min="1" max="20" value="7" inputmode="numeric">
      <label for="name">${t('Name')}</label>
      <input id="name" type="text">
      <button class="btn primary full" id="create">${t('Create set')}</button>
    </section>
    <p class="muted small">${t('Book levels: 1–222 easy, 223–984 intermediate, 985–1128 advanced.')}
    ${t('Solutions were computed with Stockfish; if your move also wins but is not accepted, you can mark it as correct.')}</p>`;
}

function bindWp() {
  const from = $('#from'), to = $('#to'), name = $('#name');
  let nameTouched = false;
  const upd = () => {
    const a = Math.max(1, Math.min(WP_TOTAL, +from.value || 1));
    const b = Math.max(1, Math.min(WP_TOTAL, +to.value || 1));
    $('#count').textContent = b >= a ? tn(b - a + 1, '{n} puzzle', '{n} puzzles') : t('Invalid range');
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
    if (!(a >= 1 && b <= WP_TOTAL && b >= a)) return alert(t('Invalid range (1–1128).'));
    const set = createWpSet(a, b, $('#order').value, name.value.trim() || wpSetName(a, b), +$('#cycles').value || 7);
    go('#/set/' + set.id);
  });
}

// Ids of Lichess puzzles already in some set (to prefer new ones)
const usedLichessIds = () => new Set(store.sets().filter(x => x.source === 'lichess').flatMap(x => x.items.map(i => i.id)));

function formLichess() {
  const a = lichess.getAuth();
  const myElo = a?.puzzleRating || '';
  return `
    <section class="card form">
      <label>${t('Puzzle source')}</label>
      <div class="tabs small-tabs">
        <button class="tab on" data-src="local">${t('Local collection')}</button>
        <button class="tab" data-src="api">${t('Lichess (your account)')}</button>
      </div>
      <p class="muted small" id="srcHelp"></p>
      <div id="apiLogin" hidden>
        ${a ? `<p class="small">${t('Connected to Lichess as {u}', { u: `<b>${esc(a.username || '')}</b>` })}${a.puzzleRating ? ` · ${t('Puzzle rating {r}', { r: a.puzzleRating })}` : ''}</p>`
          : `<p class="small">${t('Connect your Lichess account to use this source.')}</p><button class="btn ghost" id="liLogin">${t('Connect with Lichess')}</button>`}
      </div>
      <label for="theme">${t('Theme')}</label>
      <select id="theme">${LICHESS_THEMES.map(([k]) => `<option value="${k}">${themeLabel(k)}</option>`).join('')}</select>
      <label>${t('Difficulty')}</label>
      <div class="tabs small-tabs" id="modeTabs">
        <button class="tab on" data-mode="abs">${t('Rating range')}</button>
        <button class="tab" data-mode="rel">${t('Relative to my rating')}</button>
      </div>
      <div id="modeAbs">
        <div class="grid2">
          <div><label for="minR">${t('Min rating')}</label><input id="minR" type="number" min="300" max="3100" step="50" value="${myElo ? Math.max(400, Math.round((myElo - 200) / 50) * 50) : 1400}" inputmode="numeric"></div>
          <div><label for="maxR">${t('Max rating')}</label><input id="maxR" type="number" min="300" max="3100" step="50" value="${myElo ? Math.round((myElo + 200) / 50) * 50 : 1600}" inputmode="numeric"></div>
        </div>
      </div>
      <div id="modeRel" hidden>
        <select id="diff">${LICHESS_DIFFS.map(([k]) => `<option value="${k}" ${k === 'normal' ? 'selected' : ''}>${diffLabel(k)}</option>`).join('')}</select>
        <div id="myEloBox"><label for="myElo">${t('Your puzzle rating')}</label><input id="myElo" type="number" min="400" max="3200" step="10" value="${myElo || 1500}" inputmode="numeric"></div>
        <p class="muted small" id="relHelp"></p>
      </div>
      <p class="small muted" id="avail"></p>
      <label for="n">${t('Number of puzzles')}</label>
      <input id="n" type="number" min="10" max="500" value="100" inputmode="numeric">
      <label class="switch" id="preferBox"><input type="checkbox" id="preferNew" checked><span>${t('Prefer puzzles that are not in other sets')}</span></label>
      <label for="order">${t('Order')}</label>
      <select id="order">
        <option value="seq">${t('Fixed')}</option>
        <option value="random">${t('Random (reshuffled every cycle)')}</option>
      </select>
      <label for="cycles">${t('Target cycles')}</label>
      <input id="cycles" type="number" min="1" max="20" value="5" inputmode="numeric">
      <label for="name">${t('Name')}</label>
      <input id="name" type="text" placeholder="${t('Automatic')}">
      <button class="btn primary full" id="create">${t('Create set')}</button>
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
      ? t('A selection of about 450,000 puzzles from the Lichess database included in the app: any theme and range, instantly and offline.')
      : t('Lichess picks puzzles based on your puzzle rating, in batches of 50 without repeats. Needs a connection.');
    $('#apiLogin').hidden = src !== 'api';
    $('#modeTabs').hidden = src === 'api';
    $('#modeAbs').hidden = src === 'api' || mode !== 'abs';
    $('#modeRel').hidden = src === 'local' && mode !== 'rel';
    $('#myEloBox').hidden = src === 'api';
    $('#preferBox').hidden = src === 'api';
    $('#create').disabled = src === 'api' && !auth;
    $('#create').textContent = src === 'api' ? t('Download and create') : t('Create set');
    if (src === 'local' && mode === 'rel') {
      const [lo, hi] = relRange();
      $('#relHelp').textContent = t('Puzzles from {a} to {b}.', { a: lo, b: hi });
    } else if (src === 'api') {
      $('#relHelp').textContent = auth?.puzzleRating ? t('Relative to your puzzle rating ({r}). Each level is about 300 points up or down.', { r: auth.puzzleRating }) : '';
    }
    if (src === 'local') {
      const [lo, hi] = range();
      const n = lo > 0 && hi >= lo ? await localAvailable($('#theme').value, lo, hi).catch(() => null) : null;
      $('#avail').textContent = n == null ? '' : t('Available in the collection: ~{n}', { n });
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
        if (!(lo > 0 && hi >= lo)) { btn.disabled = false; return status(t('The rating range is not valid.')); }
        status(t('Loading the collection…'));
        const r = await pickLocalPuzzles({ theme, min: lo, max: hi, count, avoid: $('#preferNew').checked ? usedLichessIds() : new Set() });
        items = r.items;
        if (!items.length) throw new Error(t('There are no puzzles of that theme in that range. Try a wider range.'));
        if (items.length < count && !confirm(t('There are only {n} puzzles of that theme in that range. Create the set with {n}?', { n: items.length }))) { btn.disabled = false; return status(''); }
        if (r.repeated) alert(t('{n} puzzles were already in other sets (there were not enough new ones in that range).', { n: r.repeated }));
        label = `${lo}–${hi}`;
        meta = { theme, source: 'local', mode, minRating: lo, maxRating: hi };
      } else {
        ctrl = new AbortController();
        const difficulty = $('#diff').value;
        const r = await fetchLichessPuzzles({ theme, difficulty, count }, (n, msg) => status(msg || t('Downloading… {n}/{m}', { n, m: count })), ctrl.signal);
        items = r.items;
        if (!items.length) throw new Error(r.rateLimited ? t('Lichess is rate-limiting requests. Please try again in a while.') : t('Lichess returned no puzzles.'));
        const q = r.rateLimited
          ? t('Lichess rate-limited the requests and only {n} of {m} puzzles were downloaded. Create the set with {n}?', { n: items.length, m: count })
          : t('Only {n} of {m} puzzles were found. Create the set with {n}?', { n: items.length, m: count });
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

// ---------- set page ----------
function viewSet(id) {
  const set = store.getSet(id);
  if (!set) return go('#/');
  const cur = store.currentCycle(set);
  const finished = set.cycles.filter(c => c.finishedAt);
  // last cycle with puzzles done (a just-started cycle has no mistakes to review yet)
  const last = [...set.cycles].reverse().find(c => Object.keys(c.results).length) || null;
  const failedIdx = last ? Object.entries(last.results).filter(([, r]) => !r.ok).map(([k]) => +k) : [];
  const prev = finished[finished.length - 1];
  const target = prev ? prev.elapsedMs / 2 : null;
  const source = set.source === 'woodpecker'
    ? `The Woodpecker Method · ${t('no. {a}–{b}', { a: set.range[0], b: set.range[1] })}`
    : set.source === 'pgn' ? t('Imported PGN')
    : set.source === 'review' ? t('Selection of the positions you miss most')
    : set.source === 'opening' ? `${t('Opening tactics')}${set.opening?.eloMin ? ` · Elo ${set.opening.eloMin}–${set.opening.eloMax}` : ''}`
    : `Lichess · ${esc(set.lichess?.theme ? themeLabel(set.lichess.theme) : t('puzzles'))}${set.lichess?.eloAvg ? ` · Elo ${set.lichess.eloMin}–${set.lichess.eloMax} (${t('avg {n}', { n: set.lichess.eloAvg })})` : ''}`;
  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/">‹</a><h1 class="ellipsis">${esc(set.name)}</h1>
      <button class="icon-btn" id="menu" aria-label="${t('Options')}">⋯</button></header>
    <main class="wrap">
      <section class="card opts" id="opts" hidden>
        <button class="btn ghost" id="rename">${t('Rename')}</button>
        ${cur ? `<button class="btn ghost" id="reset">${t('Restart current cycle')}</button>` : ''}
        <button class="btn danger" id="del">${t('Delete set')}</button>
      </section>
      <section class="card">
        <div class="row"><span class="muted">${source}</span>
        <span class="muted">${tn(set.items.length, '{n} puzzle', '{n} puzzles')}</span></div>
        <div class="row muted small"><span>${set.order === 'random' ? t('Random order') : set.source === 'woodpecker' ? t('Book order') : set.source === 'pgn' ? t('File order') : t('Fixed order')}</span>
        <span>${t('{n}/{m} cycles', { n: finished.length, m: set.targetCycles || '–' })}</span></div>
        ${cur ? `
          <div class="bar big"><i style="width:${(cur.pos / set.items.length) * 100}%"></i></div>
          <div class="row small"><span>${t('Cycle {n}', { n: cur.n })}: ${cur.pos}/${set.items.length}</span><span>⏱ ${fmt(cur.elapsedMs)}</span></div>
          <a class="btn primary full" href="#/train/${set.id}">▶ ${t('Continue cycle {n}', { n: cur.n })}</a>
        ` : `
          ${target ? `<p class="small muted">${t('Method goal: complete cycle {n} in half the time (≈ {time}).', { n: set.cycles.length + 1, time: fmt(target) })}</p>` : ''}
          <button class="btn primary full" id="start">▶ ${t('Start cycle {n}', { n: set.cycles.length + 1 })}</button>
        `}
        ${failedIdx.length
          ? `<a class="btn ghost full" href="#/review/${set.id}">${t('Review mistakes from cycle {n} ({k})', { n: last.n, k: failedIdx.length })}${last.review?.ok?.length ? ` · ✓ ${last.review.ok.filter(k => failedIdx.includes(k)).length}` : ''}</a>`
          : `<p class="small muted">🔁 ${last ? t('Mistake review: no mistakes to review in cycle {n}.', { n: last.n }) : t('Mistake review: here you can review the puzzles you miss, without the clock.')}</p>`}
      </section>
      ${!set.cycles.length ? `
      <section class="card">
        <h2>${t('Cycles')}</h2>
        <p class="small muted">${t("You have not started any cycle yet. Once you do, you will see each cycle's time and accuracy here, how they evolve, and the list of puzzles to analyse.")}</p>
      </section>` : ''}
      ${set.cycles.length ? `
      <section class="card">
        <h2>${t('Cycles')}</h2>
        ${chart(set)}
        <table class="tbl">
          <thead><tr><th>#</th><th>${t('Started')}</th><th>${t('Time')}</th><th>${t('Done')}</th><th>${t('Accuracy')}</th></tr></thead>
          <tbody>${set.cycles.map(c => {
            const st = store.cycleStats(c);
            return `<tr class="${c.finishedAt ? '' : 'live'} clickable" data-cycle="${c.n}"><td>${c.n} ›</td><td>${date(c.startedAt)}</td><td>${fmt(c.elapsedMs)}</td>
              <td>${st.done}/${set.items.length}</td><td>${st.done ? pct(st.acc) : '–'}</td></tr>`;
          }).join('')}</tbody>
        </table>
        <p class="small muted">${t('Tap a cycle to see its puzzles one by one and analyse them.')}</p>
        ${finished.length ? `<p class="small muted">${t('Average time per puzzle in the last cycle: {time}', { time: fmt(prev.elapsedMs / set.items.length) })}</p>` : ''}
      </section>` : ''}
    </main>`;
  $('#start')?.addEventListener('click', () => { store.startCycle(set); go('#/train/' + set.id); });
  app.querySelectorAll('[data-cycle]').forEach(r => r.addEventListener('click', () => go(`#/cycle/${set.id}/${r.dataset.cycle}`)));
  $('#menu').addEventListener('click', () => { $('#opts').hidden = !$('#opts').hidden; });
  $('#rename').onclick = () => {
    const n = prompt(t('New name'), set.name);
    if (n && n.trim()) { set.name = n.trim(); store.save(); route(); }
  };
  $('#reset') && ($('#reset').onclick = () => {
    if (confirm(t('Restart the current cycle? Its progress will be lost.'))) { set.cycles.pop(); store.save(); route(); }
  });
  $('#del').onclick = () => {
    if (confirm(t('Delete "{name}" and all its history?', { name: set.name }))) { store.deleteSet(set.id); go('#/'); }
  };
}

// Progress chart: bars = time per cycle, line = accuracy
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
    compare = `<p class="small">${t('Cycle {n} vs cycle 1:', { n: last.n })}
      ${t('time')} <b class="${dt <= 0 ? 'ok-text' : 'bad-text'}">${dt <= 0 ? '−' : '+'}${Math.abs(Math.round(dt * 100))}%</b> ·
      ${t('Accuracy').toLowerCase()} <b class="${da >= 0 ? 'ok-text' : 'bad-text'}">${da >= 0 ? '+' : '−'}${Math.abs(Math.round(da * 100))} pts</b></p>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${t('Time per cycle')}">
      ${grid}${bars}<polyline points="${pts}" class="cline"/>${dots}
    </svg>
    <p class="small muted legend"><i class="lg-bar"></i> ${t('Time')} &nbsp; <i class="lg-line"></i> ${t('Accuracy')}</p>
    ${compare}`;
}

// Puzzle status box, Lichess style
function feedbackHtml(state, hero, title, sub) {
  const icon = state === 'play'
    ? `<div class="cg-wrap fb-piece"><piece class="king ${hero === 'w' ? 'white' : 'black'}"></piece></div>`
    : `<div class="fb-icon ${['good', 'ok'].includes(state) ? 'good' : 'bad'}">${['good', 'ok'].includes(state) ? '✓' : '✗'}</div>`;
  const tt = title ?? { play: t('Your turn'), good: t('Best move!'), bad: t("That's not the move!"), ok: t('Correct!'), failed: t('Puzzle failed') }[state];
  const st = sub ?? {
    play: hero === 'w' ? t('Find the best move for white.') : t('Find the best move for black.'),
    good: t('Keep going…'), bad: t('Try something else.'), ok: t('Puzzle solved'), failed: t('Added to the mistake review'),
  }[state];
  return `<div class="pfb ${state}">${icon}<div class="pfb-text"><strong>${tt}</strong><em>${st}</em></div></div>`;
}

// Pause/play icons as SVG: the ⏸/▶ characters are drawn as coloured emoji on Android
const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M7 4.5v15l13-7.5z"/></svg>';
const ICON_PLAY_SMALL = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M7 4.5v15l13-7.5z"/></svg>';

// ---------- training (timed cycle) ----------
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
        <h1 class="ellipsis">${t('Cycle {n}', { n: cycle.n })} · ${esc(set.name)}</h1>
        <button class="icon-btn pause-btn" id="pause" aria-label="${t('Pause')}">${ICON_PAUSE}</button></header>
      <div class="stats">
        <div><small>${t('Cycle')}</small><b id="tCycle">00:00</b></div>
        <div><small>${t('Puzzle')}</small><b id="tPuzzle">00:00</b></div>
        <div><small>${t('Progress')}</small><b id="prog"></b></div>
        <div><small>${t('Accuracy')}</small><b id="acc"></b></div>
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
  let curMs = cycle.curMs || 0;        // time spent on the current puzzle
  let puzzle = null, solved = false, advanceTimer = null, tickTimer = null;
  let wrongMoves = [];
  let lastMs = 0; // time of the puzzle just finished, shown until the next one loads
  // last finished puzzle, so it can be analysed after moving on
  const PREV_KEY = 'wp:prev:' + set.id;
  let prevPayload = null;
  try { prevPayload = JSON.parse(sessionStorage.getItem(PREV_KEY) || 'null'); } catch {}

  const now = () => performance.now();
  // The clock only runs while a puzzle is on the board: it stops when the puzzle is finished
  // and restarts when the next one is loaded.
  const live = () => (running && !solved ? now() - runStart : 0);

  function commit() {
    if (!running) return;
    if (!solved) {
      const d = now() - runStart;
      cycle.elapsedMs += d;
      curMs += d;
      cycle.curMs = curMs;
    }
    runStart = now();
    store.save();
  }
  function pause(text = t('Paused')) {
    if (!running) return;
    commit();
    running = false;
    board.setPaused(true);
    $('#ovText').textContent = text;
    $('#resume').innerHTML = ICON_PLAY_SMALL + ' ' + t('Resume');
    $('#overlay').classList.add('show');
    $('#overlay').classList.toggle('hide-board', settings.hidePaused);
    $('#pause').innerHTML = ICON_PLAY;
    tick();
    sync.flush().catch(() => {});
  }
  function resume() {
    if (running) return;
    running = true;
    runStart = now();
    board.setPaused(false);
    $('#overlay').classList.remove('show');
    $('#pause').innerHTML = ICON_PAUSE;
  }
  function tick() {
    $('#tCycle').textContent = fmt(cycle.elapsedMs + live());
    $('#tPuzzle').textContent = fmt(solved ? lastMs : curMs + live());
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
    runStart = now(); // the new puzzle's clock starts now, not when the previous one ended
    wrongMoves = [];
    board.load(puzzle);
    board.failed = !!cycle.curFailed;
    board.setPaused(!running);
    const white = board.hero === 'w';
    $('#turn').innerHTML = `<span class="dot ${white ? 'w' : 'b'}"></span> <b>${esc(puzzle.title)}</b> <span class="muted">${esc(puzzle.sub || '')}</span>`;
    if (cycle.curFailed) feedback('bad', t('Keep trying'), t('This puzzle already counts as failed.'));
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
        ${r ? (r.ok
          ? `<button class="btn ghost" id="markBad">✗ ${t('Count as incorrect')}</button>`
          : `<button class="btn ghost" id="markOk">✓ ${t('Count as correct')}</button>`) : ''}
        <button class="btn ghost" id="analyse">🔍 ${t('Analyse')}</button>
        <button class="btn success" id="next">${t('Next')} ›</button>`;
      $('#next').onclick = loadCurrent;
      $('#analyse').onclick = () => openAnalysis(prevPayload);
      // manual override of the result, in both directions (failed puzzles go to the mistake review)
      $('#markOk') && ($('#markOk').onclick = () => {
        r.ok = true; store.save(); updHeader();
        feedback('ok', t('Marked as correct'), t('It counts as solved in this cycle')); renderActions();
      });
      $('#markBad') && ($('#markBad').onclick = () => {
        clearTimeout(advanceTimer);
        r.ok = false; store.save(); updHeader();
        feedback('failed', t('Marked as incorrect'), t('Added to the mistake review')); renderActions();
      });
    } else {
      a.innerHTML = `
        ${prevPayload ? `<button class="btn ghost" id="prevAn">🔍 ${t('Analyse previous')}</button>` : ''}
        <button class="btn ghost" id="sol">${t('View solution')}</button>`;
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
      feedback('bad', undefined, t('{m} is not the solution. Try something else.', { m: esc(san(info.san)) }));
    } else if (type === 'good') {
      feedback('good');
    } else if (type === 'progress') {
      feedback('good', undefined, t('Keep going, your move.'));
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
      lastMs = curMs;
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
      <header class="top"><a class="icon-btn" href="#/set/${set.id}">‹</a><h1>${t('Cycle {n} completed', { n: cycle.n })}</h1><span></span></header>
      <main class="wrap"><section class="card center">
        <div class="big-num">${fmt(cycle.elapsedMs)}</div>
        <p>${t('{ok}/{done} correct · {p} accuracy', { ok: st.ok, done: st.done, p: pct(st.acc) })}</p>
        ${prev ? `<p class="muted">${t('Previous cycle: {time} · {p}', { time: fmt(prev.elapsedMs), p: pct(store.cycleStats(prev).acc) })}</p>` : ''}
        <p class="muted small">${t('The method recommends resting and repeating the set in half the time.')}</p>
        <a class="btn primary full" href="#/set/${set.id}">${t('Back to set')}</a>
      </section></main>`;
  }

  // Auto-pause when leaving the app or locking the phone
  const onVis = () => {
    if (document.hidden && settings.autoPause) pause(t('Paused automatically'));
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
  $('#ovText').textContent = fresh ? `${t('Cycle {n}', { n: cycle.n })} · ${tn(set.items.length, '{n} puzzle', '{n} puzzles')}` : t('Cycle paused');
  $('#resume').innerHTML = ICON_PLAY_SMALL + ' ' + (fresh ? t('Start') : t('Resume'));
  $('#pause').innerHTML = ICON_PLAY;
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
  catch (e) { feedback('failed', t('Error loading the puzzle'), esc(e.message)); }
  tick();
}

// ---------- a cycle's puzzles ----------
const CYCLE_UI = {}; // filter and sort remembered per set during the session
function viewCycle(id, n) {
  const set = store.getSet(id);
  const cycle = set?.cycles.find(c => c.n === n);
  if (!cycle) return go('#/set/' + id);
  const ui = CYCLE_UI[id] || (CYCLE_UI[id] = { filter: 'all', sort: 'played' });
  const st = store.cycleStats(cycle);
  const title = item => (item.wp ? t('Puzzle {n}', { n: item.wp }) : item.pgn ? t('Puzzle {n}', { n: item.n }) : t('Puzzle {id}', { id: item.id }));
  const sub = item => (item.wp ? wpLevelLabel(item.wp) : item.rating ? `Elo ${item.rating}` : item.label || '');

  // position in which each puzzle was played
  const playedAt = new Map(cycle.order.map((idx, k) => [idx, k]));
  let rows = cycle.order.filter(idx => cycle.results[idx]).map(idx => ({ idx, r: cycle.results[idx] }));
  if (ui.filter === 'bad') rows = rows.filter(x => !x.r.ok);
  if (ui.filter === 'ok') rows = rows.filter(x => x.r.ok);
  if (ui.sort === 'slow') rows.sort((a, b) => b.r.ms - a.r.ms);
  if (ui.sort === 'num') rows.sort((a, b) => a.idx - b.idx);
  const history = idx => set.cycles.map(c => {
    const r = c.results[idx];
    return `<i class="hdot ${r ? (r.ok ? 'ok' : 'bad') : ''}" title="${t('Cycle {n}', { n: c.n })}: ${r ? (r.ok ? t('solved') : t('failed')) : t('not done')}"></i>`;
  }).join('');

  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/set/${set.id}">‹</a><h1 class="ellipsis">${t('Cycle {n}', { n: cycle.n })} · ${esc(set.name)}</h1><span></span></header>
    <main class="wrap">
      <section class="card">
        <div class="row small"><span>${t('{n}/{m} done · {p} accuracy', { n: st.done, m: set.items.length, p: pct(st.acc) })}</span><span>⏱ ${fmt(cycle.elapsedMs)}</span></div>
        <div class="chips">
          ${[['all', t('All ({n})', { n: st.done })], ['bad', t('Failed ({n})', { n: st.failed })], ['ok', t('Solved ({n})', { n: st.ok })]].map(([k, l]) => `<button class="chip ${ui.filter === k ? 'on' : ''}" data-filter="${k}">${l}</button>`).join('')}
        </div>
        <label class="small muted" for="sort">${t('Sort by')}</label>
        <select id="sort">
          <option value="played" ${ui.sort === 'played' ? 'selected' : ''}>${t('Order you played them')}</option>
          <option value="num" ${ui.sort === 'num' ? 'selected' : ''}>${t('Puzzle number')}</option>
          <option value="slow" ${ui.sort === 'slow' ? 'selected' : ''}>${t('Slowest first')}</option>
        </select>
        <p class="small muted">${t('Dots show your result in each cycle (green solved, red failed). Tap a puzzle to analyse it.')}</p>
      </section>
      <section class="plist">
        ${rows.length ? rows.map(({ idx, r }) => `
          <button class="prow" data-idx="${idx}">
            <span class="pres ${r.ok ? 'ok' : 'bad'}">${r.ok ? '✓' : '✗'}</span>
            <span class="ptitle"><b>${esc(title(set.items[idx]))}</b> <small class="muted">${esc(sub(set.items[idx]))} · ${t('no. {n} in the cycle', { n: playedAt.get(idx) + 1 })}</small></span>
            <span class="phist">${history(idx)}</span>
            <span class="ptime">${fmt(r.ms)}</span>
          </button>`).join('') : `<p class="muted center">${t('No puzzles match this filter.')}</p>`}
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

// ---------- mistake review (no clock) ----------
async function viewReview(id) {
  const set = store.getSet(id);
  if (!set) return go('#/');
  // last cycle with puzzles done (a just-started cycle has no mistakes to review yet)
  const last = [...set.cycles].reverse().find(c => Object.keys(c.results).length) || null;
  const list = last ? Object.entries(last.results).filter(([, r]) => !r.ok).map(([k]) => +k) : [];
  if (!list.length) return go('#/set/' + id);
  const settings = store.getSettings();
  // review progress lives in the cycle (so it syncs): puzzles solved cleanly and where you left off
  const rv = last.review = last.review || { ok: [], pos: 0 };
  rv.ok = rv.ok.filter(k => list.includes(k));
  let i = Math.min(rv.pos || 0, list.length - 1), cur = null, wrong = [];
  app.innerHTML = `
    <div class="train">
      <header class="top"><a class="icon-btn" href="#/set/${set.id}">‹</a><h1 class="ellipsis">${t('Review · cycle {n}', { n: last.n })}</h1><span class="badge" id="cnt"></span></header>
      <div class="board-wrap"><div class="board" id="board"></div></div>
      <div class="info"><div class="turn" id="turn"></div><div class="feedback" id="fb"></div>
        <div class="row small review-progress"><span id="rvOk"></span><button class="btn ghost" id="restart" hidden>↺ ${t('Repeat all')}</button></div></div>
      <div class="actions">
        <button class="btn ghost" id="prev">‹ ${t('Previous')}</button>
        <button class="btn ghost" id="sol">${t('Solution')}</button>
        <button class="btn ghost" id="analyse" aria-label="${t('Analyse')}">🔍</button>
        <button class="btn ghost" id="retry" aria-label="${t('Retry')}">↺</button>
        <button class="btn success" id="next">${t('Next')} ›</button>
      </div>
    </div>`;
  const fb = (state, title, sub) => { $('#fb').innerHTML = state ? feedbackHtml(state, board.hero, title, sub) : ''; };
  const board = new PuzzleBoard($('#board'), {
    coords: settings.coords,
    onEvent: (ev, info) => {
      if (ev === 'wrong') { fb('bad', undefined, t('{m} is not the solution. Try something else.', { m: esc(san(info.san)) })); if (!wrong.includes(info.uci)) wrong.push(info.uci); }
      if (ev === 'good' || ev === 'progress') fb('good');
      if (ev === 'solved') {
        if (info.ok && !rv.ok.includes(list[i])) { rv.ok.push(list[i]); store.save(); }
        const all = rv.ok.length === list.length;
        fb(info.ok ? 'ok' : 'failed', info.ok ? (all ? t('All the mistakes of this review are solved!') : undefined) : t('Solution shown'), info.ok ? undefined : t('You can retry it with ↺'));
        progress();
      }
    },
  });
  function progress() {
    $('#cnt').textContent = `${i + 1}/${list.length}`;
    $('#rvOk').textContent = `✓ ${t('{n} of {m} solved', { n: rv.ok.length, m: list.length })}${rv.ok.includes(list[i]) ? ' · ' + t('this one too') : ''}`;
    $('#restart').hidden = !rv.ok.length;
  }
  async function show() {
    const p = await resolveItem(set.items[list[i]]);
    cur = p; wrong = [];
    board.load(p);
    if (rv.pos !== i) { rv.pos = i; store.save(); }
    const white = board.hero === 'w';
    progress();
    $('#turn').innerHTML = `<span class="dot ${white ? 'w' : 'b'}"></span> <b>${esc(p.title)}</b>`;
    fb('play');
  }
  $('#prev').onclick = () => { i = (i - 1 + list.length) % list.length; show(); };
  $('#next').onclick = () => { i = (i + 1) % list.length; show(); };
  $('#retry').onclick = show;
  $('#restart').onclick = () => {
    if (!confirm(t('Start the review again from the first puzzle, with none marked as solved?'))) return;
    rv.ok = []; i = 0; store.save(); show();
  };
  $('#analyse').onclick = () => cur && openAnalysis({
    fen: cur.fen, solution: mainLine(cur.tree), wrong, title: cur.title, notes: cur.notes,
    ref: { setId: set.id, cycleN: last.n, idx: list[i] },
  });
  $('#sol').onclick = () => board.showSolution();
  cleanup = () => board.destroy();
  show();
}

// ---------- settings ----------
function syncCard() {
  const st = sync.state;
  if (!st.configured) return `<h2>${t('Sync')}</h2><p class="small muted">${t('Not configured: progress is stored on this device only.')}</p>`;
  if (!st.user) return `<h2>${t('Sync')}</h2>
    <p class="small muted">${t('Sign in with Google to have the same progress on your phone and computer. You only need to do it once per device.')}</p>
    <button class="btn primary" id="gLogin">${t('Sign in with Google')}</button>
    ${st.error ? `<p class="small bad-text">${esc(st.error)}</p>` : ''}`;
  const status = { ok: '✓ ' + t('Synced'), syncing: t('Syncing…'), error: '⚠ ' + t('Error') }[st.status] || '';
  return `<h2>${t('Sync')}</h2>
    <p class="small">${t('Signed in as {u}', { u: `<b>${esc(st.user.email || st.user.name || '')}</b>` })}</p>
    <p class="small ${st.status === 'error' ? 'bad-text' : 'muted'}">${status}${st.lastSync ? ' · ' + new Date(st.lastSync).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : ''}${st.error ? ' · ' + esc(st.error) : ''}</p>
    <button class="btn ghost" id="gLogout">${t('Sign out')}</button>`;
}

function bindSyncCard() {
  const card = $('#syncCard');
  if (!card) return;
  card.innerHTML = syncCard();
  $('#gLogin')?.addEventListener('click', () => sync.signIn().catch(e => alert(t('Could not sign in: {e}', { e: e.message }))));
  $('#gLogout')?.addEventListener('click', async () => {
    if (confirm(t('Sign out? Your progress will remain on this device and in the cloud.'))) await sync.signOut();
  });
}

function viewSettings() {
  const s = store.getSettings();
  const opts = [
    ['autoPause', t('Pause automatically when leaving the app or locking the screen')],
    ['hidePaused', t('Hide the board while paused')],
    ['autoNext', t('Go to the next puzzle after solving')],
    ['sound', t('Sounds')],
    ['coords', t('Board coordinates')],
  ];
  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/">‹</a><h1>${t('Settings')}</h1><span></span></header>
    <main class="wrap">
      <section class="card form">
        <label for="lang">${t('Language')}</label>
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
            ? `<p class="small">${t('Signed in as {u}', { u: `<b>${esc(a.username || '…')}</b>` })}${a.puzzleRating ? ` · ${t('Puzzle rating {r}', { r: a.puzzleRating })}` : ''}</p>
               <button class="btn ghost" id="liLogout">${t('Disconnect')}</button>`
            : `<p class="small muted">${t('Connect your account so Lichess sets adapt to your puzzle rating.')}</p>
               <button class="btn ghost" id="liLogin">${t('Connect with Lichess')}</button>`;
        })()}
      </section>
      <section class="card" id="collCard">
        <h2>${t('Lichess puzzle collection')}</h2>
        <p class="small muted">${t('Each theme is downloaded the first time you use it. You can download all 15 themes now to create sets offline: about 17 MB to download and about 39 MB of space on the device.')}</p>
        <p class="small" id="collStatus"></p>
        <div class="grid2">
          <button class="btn ghost" id="collDownload">⬇ ${t('Download all')}</button>
          <button class="btn ghost" id="collClear">${t('Free up space')}</button>
        </div>
      </section>
      <section class="card" id="videoCard">
        <h2>🎬 ${t('Opening videos')}</h2>
        <p class="small muted">${t('Import a file with a video link for each opening (JSON, or the format of opening-videos.js). The links are saved only on this device.')}</p>
        <p class="small" id="videoStatus"></p>
        <div class="grid2">
          <label class="btn ghost" for="videoImp">⬆ ${t('Import links')}</label>
          <button class="btn ghost" id="videoClear">${t('Remove')}</button>
        </div>
        <input type="file" id="videoImp" accept=".json,.js,application/json,text/javascript" hidden>
        <h3>${t('Video list')}</h3>
        <p class="small muted">${t('Import a CSV with the title in the first column and the video link in the second. The list appears on the home page, only on this device.')}</p>
        <p class="small" id="csvStatus"></p>
        <div class="grid2">
          <label class="btn ghost" for="csvImp">⬆ ${t('Import CSV')}</label>
          <button class="btn ghost" id="csvClear">${t('Remove')}</button>
        </div>
        <input type="file" id="csvImp" accept=".csv,text/csv" hidden>
      </section>
      <section class="card">
        <h2>${t('Your data')}</h2>
        <p class="muted small">${t('Progress is stored on this device and, if you signed in with Google, also in the cloud. You can export a backup or import it on another device.')}</p>
        <p class="small" id="persist"></p>
        <div class="grid2">
          <button class="btn ghost" id="exp">⬇ ${t('Export backup')}</button>
          <label class="btn ghost" for="imp">⬆ ${t('Import backup')}</label>
        </div>
        <input type="file" id="imp" accept="application/json,.json" hidden>
      </section>
      <p class="muted small center">${t('Puzzles: {book} (Axel Smith and Hans Tikkanen), 1,128 diagrams.', { book: '<i>The Woodpecker Method</i>' })}</p>
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
  const videoStatus = () => {
    const n = Object.keys(localVideos()).length;
    $('#videoStatus').textContent = n ? tn(n, '{n} opening with a video on this device', '{n} openings with a video on this device') : t('No links imported.');
    $('#videoClear').disabled = !n;
  };
  videoStatus();
  $('#videoImp').onchange = async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const r = importLocalVideos(await f.text());
      videoStatus();
      if (r.skipped) $('#videoStatus').textContent += ' · ' + tn(r.skipped, '{n} link skipped', '{n} links skipped');
    } catch (err) { $('#videoStatus').textContent = t('Error: {e}', { e: err.message }); }
  };
  $('#videoClear').onclick = () => { clearLocalVideos(); videoStatus(); };
  const csvStatus = () => {
    const n = csvVideos().length;
    $('#csvStatus').textContent = n ? tn(n, '{n} video on the home page', '{n} videos on the home page') : t('No links imported.');
    $('#csvClear').disabled = !n;
  };
  csvStatus();
  $('#csvImp').onchange = async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const r = importCsvVideos(await f.text());
      csvStatus();
      if (r.skipped) $('#csvStatus').textContent += ' · ' + tn(r.skipped, '{n} link skipped', '{n} links skipped');
    } catch (err) { $('#csvStatus').textContent = t('Error: {e}', { e: err.message }); }
  };
  $('#csvClear').onclick = () => { clearCsvVideos(); csvStatus(); };
  navigator.storage?.persisted?.().then(p => {
    $('#persist') && ($('#persist').textContent = p ? '✓ ' + t('Persistent storage enabled') : t('The browser could delete the data if space runs low: install the app to protect it and export backups from time to time.'));
  });
  $('#exp').onclick = () => {
    const blob = new Blob([store.exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `woodpecker-${t('backup')}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('#imp').onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    if (!confirm(t('This will replace all data on this device with the backup. Continue?'))) return;
    try { store.importData(await f.text()); alert(t('Backup imported')); go('#/'); }
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
      ? '✓ ' + t('Full collection saved on this device')
      : t('Themes saved on this device: {n} of {m}', { n: st.saved, m: st.total });
    $('#collDownload').hidden = st.saved === st.total;
    $('#collClear').disabled = !st.saved;
  };
  $('#collDownload').onclick = async () => {
    const btn = $('#collDownload');
    btn.disabled = true;
    ctrl = new AbortController();
    try {
      await downloadCollection((n, m) => { if ($('#collStatus')) $('#collStatus').textContent = t('Downloading… {n}/{m}', { n, m }); }, ctrl.signal);
    } catch (err) {
      if ($('#collStatus')) { await show(); $('#collStatus').textContent += ' · ' + t('Error: {e}', { e: err.message }); }
    }
    btn.disabled = false;
    show();
  };
  $('#collClear').onclick = async () => {
    if (!confirm(t('Delete the saved collection? Each theme will be downloaded again when you use it.'))) return;
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
// Data arrived from another device: refresh the read-only views
function onRemoteChange() {
  if (['home', 'set'].includes(currentView())) route();
}
loadWoodpecker().catch(() => {});
