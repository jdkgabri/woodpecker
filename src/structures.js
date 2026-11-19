// Pawn structures: the owner's private PGN library, read like a lichess study. Each file is a book
// chapter whose games explain the theory with examples: you step through them freely, with their
// comments and variations. Only the exercises file is solved (its answers are in the solutions file).
// The files come from the "library" Cloud Function, which only serves them to the accounts with private access (access.js).
import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { t, tn, san } from './i18n.js';
import * as sync from './sync.js';
import { sound } from './sound.js';
import { splitGames, buildTree } from './pgn-tree.js';

import { hasPrivateAccess } from './access.js';
const SHELF = 'structures';
const SEEN_KEY = 'wp:structures-seen:v1';     // { "<file>/<game>": true } games read to the end
const SOLVED_KEY = 'wp:structures-solved:v1'; // { "<n>": { ok: true, clean } } exercises solved
const BRUSH = { G: 'green', R: 'red', Y: 'yellow', B: 'blue' };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toColor = c => (c === 'w' ? 'white' : 'black');
const placement = fen => fen.split(' ')[0];
const readJson = k => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } };
const writeJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const isExercises = f => /exercise/i.test(f.name);
const isSolutions = f => /solution/i.test(f.name);

// ---------- data ----------
const files = new Map();
async function loadFile(id) {
  if (files.has(id)) return files.get(id);
  const f = await sync.libraryGet(SHELF, id);
  const games = [], intro = [];
  for (const text of splitGames(f.pgn)) {
    let g;
    try { g = buildTree(text); } catch { continue; }
    const h = g.headers;
    const useful = v => v && v !== '?';
    const players = useful(h.White) && useful(h.Black) ? `${h.White} – ${h.Black}` : '';
    const year = (h.Date || '').slice(0, 4);
    const title = h.ChapterName || (players ? players + (/^\d{4}$/.test(year) ? `, ${year}` : '') : '') || h.Event || '';
    if (!g.root.k?.length && !h.FEN) { if (g.root.c) intro.push({ title: h.ChapterName || h.Event || '', text: g.root.c }); continue; }
    // fen before each move and parent links
    const walk = (node, fen) => { for (const k of node.k || []) { k.parent = node; k.fen = fen; const c = new Chess(fen); c.move(k.s); k.after = c.fen(); walk(k, k.after); } };
    g.root.after = g.fen;
    walk(g.root, g.fen);
    games.push({ title, headers: h, fen: g.fen, root: g.root, event: [h.Event, h.Site].filter(useful).filter((v, i, a) => a.indexOf(v) === i).join(', '), result: useful(h.Result) && h.Result !== '*' ? h.Result : '' });
  }
  const data = { ...f, games, intro };
  files.set(id, data);
  return data;
}
async function ownerOnly(main) {
  const uid = await sync.currentUid().catch(() => null);
  if (hasPrivateAccess(uid)) return true;
  main.innerHTML = `<p class="muted">${t('This section is private: sign in with its owner\'s account.')}</p>`;
  return false;
}
const page = (app, back, title, right = '') => {
  app.innerHTML = `<header class="top"><a class="icon-btn" href="${back}">‹</a><h1 class="ellipsis">${esc(title)}</h1><span class="small muted">${right}</span></header><main class="wrap" id="stMain"><p class="muted">${t('Loading…')}</p></main>`;
  return app.querySelector('#stMain');
};
const fail = (main, e) => { main.innerHTML = `<p class="bad-text">${esc(e?.message || String(e))}</p>`; };
const moveNo = (fen, s) => { const [, turn, , , , no] = fen.split(' '); return turn === 'w' ? `${no}.${san(s)}` : `${no}...${san(s)}`; };

// ---------- list of chapters ----------
export async function viewStructures(app) {
  const main = page(app, '#/', t('Pawn structures'));
  if (!(await ownerOnly(main))) return;
  try {
    const list = await sync.libraryList(SHELF);
    const seen = readJson(SEEN_KEY);
    const chapters = list.filter(f => !isExercises(f) && !isSolutions(f));
    const ex = list.find(isExercises);
    const solved = Object.keys(readJson(SOLVED_KEY)).length;
    main.innerHTML = `
      <p class="small muted">${t('The theory of each pawn structure explained with model games: go through them move by move with their comments and variations, as in a study.')}</p>
      ${chapters.map(f => {
        const read = Object.keys(seen).filter(k => k.startsWith(f.id + '/')).length;
        return `<a class="card set-card" href="#/structures/${f.id}">
          <div class="row"><strong>${f.n < 999 ? f.n + '. ' : ''}${esc(f.name)}</strong>${read ? `<span class="small muted">✓ ${read}</span>` : ''}</div></a>`;
      }).join('')}
      ${ex ? `<a class="card set-card" href="#/structures/exercises">
        <div class="row"><strong>🎯 ${esc(ex.name)}</strong><span class="small muted">${solved ? t('{n} solved', { n: solved }) : ''}</span></div>
        <p class="small muted">${t('Positions to solve: find the moves, then read the solution.')}</p></a>` : ''}`;
  } catch (e) { fail(main, e); }
}

