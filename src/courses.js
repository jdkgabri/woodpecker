// Opening courses: chapters with a video, the teacher's annotated study, line drills and exercises.
// Every position where you have to move is a card with spaced repetition (kept on this device):
// missed positions come back sooner, known ones later. Data: public/courses/<id>.json (scripts/build-course.mjs).
import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { t, tn, san } from './i18n.js';
import { sound } from './sound.js';
import * as store from './store.js';
import { celebrate } from './ui-habit.js';
import { videoPlayer } from './openings.js';
import { COURSE_VIDEOS } from './course-videos.js';
import * as sync from './sync.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toColor = c => (c === 'w' ? 'white' : 'black');
const fenKey = f => f.split(' ').slice(0, 4).join(' ');
const KINDS = ['study', 'train', 'extra', 'important', 'tricks'];
const EXERCISES = ['important', 'tricks'];

// ---------- data ----------
const cache = new Map();
const base = () => import.meta.env.BASE_URL + 'courses/';
async function loadIndex() {
  const r = await fetch(base() + 'index.json');
  if (!r.ok) throw new Error(t('Could not load the courses'));
  return r.json();
}
export async function loadCourse(id) {
  if (cache.has(id)) return cache.get(id);
  const r = await fetch(base() + id + '.json');
  if (!r.ok) throw new Error(t('Could not load the courses'));
  const course = prepare(await r.json());
  cache.set(id, course);
  return course;
}

// Links each node to its parent and the position before it, and collects the cards:
// line cards (a position of the course side with the moves the teacher plays there, merged across
// games and chapters) and exercise cards (one per important move or trick)
function prepare(course) {
  course.cards = new Map();
  for (const ch of course.chapters) {
    ch.cards = new Set();
    for (const kind of KINDS) (ch[kind] || []).forEach((g, gi) => {
      g.kind = kind; g.ch = ch; g.gi = gi;
      const walk = (node, fen) => {
        for (const k of node.k || []) {
          k.parent = node; k.fen = fen;
          const c = new Chess(fen);
          c.move(k.s);
          walk(k, c.fen());
        }
      };
      g.root.fen = g.fen;
      walk(g.root, g.fen);
      if (EXERCISES.includes(kind)) {
        const key = `x:${ch.id}:${kind}:${gi}`;
        course.cards.set(key, { key, kind, game: g, chapters: new Set([ch.id]) });
        ch.cards.add(key);
        return;
      }
      const visit = node => {
        const kids = node.k || [];
        const fen = fenAfter(node);
        if (kids.length && new Chess(fen).turn() === course.side) {
          const key = 'l:' + fenKey(fen);
          const card = course.cards.get(key) || { key, kind: 'line', fen, moves: new Set(), refs: [], chapters: new Set() };
          kids.forEach(k => card.moves.add(k.u));
          // the teacher marks the move that leads to an important move (_J) or a trick (_T)
          if (node.t) card.mark = 'tricks'; else if (node.j && !card.mark) card.mark = 'important';
          card.refs.push({ game: g, node });
          card.chapters.add(ch.id);
          course.cards.set(key, card);
          ch.cards.add(key);
        }
        kids.forEach(visit);
      };
      visit(g.root);
    });
  }
  // marked positions that are also an exercise: answering one counts for the other too
  const exAt = new Map();
  for (const c of course.cards.values()) if (EXERCISES.includes(c.kind) && !exAt.has(fenKey(c.game.fen))) exAt.set(fenKey(c.game.fen), c.key);
  for (const c of course.cards.values()) if (c.mark) c.ex = exAt.get(fenKey(c.fen));
  return course;
}
const afterFen = node => { const c = new Chess(node.fen); c.move(node.s); return c.fen(); };
const fenAfter = node => (node.parent ? afterFen(node) : node.fen);

// Path of nodes from the root to a node (root excluded)
function pathTo(node) {
  const p = [];
  for (let n = node; n?.parent; n = n.parent) p.unshift(n);
  return p;
}
// Follows the main line (first child) from a node to the end
function mainFrom(node) {
  const p = [];
  for (let n = node; n?.k?.length; n = n.k[0]) p.push(n.k[0]);
  return p;
}
// Every complete line of a game: arrays of nodes from the root to a leaf
function leavesOf(game) {
  const out = [];
  const walk = (n, p) => { if (!n.k?.length) { if (p.length) out.push(p); return; } for (const k of n.k) walk(k, [...p, k]); };
  walk(game.root, []);
  return out;
}