// ---------- one chapter: introduction and its games ----------
export async function viewStructureChapter(app, id) {
  if (id === 'exercises') return viewExerciseList(app);
  const main = page(app, '#/structures', t('Pawn structures'));
  if (!(await ownerOnly(main))) return;
  try {
    const f = await loadFile(id);
    const seen = readJson(SEEN_KEY);
    app.querySelector('h1').textContent = `${f.n < 999 ? f.n + '. ' : ''}${f.name}`;
    main.innerHTML = `
      ${f.intro.map(x => `<section class="card st-intro">${x.title ? `<h2 class="section-title">${esc(x.title)}</h2>` : ''}${paragraphs(x.text)}</section>`).join('')}
      <h2 class="section-title">${tn(f.games.length, '{n} game', '{n} games')}</h2>
      ${f.games.map((g, i) => `<a class="card set-card" href="#/structure/${id}/${i}">
        <div class="row"><strong>${i + 1}. ${esc(g.title)}</strong>${seen[`${id}/${i}`] ? '<span class="small muted">✓</span>' : ''}</div>
        ${g.event ? `<p class="small muted">${esc(g.event)}${g.result ? ' · ' + esc(g.result) : ''}</p>` : ''}</a>`).join('')}`;
  } catch (e) { fail(main, e); }
}
const paragraphs = text => text.split(/\n+/).map(p => `<p>${esc(p)}</p>`).join('');

// ---------- study reader ----------
// Board, and the game as text: main line with the comments between the moves and the variations below them.
export function viewStructureGame(app, id, gi, opts = {}) {
  let cg = null, gone = false;
  const onKey = e => keys?.(e);
  const onResize = () => cg?.redrawAll();
  let keys = null;
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);
  const back = opts.back || `#/structures/${id}`;
  app.innerHTML = `<header class="top"><a class="icon-btn" href="${back}">‹</a><h1 class="ellipsis" id="stTitle">${t('Pawn structures')}</h1><span class="small muted" id="stCount"></span></header><main id="stMain"><p class="muted wrap">${t('Loading…')}</p></main>`;
  const main = app.querySelector('#stMain');
  (async () => {
    if (!(await ownerOnly(main)) || gone) return;
    let f;
    try { f = await loadFile(id); } catch (e) { return fail(main, e); }
    const i = +gi;
    const game = f.games[i];
    if (!game || gone) return fail(main, t('Not found'));
    app.querySelector('#stTitle').textContent = opts.title || game.title;
    app.querySelector('#stCount').textContent = opts.title ? '' : `${i + 1}/${f.games.length}`;
    const firstTurn = game.fen.split(' ')[1];
    let orientation = opts.orientation || (game.headers.FEN ? firstTurn : 'w');
    main.innerHTML = `
      <div class="train">
        <div class="board-wrap"><div class="board" id="board"></div></div>
        <div class="info"><div class="st-moves" id="stMoves"></div></div>
        <div class="actions">
          <button class="btn ghost" id="stFirst" aria-label="${t('First move')}">⏮</button>
          <button class="btn ghost" id="stPrev" aria-label="${t('Previous')}">◀</button>
          <button class="btn ghost" id="stNext" aria-label="${t('Next')}">▶</button>
          <button class="btn ghost" id="stLast" aria-label="${t('Last move')}">⏭</button>
          <button class="btn ghost" id="stFlip" aria-label="${t('Flip board')}">⇅</button>
        </div>
        <div class="wrap">
          ${game.event ? `<p class="small muted">${esc(game.event)}${game.headers.Annotator ? ' · ' + esc(game.headers.Annotator) : ''}</p>` : ''}
          ${opts.nav ?? `<div class="grid2">
            ${i > 0 ? `<a class="btn ghost" href="#/structure/${id}/${i - 1}">‹ ${t('Previous game')}</a>` : '<span></span>'}
            ${i + 1 < f.games.length ? `<a class="btn ghost" href="#/structure/${id}/${i + 1}">${t('Next game')} ›</a>` : '<span></span>'}
          </div>`}
        </div>
      </div>`;
    const $ = s => main.querySelector(s);
    cg = Chessground($('#board'), {
      orientation: toColor(orientation), animation: { enabled: true, duration: 200 }, highlight: { lastMove: true, check: true },
      movable: { free: false, showDests: true, events: { after: (o, d) => { const k = (cur.k || []).find(x => x.u.slice(0, 4) === o + d); if (k) go(k, true); else draw(); } } },
      draggable: { showGhost: true },
    });
    let cur = game.root;
    const ids = new Map();
    // the text of the game, built once; the current move is highlighted on each step
    (function render() {
      let n = 0;
      const comment = c => (c ? `<span class="st-c">${esc(c)}</span> ` : '');
      const move = (k, withNo) => {
        ids.set(++n, k);
        const black = k.fen.split(' ')[1] === 'b';
        return `<button class="mv" data-n="${n}">${esc((withNo || !black ? moveNo(k.fen, k.s) : san(k.s)) + (k.n || ''))}</button> ${comment(k.c)}`;
      };
      // a line from node k: each move, its comment, then the alternatives to that move (below it in the
      // main line, in brackets inside variations)
      const line = (k, depth, withNo = true) => {
        let out = '';
        for (; k; k = k.k?.[0]) {
          out += move(k, withNo);
          withNo = !!k.c;
          const alts = k.parent.k[0] === k ? k.parent.k.slice(1) : [];
          if (alts.length) {
            out += alts.map(a => depth === 0 ? `<div class="st-var">${line(a, 1)}</div>` : `<span class="st-var-in">(${line(a, depth + 1).trim()})</span> `).join('');
            withNo = true;
          }
        }
        return out;
      };
      const root = game.root;
      let html = root.c ? `<p class="st-c st-root">${esc(root.c)}</p>` : '';
      if (root.k?.length) html += line(root.k[0], 0);
      if (game.result) html += `<span class="st-result">${esc(game.result)}</span>`;
      $('#stMoves').innerHTML = html;
    })();
    $('#stMoves').onclick = e => { const b = e.target.closest('[data-n]'); if (b) { cur = ids.get(+b.dataset.n); draw(); } };
    function draw() {
      const fen = cur.after;
      const c = new Chess(fen);
      const d = new Map();
      for (const k of cur.k || []) { const fr = k.u.slice(0, 2); if (!d.has(fr)) d.set(fr, []); d.get(fr).push(k.u.slice(2, 4)); }
      cg.set({
        fen, turnColor: toColor(c.turn()), check: c.inCheck() ? toColor(c.turn()) : false,
        lastMove: cur.parent ? [cur.u.slice(0, 2), cur.u.slice(2, 4)] : undefined,
        movable: { color: d.size ? toColor(c.turn()) : undefined, dests: d },
      });
      const shapes = [];
      for (const a of cur.a || []) if (a.length >= 5) shapes.push({ orig: a.slice(1, 3), dest: a.slice(3, 5), brush: BRUSH[a[0]] || 'green' });
      for (const q of cur.q || []) if (q.length >= 3) shapes.push({ orig: q.slice(1, 3), brush: BRUSH[q[0]] || 'green' });
      cg.setAutoShapes(shapes);
      $('#stMoves').querySelectorAll('.mv.on').forEach(b => b.classList.remove('on'));
      for (const [n, k] of ids) if (k === cur) $('#stMoves').querySelector(`[data-n="${n}"]`)?.classList.add('on');
      $('#stMoves .mv.on')?.scrollIntoView({ block: 'nearest' });
      // the end of the main line marks the game as read
      if (!cur.k?.length && !opts.title && isMain(cur)) { const s = readJson(SEEN_KEY); if (!s[`${id}/${i}`]) { s[`${id}/${i}`] = true; writeJson(SEEN_KEY, s); } }
    }
    const isMain = k => { for (let n = k; n.parent; n = n.parent) if (n.parent.k[0] !== n) return false; return true; };
    function go(k, quiet) {
      const m = new Chess(k.fen).move(k.s);
      if (!quiet || m) sound(m.captured ? 'capture' : 'move');
      cur = k; draw();
    }
    $('#stFirst').onclick = () => { cur = game.root; draw(); };
    $('#stPrev').onclick = () => { if (cur.parent) { cur = cur.parent; draw(); } };
    $('#stNext').onclick = () => { if (cur.k?.length) go(cur.k[0]); };
    $('#stLast').onclick = () => { while (cur.k?.length) cur = cur.k[0]; draw(); };
    $('#stFlip').onclick = () => { orientation = orientation === 'w' ? 'b' : 'w'; cg.set({ orientation: toColor(orientation) }); };
    keys = e => {
      if (e.target.closest?.('input,textarea')) return;
      if (e.key === 'ArrowRight') $('#stNext').click();
      else if (e.key === 'ArrowLeft') $('#stPrev').click();
      else if (e.key === 'ArrowUp') $('#stFirst').click();
      else if (e.key === 'ArrowDown') $('#stLast').click();
    };
    if (opts.ply) { for (let p = 0; p < opts.ply && cur.k?.length; p++) cur = cur.k[0]; }
    draw();
  })();
  return () => { gone = true; cg?.destroy(); document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
}