// ---------- memory (spaced repetition, this device) ----------
// { courseId: { cards: { key: { b: box, d: due ms, f: fails, w: last answer wrong, s: last seen ms } }, xp } }
const MEM_KEY = 'wp:course:v1';
const DAY = 864e5;
const GAPS = [0, 1, 3, 7, 16, 35];   // days until the next review, by box
const MASTERED = 3;
const memAll = () => { try { return JSON.parse(localStorage.getItem(MEM_KEY) || '{}'); } catch { return {}; } };
const memOf = id => memAll()[id] || { cards: {}, xp: 0 };
function saveMem(id, m) {
  const all = memAll();
  all[id] = m;
  try { localStorage.setItem(MEM_KEY, JSON.stringify(all)); } catch {}
}
function grade(id, key, ok) {
  const m = memOf(id);
  const c = m.cards[key] || { b: 0, f: 0 };
  c.b = ok ? Math.min(GAPS.length - 1, c.b + 1) : 0;
  if (!ok) c.f = (c.f || 0) + 1;
  c.w = ok ? 0 : 1;   // in "my mistakes" until answered right
  c.s = Date.now();
  c.d = Date.now() + GAPS[c.b] * DAY;
  m.cards[key] = c;
  saveMem(id, m);
}
const addXp = (id, n) => { const m = memOf(id); m.xp = (m.xp || 0) + n; saveMem(id, m); };

// Counts for a set of card keys
function progressOf(id, keys) {
  const cards = memOf(id).cards, now = Date.now();
  let seen = 0, mastered = 0, due = 0, weak = 0;
  for (const k of keys) {
    const c = cards[k];
    if (!c) continue;
    seen++;
    if (c.b >= MASTERED) mastered++;
    if (c.d <= now) due++;
    if (c.w) weak++;
  }
  return { total: keys.size ?? keys.length, seen, mastered, due, weak };
}
// How much a card needs practice: failed and due ones most, new ones next, known ones little
function needOf(c, marked) {
  const boost = marked ? 2 : 1;   // important moves and tricks come up more often
  if (!c) return 2 * boost;
  const due = c.d <= Date.now();
  return boost * (c.f && c.b < MASTERED ? 3 : 1) * (due ? 2 : 0.25) / 2 ** c.b;
}
function weighted(list, w, n) {
  const pool = list.map((x, i) => ({ x, w: Math.max(1e-6, w[i]) })), out = [];
  while (pool.length && out.length < n) {
    let r = Math.random() * pool.reduce((a, b) => a + b.w, 0), i = 0;
    for (; i < pool.length - 1; i++) { r -= pool[i].w; if (r <= 0) break; }
    out.push(pool.splice(i, 1)[0].x);
  }
  return out;
}

// ---------- shared bits ----------
const BRUSH = { G: 'green', R: 'red', Y: 'yellow', B: 'blue' };
function shapesOf(node) {
  const s = [];
  for (const a of node?.a || []) if (a.length >= 5) s.push({ orig: a.slice(1, 3), dest: a.slice(3, 5), brush: BRUSH[a[0]] || 'green' });
  for (const q of node?.q || []) if (q.length >= 3) s.push({ orig: q.slice(1, 3), brush: BRUSH[q[0]] || 'green' });
  return s;
}
function moveNo(fen, s) {
  const [, turn, , , , full] = fen.split(' ');
  return turn === 'w' ? `${full}.${san(s)}` : `${full}...${san(s)}`;
}
const label = n => moveNo(n.fen, n.s) + (n.n || '');
function dests(chess) {
  const d = new Map();
  for (const m of chess.moves({ verbose: true })) { if (!d.has(m.from)) d.set(m.from, []); d.get(m.from).push(m.to); }
  return d;
}
// A chapter's video: a link, or "storage:<path>" for a private file in Firebase Storage (only for the
// accounts the Storage rules allow, so it is shown only once the address comes back)
const videoOf = (course, ch) => COURSE_VIDEOS[`${course.id}/${ch.id}`] || ch.video || '';
const hasVideo = v => !!v && (!v.startsWith('storage:') || !!sync.state.user);
const kindName = k => ({ study: t('Study|noun'), train: t('Training lines'), extra: t('Extended lines'), important: t('Important moves'), tricks: t('Tricks') }[k]);
const header = (back, title, right = '') => `<header class="top"><a class="icon-btn" href="${back}">‹</a><h1 class="ellipsis">${esc(title)}</h1><span class="small muted">${right}</span></header>`;
const progressBar = p => `<div class="bar"><i style="width:${p.total ? Math.round(100 * p.mastered / p.total) : 0}%"></i></div>`;
async function guard(app, fn) {
  try { return await fn(); }
  catch (e) { app.innerHTML = `${header('#/courses', t('Opening courses'))}<main class="wrap"><p class="bad-text">${esc(e.message)}</p></main>`; }
}

// ---------- list ----------
export async function viewCourses(app) {
  await guard(app, async () => {
    const list = await loadIndex();
    const cards = await Promise.all(list.map(async c => {
      const course = await loadCourse(c.id);
      const p = progressOf(c.id, new Set(course.cards.keys()));
      return `<a class="card set-card" href="#/course/${c.id}">
        <div class="row"><strong>${esc(c.name)}</strong><span class="muted small">${c.side === 'w' ? t('With White') : t('With Black')}</span></div>
        <p class="small muted">${esc(c.author)} · ${tn(c.chapters, '{n} chapter', '{n} chapters')}</p>
        ${progressBar(p)}
        <div class="row small muted"><span>${t('{n} of {m} positions mastered', { n: p.mastered, m: p.total })}</span>${p.due ? `<span>🔁 ${tn(p.due, '{n} to review', '{n} to review')}</span>` : ''}</div>
      </a>`;
    }));
    app.innerHTML = `${header('#/openings', t('Opening courses'))}
      <main class="wrap">
        <p class="small muted">${t('Complete courses by their authors: a video and an annotated study per chapter, and practice that brings back the positions you miss.')}</p>
        ${cards.join('')}
      </main>`;
  });
}

// ---------- course ----------
export async function viewCourse(app, id) {
  await guard(app, async () => {
    const course = await loadCourse(id);
    const all = new Set(course.cards.keys());
    const p = progressOf(id, all);
    const xKeys = kind => new Set([...course.cards.values()].filter(c => c.kind === kind).map(c => c.key));
    const xp = memOf(id).xp || 0;
    app.innerHTML = `${header('#/courses', course.name, xp ? `⭐ ${xp}` : '')}
      <main class="wrap">
        <section class="card">
          <p class="small muted">${esc(course.author)} · ${course.side === 'w' ? t('You play White') : t('You play Black')}</p>
          ${progressBar(p)}
          <p class="small">${t('{n} of {m} positions mastered', { n: p.mastered, m: p.total })} · ${t('{n} seen', { n: p.seen })}</p>
          <a class="btn primary full" href="#/cdrill/${id}/all/due">🔁 ${p.due ? t('Daily review ({n})', { n: p.due }) : p.seen ? t('Daily review') : t('Start learning')}</a>
          <div class="grid2">
            <a class="btn ghost" href="#/cdrill/${id}/all/random">🎯 ${t('Random positions')}</a>
            <a class="btn ghost" href="#/cdrill/${id}/all/line">♟ ${t('Whole lines')}</a>
            <a class="btn ghost" href="#/cdrill/${id}/all/important">❗ ${t('Important moves')} <small class="muted">${xKeys('important').size}</small></a>
            <a class="btn ghost" href="#/cdrill/${id}/all/tricks">🪤 ${t('Tricks')} <small class="muted">${xKeys('tricks').size}</small></a>
          </div>
          ${p.weak ? `<a class="btn ghost full" href="#/cdrill/${id}/all/mistakes">✗ ${t('My mistakes ({n})', { n: p.weak })}</a>` : ''}
          <p class="small muted">${t('Course practice mixes every chapter.')}</p>
        </section>
        <h2 class="section-title">${t('Chapters')}</h2>
        ${course.chapters.map(ch => {
          const cp = progressOf(id, ch.cards);
          return `<a class="card set-card" href="#/course/${id}/${ch.id}">
            <div class="row"><strong>${ch.id}. ${esc(ch.name)}</strong>${hasVideo(videoOf(course, ch)) ? '<span>🎬</span>' : ''}</div>
            <p class="small muted">${KINDS.filter(k => ch[k]?.length).map(k => `${kindName(k)} ${ch[k].length}`).join(' · ')}</p>
            ${cp.total ? progressBar(cp) + `<div class="row small muted"><span>${t('{n} of {m} positions mastered', { n: cp.mastered, m: cp.total })}</span>${cp.due ? `<span>🔁 ${cp.due}</span>` : ''}</div>` : ''}
          </a>`;
        }).join('')}
      </main>`;
  });
}