// ---------- exercises ----------
// Exercise n: the position of the exercises file and the matching game of the solutions file
// (same position, otherwise the same number).
async function loadExercises() {
  const list = await sync.libraryList(SHELF);
  const exF = list.find(isExercises), solF = list.find(isSolutions);
  if (!exF) throw new Error(t('Not found'));
  const ex = await loadFile(exF.id);
  const sol = solF ? await loadFile(solF.id) : { games: [] };
  const items = ex.games.map((g, i) => {
    let si = sol.games.findIndex(s => placement(s.fen) === placement(g.fen));
    if (si < 0 && sol.games[i]) si = i;
    return { n: i + 1, title: g.title, fen: g.fen, solution: si >= 0 ? sol.games[si] : null, solIndex: si };
  });
  return { exF, solF, items };
}

async function viewExerciseList(app) {
  const main = page(app, '#/structures', t('Exercises'));
  if (!(await ownerOnly(main))) return;
  try {
    const { exF, items } = await loadExercises();
    app.querySelector('h1').textContent = exF.name;
    const solved = readJson(SOLVED_KEY);
    main.innerHTML = `
      <p class="small muted">${t('Find the best continuation in each position. When you finish, or if you give up, you can read the commented solution.')}</p>
      <p class="small">${t('{n} of {m} solved', { n: items.filter(x => solved[x.n]?.ok).length, m: items.length })}</p>
      <div class="st-grid">${items.map(x => `<a class="chip ${solved[x.n]?.ok ? 'ok' : ''}" href="#/structure-ex/${x.n}" title="${esc(x.title)}">${x.n}</a>`).join('')}</div>`;
  } catch (e) { fail(main, e); }
}