// ---------- chapter ----------
export async function viewChapter(app, id, chId) {
  await guard(app, async () => {
    const course = await loadCourse(id);
    const ch = course.chapters.find(c => c.id === chId);
    if (!ch) { location.hash = '#/course/' + id; return; }
    const p = progressOf(id, ch.cards);
    const video = videoOf(course, ch);
    const lines = ['study', 'train'].some(k => ch[k]?.length);
    const gameList = kind => ch[kind]?.length ? `
      <details class="card" ${kind === 'study' ? 'open' : ''}>
        <summary><strong>${kindName(kind)}</strong> <span class="muted small">${ch[kind].length}</span></summary>
        <div class="course-games">${ch[kind].map((g, i) => `<a class="branch" href="#/cstudy/${id}/${ch.id}/${kind}/${i}">${esc(g.title || `${kindName(kind)} ${i + 1}`)}</a>`).join('')}</div>
      </details>` : '';
    app.innerHTML = `${header('#/course/' + id, `${ch.id}. ${ch.name}`)}
      <main class="wrap">
        ${!video ? '' : video.startsWith('storage:') ? (sync.state.configured ? '<section class="card" id="chVideo"><p class="small muted">🎬 …</p></section>' : '') : `<section class="card">${videoPlayer(video) || ''}</section>`}
        ${p.total ? `<section class="card">
          ${progressBar(p)}
          <p class="small">${t('{n} of {m} positions mastered', { n: p.mastered, m: p.total })}${p.due ? ' · ' + tn(p.due, '{n} to review', '{n} to review') : ''}</p>
          ${lines ? `<div class="grid2">
            <a class="btn primary" href="#/cdrill/${id}/${ch.id}/line">♟ ${t('Move by move')}</a>
            <a class="btn ghost" href="#/cdrill/${id}/${ch.id}/random">🎯 ${t('Random positions')}</a>
          </div>` : ''}
          <div class="grid2">
            ${ch.important?.length ? `<a class="btn ghost" href="#/cdrill/${id}/${ch.id}/important">❗ ${t('Important moves')}</a>` : ''}
            ${ch.tricks?.length ? `<a class="btn ghost" href="#/cdrill/${id}/${ch.id}/tricks">🪤 ${t('Tricks')}</a>` : ''}
          </div>
          ${p.weak ? `<a class="btn ghost full" href="#/cdrill/${id}/${ch.id}/mistakes">✗ ${t('My mistakes ({n})', { n: p.weak })}</a>` : ''}
        </section>` : ''}
        ${KINDS.map(gameList).join('')}
      </main>`;
    if (video.startsWith('storage:') && sync.state.configured) {
      const url = await sync.storageUrl(video.slice(8));
      const box = app.querySelector('#chVideo');
      if (box) { if (url) box.innerHTML = videoPlayer(url); else box.remove(); }
    }
  });
}