export function viewStructureExercise(app, n) {
  let cg = null, gone = false, timer = null;
  const onResize = () => cg?.redrawAll();
  window.addEventListener('resize', onResize);
  const main = page(app, '#/structures/exercises', t('Exercise {n}', { n }));
  main.className = '';
  (async () => {
    if (!(await ownerOnly(main)) || gone) return;
    let data;
    try { data = await loadExercises(); } catch (e) { return fail(main, e); }
    const items = data.items;
    const x = items.find(e => e.n === +n);
    if (!x || gone) return fail(main, t('Not found'));
    app.querySelector('h1').textContent = x.title || t('Exercise {n}', { n });
    const hero = x.fen.split(' ')[1];
    // the moves to find: the solution's main line from the exercise position
    const line = [];
    if (x.solution) for (let k = x.solution.root.k?.[0]; k; k = k.k?.[0]) line.push(k);
    main.innerHTML = `
      <div class="train">
        <div class="row coach-head"><span class="badge calm">${hero === 'w' ? t('White to move') : t('Black to move')}</span><span class="small muted">${n}/${items.length}</span></div>
        <div class="board-wrap"><div class="board" id="board"></div></div>
        <div class="info"><div class="pfb" id="exNote"></div></div>
        <div class="actions" id="exActions"></div>
        <div class="wrap"><div class="grid2">
          ${+n > 1 ? `<a class="btn ghost" href="#/structure-ex/${+n - 1}">‹ ${t('Previous')}</a>` : '<span></span>'}
          ${+n < items.length ? `<a class="btn ghost" href="#/structure-ex/${+n + 1}">${t('Next')} ›</a>` : '<span></span>'}
        </div></div>
      </div>`;
    const $ = s => main.querySelector(s);
    const chess = new Chess(x.fen);
    let step = 0, mistakes = 0, done = false;
    const solutionLink = x.solution && data.solF ? `<a class="btn ${done ? 'primary' : 'ghost'}" href="#/structure-sol/${n}">📖 ${t('Solution')}</a>` : '';
    const note = (html, state = 'play') => { $('#exNote').className = 'pfb ' + state; $('#exNote').innerHTML = `<div class="pfb-text">${html}</div>`; };
    const dests = () => { const m = new Map(); for (const mv of chess.moves({ verbose: true })) { if (!m.has(mv.from)) m.set(mv.from, []); m.get(mv.from).push(mv.to); } return m; };
    cg = Chessground($('#board'), {
      orientation: toColor(hero), animation: { enabled: true, duration: 200 }, highlight: { lastMove: true, check: true },
      movable: { free: false, showDests: true, events: { after: onMove } }, draggable: { showGhost: true },
    });
    const draw = last => cg.set({
      fen: chess.fen(), turnColor: toColor(chess.turn()), lastMove: last, check: chess.inCheck() ? toColor(chess.turn()) : false,
      movable: { color: !done && chess.turn() === hero ? toColor(hero) : undefined, dests: dests() },
    });
    const actions = () => {
      $('#exActions').innerHTML = `${!done && line.length ? `<button class="btn ghost" id="exHint">💡 ${t('Hint')}</button>` : ''}${solutionLink.replace('btn ghost', done ? 'btn primary' : 'btn ghost')}`;
      $('#exHint') && ($('#exHint').onclick = () => { const k = line[step]; if (k) cg.setAutoShapes([{ orig: k.u.slice(0, 2), brush: 'green' }]); mistakes++; });
    };
    if (!line.length) note(`<strong>${t('Find the best continuation.')}</strong><em>${t('This exercise has no solution to check your moves against.')}</em>`);
    else note(`<strong>${t('Find the best continuation.')}</strong>`);
    actions();
    draw();

    function onMove(orig, dest) {
      if (done || !line.length) { draw(); return; }
      const want = line[step];
      const piece = chess.get(orig);
      const promo = piece?.type === 'p' && (dest[1] === '8' || dest[1] === '1') ? (want.u[4] || 'q') : undefined;
      if (orig + dest + (promo || '') !== want.u) {
        mistakes++;
        draw();
        note(`<strong>${t('That is not the move of the solution.')}</strong><em>${t('Try again.')}</em>`, 'bad');
        return;
      }
      const m = chess.move({ from: orig, to: dest, promotion: promo });
      sound(m.captured ? 'capture' : 'move');
      cg.setAutoShapes([]);
      step++;
      draw([m.from, m.to]);
      if (finish()) return;
      note(`<strong>${t('Correct!')}</strong>${want.c ? '' : ''}`, 'ok');
      // the reply of the solution
      timer = setTimeout(() => {
        if (gone) return;
        const r = line[step];
        const rm = chess.move(r.s);
        sound(rm.captured ? 'capture' : 'move');
        step++;
        draw([rm.from, rm.to]);
        if (finish()) return;
        note(`<strong>${t('Your move')}</strong>`);
      }, 500);
    }
    function finish() {
      // solved when the main line ends, or when only the opponent's reply is left
      if (step < line.length && !(step === line.length - 1 && chess.turn() !== hero)) return false;
      done = true;
      const all = readJson(SOLVED_KEY);
      all[n] = { ok: true, clean: (all[n]?.clean ?? true) && mistakes === 0, at: Date.now() };
      writeJson(SOLVED_KEY, all);
      draw();
      note(`<strong>${t('Solved!')}</strong><em>${mistakes ? tn(mistakes, '{n} mistake', '{n} mistakes') : t('No mistakes.')}</em>`, 'ok');
      actions();
      return true;
    }
  })();
  return () => { gone = true; clearTimeout(timer); cg?.destroy(); window.removeEventListener('resize', onResize); };
}

// The commented solution of exercise n, in the study reader
export function viewStructureSolution(app, n) {
  let cleanup = () => {}, gone = false;
  app.innerHTML = `<main class="wrap"><p class="muted">${t('Loading…')}</p></main>`;
  loadExercises().then(({ solF, items }) => {
    if (gone) return;
    const x = items.find(e => e.n === +n);
    if (!x?.solution || !solF) { location.hash = `#/structure-ex/${n}`; return; }
    cleanup = viewStructureGame(app, solF.id, x.solIndex, {
      back: `#/structure-ex/${n}`, title: `${t('Solution')} · ${x.title || t('Exercise {n}', { n })}`,
      orientation: x.fen.split(' ')[1],
      nav: `<div class="grid2"><a class="btn ghost" href="#/structure-ex/${n}">↺ ${t('Back to the exercise')}</a>${+n < items.length ? `<a class="btn ghost" href="#/structure-ex/${+n + 1}">${t('Next exercise')} ›</a>` : '<span></span>'}</div>`,
    });
  }).catch(e => { app.innerHTML = `<main class="wrap"><p class="bad-text">${esc(e.message)}</p></main>`; });
  return () => { gone = true; cleanup(); };
}