// ---------- study viewer ----------
export function viewCourseStudy(app, id, chId, kind, gi) {
  let cleanup = () => {}, gone = false;
  guard(app, async () => {
    const course = await loadCourse(id);
    if (gone) return;
    const ch = course.chapters.find(c => c.id === chId);
    const game = ch?.[kind]?.[+gi];
    if (!game) { location.hash = '#/course/' + id; return; }
    app.innerHTML = `
      <div class="train">
        ${header(`#/course/${id}/${ch.id}`, game.title || kindName(kind), `${+gi + 1}/${ch[kind].length}`)}
        <div class="board-wrap"><div class="board" id="board"></div></div>
        <div class="info">
          <div class="pfb" id="csNote"></div>
          <div class="branches" id="csBranches"></div>
          <div class="movelist course-moves" id="csMoves"></div>
        </div>
        <div class="actions">
          <button class="btn ghost" id="csFirst" aria-label="${t('First move')}">⏮</button>
          <button class="btn ghost" id="csPrev" aria-label="${t('Previous')}">◀</button>
          <button class="btn ghost" id="csNext" aria-label="${t('Next')}">▶</button>
          <a class="btn primary" href="#/cdrill/${id}/${ch.id}/${EXERCISES.includes(kind) ? kind : 'line'}/${kind}.${gi}">♟ ${t('Practise')}</a>
        </div>
      </div>`;
    const $ = s => app.querySelector(s);
    const cg = Chessground($('#board'), {
      orientation: toColor(course.side), animation: { enabled: true, duration: 200 }, highlight: { lastMove: true, check: true },
      movable: { free: false, showDests: true, events: { after: (o, d) => { const k = (cur.k || []).find(x => x.u.slice(0, 4) === o + d); if (k) go(k); else draw(); } } },
      draggable: { showGhost: true },
    });
    let cur = game.root;
    function draw() {
      const fen = fenAfter(cur);
      const c = new Chess(fen);
      const d = new Map();
      for (const k of cur.k || []) { const f = k.u.slice(0, 2); if (!d.has(f)) d.set(f, []); d.get(f).push(k.u.slice(2, 4)); }
      cg.set({
        fen, turnColor: toColor(c.turn()), check: c.inCheck() ? toColor(c.turn()) : false,
        lastMove: cur.parent ? [cur.u.slice(0, 2), cur.u.slice(2, 4)] : undefined,
        movable: { color: (cur.k || []).length ? toColor(c.turn()) : undefined, dests: d },
      });
      cg.setAutoShapes(shapesOf(cur));
      const markCard = (cur.j || cur.t) && cur.k?.length ? course.cards.get('l:' + fenKey(fen)) : null;
      const tag = markCard ? `${cur.t ? `🪤 ${t('Trick')}` : `❗ ${t('Important move')}`}: ${t('think what you would play before going on.')}` : '';
      const exLink = markCard?.ex ? (([, exCh, exKind, exGi]) => `<a class="btn ghost" href="#/cdrill/${id}/${exCh}/${exKind}/${exKind}.${exGi}">${exKind === 'tricks' ? '🪤' : '❗'} ${t('Practise this position')}</a>`)(markCard.ex.split(':')) : '';
      $('#csNote').className = 'pfb';
      $('#csNote').className = 'pfb' + (tag ? ' warn' : '');
      $('#csNote').innerHTML = `<div class="pfb-text"><strong>${cur.parent ? esc(label(cur)) : esc(game.title || kindName(kind))}</strong>${tag ? `<span class="small course-mark">${tag}</span>` : ''}<em class="note-text">${cur.c ? esc(cur.c) : !cur.parent ? esc(t('Play through the moves with ▶ or by moving the pieces.')) : ''}</em>${exLink ? `<div class="course-mark-link">${exLink}</div>` : ''}</div>`;
      const kids = cur.k || [];
      $('#csBranches').innerHTML = kids.length > 1
        ? `<p class="small muted">${c.turn() === course.side ? t('Your move:') : t('If they play…')}</p><div class="chips">${kids.map((k, i) => `<button class="chip" data-k="${i}">${esc(label(k))}</button>`).join('')}</div>`
        : !kids.length ? `<p class="small muted">${t('End of this line.')}</p>` : '';
      $('#csBranches').onclick = e => { const b = e.target.closest('[data-k]'); if (b) go(kids[+b.dataset.k]); };
      drawMoves();
    }
    // The whole game as text, variations in brackets; the current move highlighted
    function drawMoves() {
      const ids = new Map();
      let n = 0;
      const line = nodes => nodes.map((k, i) => {
        ids.set(++n, k);
        const fen = k.fen, black = fen.split(' ')[1] === 'b';
        const txt = i === 0 || !black ? label(k) : san(k.s) + (k.n || '');
        let out = `<button class="mv ${k === cur ? 'on' : ''} ${k.parent.j || k.parent.t ? 'mark' : ''}" data-n="${n}">${esc(txt)}</button>`;
        const alts = (k.parent.k || []).slice(1);
        if (k === k.parent.k[0] && alts.length) out += alts.map(a => ` <span class="var">(${line([a, ...mainFrom(a)])})</span>`).join('');
        return out;
      }).join(' ');
      $('#csMoves').innerHTML = line(game.root.k?.length ? [game.root.k[0], ...mainFrom(game.root.k[0])] : []);
      $('#csMoves').onclick = e => { const b = e.target.closest('[data-n]'); if (b) { cur = ids.get(+b.dataset.n); draw(); } };
      $('#csMoves .on')?.scrollIntoView({ block: 'nearest' });
    }
    function go(k) {
      const c = new Chess(k.fen);
      const m = c.move(k.s);
      sound(m.captured ? 'capture' : 'move');
      cur = k; draw();
    }
    $('#csFirst').onclick = () => { cur = game.root; draw(); };
    $('#csPrev').onclick = () => { if (cur.parent) { cur = cur.parent; draw(); } };
    $('#csNext').onclick = () => { if (cur.k?.length) go(cur.k[0]); };
    const onKey = e => {
      if (e.key === 'ArrowRight') $('#csNext').click();
      else if (e.key === 'ArrowLeft') $('#csPrev').click();
    };
    document.addEventListener('keydown', onKey);
    const onResize = () => cg.redrawAll();
    window.addEventListener('resize', onResize);
    cleanup = () => { document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); cg.destroy(); };
    draw();
  });
  return () => { gone = true; cleanup(); };
}

// ---------- practice ----------
// An item is a line to play from a given point: { path: [node...], start, card? }. The course side
// has to find its moves (any move the teacher gives there is right); the other side replies alone.
const SESSION = { line: 5, random: 12, due: 15, mistakes: 12, important: 10, tricks: 10 };
const MAX_OWN_MOVES = 4;   // in random positions, how many of your moves to play from the position

function buildItems(course, scope, mode, only) {
  const id = course.id;
  const mem = memOf(id).cards;
  const inScope = c => scope === 'all' || c.chapters.has(scope);
  const chapters = course.chapters.filter(ch => scope === 'all' || ch.id === scope);
  // practising a single study or exercise from the viewer
  if (only) {
    const [kind, gi] = only.split('.');
    const g = chapters[0]?.[kind]?.[+gi];
    if (!g) return [];
    if (EXERCISES.includes(kind)) return [{ path: [g.root.k[0], ...mainFrom(g.root.k[0])], start: 0, card: `x:${g.ch.id}:${kind}:${gi}` }];
    return weighted(leavesOf(g), leavesOf(g).map(() => 1), SESSION.line).map(path => ({ path, start: 0 }));
  }
  if (EXERCISES.includes(mode)) {
    const cards = [...course.cards.values()].filter(c => c.kind === mode && inScope(c));
    return weighted(cards, cards.map(c => needOf(mem[c.key])), SESSION[mode])
      .map(c => ({ path: [c.game.root.k[0], ...mainFrom(c.game.root.k[0])], start: 0, card: c.key }));
  }
  if (mode === 'line') {
    const lines = chapters.flatMap(ch => ['study', 'train'].flatMap(k => (ch[k] || []).flatMap(leavesOf)));
    const need = path => Math.max(...path.filter(n => n.parent && new Chess(n.fen).turn() === course.side).map(n => { const k = 'l:' + fenKey(n.fen); return needOf(mem[k], course.cards.get(k)?.mark); }), 0.01);
    return weighted(lines, lines.map(need), SESSION.line).map(path => ({ path, start: 0 }));
  }
  // random positions / daily review / mistakes: line cards, played from the position
  let cards = [...course.cards.values()].filter(c => inScope(c) && (mode !== 'random' || c.kind === 'line'));
  if (mode === 'mistakes') cards = cards.filter(c => mem[c.key]?.w);
  if (mode === 'due') {
    const due = cards.filter(c => mem[c.key] && mem[c.key].d <= Date.now());
    const fresh = cards.filter(c => !mem[c.key] && c.kind === 'line').sort((a, b) => depth(a) - depth(b)).slice(0, Math.max(3, SESSION.due - due.length));
    cards = [...due, ...fresh];
  }
  const picked = weighted(cards, cards.map(c => needOf(mem[c.key], c.mark)), SESSION[mode] || SESSION.random);
  return picked.map(c => {
    if (c.kind !== 'line') return { path: [c.game.root.k[0], ...mainFrom(c.game.root.k[0])], start: 0, card: c.key };
    // a position shared by several chapters continues with a line of the chapter being practised
    const refs = scope === 'all' ? c.refs : c.refs.filter(r => r.game.ch.id === scope);
    const ref = refs[Math.floor(Math.random() * refs.length)];
    const before = pathTo(ref.node);
    const kid = ref.node.k[Math.floor(Math.random() * ref.node.k.length)];
    const after = [kid, ...mainFrom(kid)];
    // up to MAX_OWN_MOVES of your moves from the position
    let own = 0, cut = after.length;
    for (let i = 0; i < after.length; i++) if (i % 2 === 0 && ++own > MAX_OWN_MOVES) { cut = i; break; }
    return { path: [...before, ...after.slice(0, cut)], start: before.length };
  });
}
const depth = c => Math.min(...c.refs.map(r => pathTo(r.node).length));

export function viewCourseDrill(app, id, scope, mode, only) {
  let cleanup = () => {}, gone = false;
  guard(app, async () => {
    const course = await loadCourse(id);
    if (gone) return;
    const items = buildItems(course, scope, mode, only);
    const back = scope === 'all' ? `#/course/${id}` : `#/course/${id}/${scope}`;
    const title = { line: t('Move by move'), random: t('Random positions'), due: t('Daily review'), mistakes: t('My mistakes'), important: t('Important moves'), tricks: t('Tricks') }[mode] || t('Practise');
    if (!items.length) {
      app.innerHTML = `${header(back, title)}<main class="wrap"><section class="card"><p>${mode === 'mistakes' ? t('No mistakes to review. Well done!') : t('Nothing to practise here yet.')}</p><a class="btn primary full" href="${back}">${t('Back')}</a></section></main>`;
      return;
    }
    app.innerHTML = `
      <div class="train">
        ${header(back, title)}
        <div class="course-progress">
          <div class="row small muted"><span id="cdCount"></span><span id="cdXp"></span></div>
          <div class="bar big"><span id="cdBar" style="width:0%"></span></div>
        </div>
        <div class="board-wrap"><div class="board" id="board"></div></div>
        <div class="info"><div class="pfb" id="cdNote"></div></div>
        <div class="actions" id="cdActions"></div>
      </div>`;
    const $ = s => app.querySelector(s);
    const cg = Chessground($('#board'), {
      orientation: toColor(course.side), animation: { enabled: true, duration: 220 }, highlight: { lastMove: true, check: true },
      movable: { free: false, showDests: true, events: { after: (o, d) => userMove(o, d) } }, draggable: { showGhost: true },
    });
    const queue = items.map(x => ({ ...x }));
    const total = queue.length;
    let done = 0, clean = 0, xp = 0, combo = 0, item = null, i = 0, chess = null, misses = 0, itemMisses = 0, timer = null, alive = true;
    let counted = false;
    const graded = new Set();   // each card is graded once per session: its first answer counts
    const gradeOnce = (key, ok) => {
      if (graded.has(key)) return;
      graded.add(key); grade(id, key, ok);
      const ex = course.cards.get(key)?.ex;   // a marked position counts for its exercise too
      if (ex && !graded.has(ex)) { graded.add(ex); grade(id, ex, ok); }
    };

    // session progress: "3/12" (missed items added at the end make the session longer) and the bar
    // starting: called before taking the next item from the queue, so it counts as the current one
    function progress(starting) {
      const all = done + queue.length;
      if (all) $('#cdCount').textContent = t('{n} of {m}', { n: Math.min(done + (starting ? 1 : 0), all), m: all });
      $('#cdBar').style.width = `${Math.round(100 * done / Math.max(1, all))}%`;
    }
    function note(state, title, sub = '') {
      $('#cdNote').className = 'pfb ' + state;
      $('#cdNote').innerHTML = `<div class="pfb-text"><strong>${title}</strong><em class="note-text">${sub}</em></div>`;
    }
    function setBoard(lastNode) {
      cg.set({
        fen: chess.fen(), turnColor: toColor(chess.turn()), check: chess.inCheck() ? toColor(chess.turn()) : false,
        lastMove: lastNode ? [lastNode.u.slice(0, 2), lastNode.u.slice(2, 4)] : undefined,
        movable: { color: chess.turn() === course.side && i < item.path.length ? toColor(course.side) : undefined, dests: chess.turn() === course.side ? dests(chess) : new Map() },
      });
    }
    // a line card per position; an exercise is one card, graded once (failed at the first miss, right at the end)
    const miss = node => {
      if (item.card) { if (!item.graded) { item.graded = true; gradeOnce(item.card, false); } }
      else if (!misses) gradeOnce('l:' + fenKey(node.fen), false);
    };
    function next() {
      clearTimeout(timer);
      progress(true);
      if (!queue.length) return finish();
      item = queue.shift();
      i = item.start; itemMisses = 0; misses = 0; item.graded = false;
      const startFen = item.path[i]?.fen || fenAfter(item.path[i - 1]);
      chess = new Chess(startFen);
      cg.setAutoShapes([]);
      setBoard(item.path[i - 1]);
      const ex = item.card?.startsWith('x:');
      note('play', item.retry ? t('Again: this one you missed') : ex ? t('Find the best continuation') : t('Your move'),
        ex ? esc(course.cards.get(item.card)?.game.title || '') : item.start ? esc(t('Position after {m}', { m: label(item.path[i - 1]) })) : '');
      $('#cdActions').innerHTML = `<button class="btn ghost" id="cdHint">💡 ${t('Hint')}</button><button class="btn ghost" id="cdSol">${t('Show the move')}</button>`;
      $('#cdHint').onclick = () => hint(true);
      $('#cdSol').onclick = () => reveal();
      advance();
    }
    // the other side's moves play themselves
    function advance() {
      if (!alive) return;
      if (i >= item.path.length) return itemDone();
      const node = item.path[i];
      if (chess.turn() !== course.side) {
        setBoard(item.path[i - 1]);
        timer = setTimeout(() => {
          const m = chess.move(node.s);
          sound(m.captured ? 'capture' : 'move');
          i++;
          setBoard(node);
          cg.setAutoShapes([]);
          advance();
        }, 450);
        return;
      }
      misses = 0;
      setBoard(item.path[i - 1]);
      const mark = course.cards.get('l:' + fenKey(chess.fen()))?.mark;
      if (mark && !item.card) note('warn', mark === 'tricks' ? `🪤 ${t('Trick')}` : `❗ ${t('Important move')}`,
        esc((i === item.start && i ? t('Position after {m}', { m: label(item.path[i - 1]) }) + ' · ' : '') + t('Think carefully before you move.')));
    }
    function accepted() { return (item.path[i].parent.k || []).map(k => k.u); }
    function userMove(o, d) {
      if (!item || i >= item.path.length || chess.turn() !== course.side) return setBoard(item?.path[i - 1]);
      const piece = chess.get(o);
      const uci = o + d + (piece?.type === 'p' && (d[1] === '8' || d[1] === '1') ? 'q' : '');
      const node = item.path[i];
      const ok = accepted().find(u => u === uci || u.slice(0, 4) === uci.slice(0, 4));
      if (ok) {
        // another of the teacher's moves: follow that branch instead
        let played = node;
        if (ok !== node.u) {
          played = node.parent.k.find(k => k.u === ok);
          item.path = [...item.path.slice(0, i), played, ...mainFrom(played)];
        }
        const m = chess.move(played.s);
        sound(m.captured ? 'capture' : 'move');
        if (!misses && !item.card) gradeOnce('l:' + fenKey(played.fen), true);
        i++;
        setBoard(played);
        cg.setAutoShapes(shapesOf(played));
        note('good', misses ? t('That is it') : t('Correct!'), played.c ? esc(played.c) : '');
        timer = setTimeout(advance, played.c ? 900 : 350);
        return;
      }
      // wrong: undo, count it once for the card, hints after two misses
      try { chess.move({ from: o, to: d, promotion: 'q' }); sound('move'); } catch { return setBoard(item.path[i - 1]); }
      const wrongSan = chess.history().at(-1);
      setBoard(item.path[i - 1]);
      miss(node);
      misses++; itemMisses++; combo = 0;
      note('bad', t('Not this one'), esc(t('{m} is not the move of the course. Try again.', { m: san(wrongSan) })));
      timer = setTimeout(() => { chess.undo(); setBoard(item.path[i - 1]); if (misses >= 2) hint(false); if (misses >= 3) reveal(); }, 600);
    }
    function hint(byButton) {
      if (!item || i >= item.path.length) return;
      const node = item.path[i];
      if (byButton && !misses) { miss(node); misses++; itemMisses++; combo = 0; }
      cg.setAutoShapes([{ orig: node.u.slice(0, 2), brush: 'yellow' }]);
      note('warn', t('Hint'), esc(t('Move the highlighted piece.')));
    }
    function reveal() {
      if (!item || i >= item.path.length) return;
      const node = item.path[i];
      if (!misses) miss(node);
      misses = 3; itemMisses++; combo = 0;
      cg.setAutoShapes([{ orig: node.u.slice(0, 2), dest: node.u.slice(2, 4), brush: 'green' }]);
      note('failed', t('The move is {m}', { m: san(node.s) }), esc(t('Play it on the board to continue.')));
    }
    function itemDone() {
      done++;
      if (item.card && !itemMisses) gradeOnce(item.card, true);
      if (!counted) { counted = true; if (store.touchActivity()) celebrate(store.habitState().streak); }
      if (itemMisses) {
        // missed ones come back at the end of the session, from the same point
        if (!item.retry) queue.push({ ...item, path: item.path, retry: true });
        note('failed', t('Line finished'), esc(t('It will come back at the end so you can get it right.')));
      } else {
        if (!item.retry) clean++;
        combo++;
        const gain = 10 + Math.min(combo - 1, 4) * 2;
        xp += gain; addXp(id, gain);
        $('#cdXp').textContent = `⭐ ${xp}`;
        note('ok', combo > 2 ? t('Perfect! {n} in a row', { n: combo }) : t('Perfect!'), esc(item.path.at(-1).c || ''));
      }
      $('#cdActions').innerHTML = `<button class="btn success full" id="cdNext">${t('Continue')} ›</button>`;
      $('#cdNext').onclick = next;
      progress(false);
      if (!itemMisses && !item.path.at(-1).c) timer = setTimeout(() => { if (alive) next(); }, 900);
    }
    function finish() {
      const p = progressOf(id, scope === 'all' ? new Set(course.cards.keys()) : course.chapters.find(c => c.id === scope).cards);
      cg.setAutoShapes([]);
      app.querySelector('.train').innerHTML = `${header(back, title)}
        <main class="wrap"><section class="card center">
          <div class="big-num">⭐ ${xp}</div>
          <p>${t('{ok} of {n} at the first try', { ok: clean, n: total })}</p>
          ${progressBar(p)}
          <p class="small muted">${t('{n} of {m} positions mastered', { n: p.mastered, m: p.total })}${p.due ? ' · ' + tn(p.due, '{n} to review', '{n} to review') : ''}</p>
          <a class="btn primary full" href="${location.hash}" id="cdAgain">↺ ${t('Another session')}</a>
          ${p.weak ? `<a class="btn ghost full" href="#/cdrill/${id}/${scope}/mistakes">✗ ${t('My mistakes ({n})', { n: p.weak })}</a>` : ''}
          <a class="btn ghost full" href="${back}">${t('Back')}</a>
        </section></main>`;
      app.querySelector('#cdAgain').onclick = e => { e.preventDefault(); window.dispatchEvent(new HashChangeEvent('hashchange')); };
    }
    // dev only: lets the end-to-end tests read the expected move
    if (import.meta.env.DEV) window.__courseDrill = { expected: () => (item && i < item.path.length && chess.turn() === course.side ? item.path[i].u : null), state: () => ({ done, left: queue.length, xp }),
      chapter: () => { let n = item?.path.at(-1); while (n?.parent) n = n.parent; return course.chapters.find(ch => KINDS.some(k => (ch[k] || []).some(g => g.root === n)))?.id; } };
    const onResize = () => cg.redrawAll();
    window.addEventListener('resize', onResize);
    cleanup = () => { alive = false; clearTimeout(timer); window.removeEventListener('resize', onResize); cg.destroy(); };
    $('#cdXp').textContent = '';
    next();
  });
  return () => { gone = true; cleanup(); };
}
