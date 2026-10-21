// Opening trees: study every branch the opponent really plays, and drill them with replies
// chosen by real frequency (rare lines less often, failed lines more often).
// Tree file (public/openings/trees/<file>.json, built by tools/build-tree.py):
//   { root: [san...], side: 'w'|'b', c: [node...] }
//   node = { s: san, u: uci, e: eval (cp, our view), p?: share %, l?: loss cp, g?: games, w?: our win %, d?: draw %, c?: [node...] }
// Opponent nodes have p; our nodes do not.
import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { OPENINGS } from './openings-data.js';
import { openAnalysis } from './analysis.js';
import { sound } from './sound.js';
import { t, tn, lang, san } from './i18n.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tx = obj => (obj ? obj[lang()] ?? obj.en : '');
const toColor = c => (c === 'w' ? 'white' : 'black');

// Notes live in public/openings/notes/<file>.json ({ 'san san …': { en, es } }), or inline in
// the line (line.tree.notes).
const cache = new Map();
export async function loadTree(file) {
  if (cache.has(file)) return cache.get(file);
  const base = import.meta.env.BASE_URL + 'openings/';
  const [res, notes] = await Promise.all([
    fetch(base + `trees/${file}.json`),
    fetch(base + `notes/${file}.json`).then(r => (r.ok ? r.json() : {})).catch(() => ({})),
  ]);
  if (!res.ok) throw new Error(t('Could not load the opening tree'));
  const tree = await res.json();
  tree.notes = notes;
  cache.set(file, tree);
  return tree;
}

// Quality mark of an opponent move from how much it lost
export function mark(n) {
  if (n.l == null) return '';
  if (n.l >= 150) return '??';
  if (n.l >= 70) return '?';
  if (n.l >= 40) return '?!';
  return '';
}
const markLabel = m => ({ '??': t('Blunder'), '?': t('Mistake'), '?!': t('Inaccuracy') }[m] || '');
const evalText = e => (Math.abs(e) >= 9000 ? (e > 0 ? '#' : '-#') : (e > 0 ? '+' : '') + (e / 100).toFixed(1));

// All complete branches: [{ path: [node...], key, prob }]
export function leaves(tree) {
  const out = [];
  const walk = (nodes, path, prob) => {
    for (const n of nodes) {
      const p = n.p != null ? prob * n.p / 100 : prob;
      const next = [...path, n];
      if (n.c?.length) walk(n.c, next, p);
      else out.push({ path: next, key: next.map(x => x.u).join(' '), prob: p });
    }
  };
  walk(tree.c, [], 1);
  return out;
}

// Drill memory per branch, on this device: { 'opening/line': { branchKey: { box, fail, at } } }
const TREE_KEY = 'wp:tree:v1';
const allMemory = () => { try { return JSON.parse(localStorage.getItem(TREE_KEY) || '{}'); } catch { return {}; } };
export const treeMemory = id => allMemory()[id] || {};
function remember(id, key, mistakes) {
  const all = allMemory();
  const m = all[id] || (all[id] = {});
  const s = m[key] || { box: 0 };
  s.box = mistakes ? 0 : Math.min(5, s.box + 1);
  s.fail = mistakes > 0; s.at = Date.now();
  m[key] = s;
  try { localStorage.setItem(TREE_KEY, JSON.stringify(all)); } catch {}
}
const MASTERED = 2;
export const masteredCount = (id, list) => { const m = treeMemory(id); return list.filter(l => (m[l.key]?.box || 0) >= MASTERED).length; };

// Weighted choice: common branches more often (square root so rare ones still appear),
// failed or new branches more often, well-known ones less.
function pickBranch(id, list, avoid) {
  const m = treeMemory(id);
  const w = list.map(l => {
    const s = m[l.key];
    const box = s?.box || 0;
    return Math.sqrt(l.prob) * (s?.fail ? 3 : !s ? 1.5 : 1) / 2 ** box * (l.key === avoid && list.length > 1 ? 0 : 1);
  });
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i]; }
  return list[list.length - 1];
}

/**
 * Study (mode 'study') or drill (mode 'drill') of the tree of a line.
 * In study mode `start` is an optional branch index to open at its end.
 */
export function viewOpeningTree(app, id, lineId, mode, go, start) {
  const o = OPENINGS.find(x => x.id === id);
  const line = o?.lines.find(l => l.id === lineId);
  if (!line?.tree) { go('#/opening/' + id); return () => {}; }
  const drill = mode === 'drill';
  const memId = `${o.id}/${line.id}`;
  app.innerHTML = `
    <div class="train">
      <header class="top"><a class="icon-btn" href="#/opening/${o.id}">‹</a>
        <h1 class="ellipsis">${drill ? '♟ ' : '🌳 '}${esc(tx(line.name))}</h1><span class="small muted" id="otCount"></span></header>
      <div class="board-wrap"><div class="board" id="board"></div></div>
      <div class="info">
        <div class="pfb" id="otNote"></div>
        <div class="movelist" id="otMoves"></div>
        <div class="branches" id="otBranches"></div>
      </div>
      <div class="actions" id="otActions"></div>
    </div>`;
  const $ = s => app.querySelector(s);
  const cg = Chessground($('#board'), {
    orientation: toColor(o.side),
    animation: { enabled: true, duration: 200 },
    highlight: { lastMove: true, check: true },
    movable: { free: false, showDests: true, events: { after: (orig, dest) => onUserMove(orig, dest) } },
    draggable: { showGhost: true },
  });
  const onResize = () => cg.redrawAll();
  window.addEventListener('resize', onResize);
  let keys = null;
  const onKey = e => keys?.(e);
  document.addEventListener('keydown', onKey);
  let timer = null, alive = true;

  let tree, list, path = [];  // path: nodes played after the root
  const rootLen = () => tree.root.length;
  const noteOf = p => { const k = p.map(n => n.s).join(' '); return line.tree.notes?.[k] || tree.notes?.[k]; };
  const childrenOf = p => (p.length ? p[p.length - 1].c || [] : tree.c);

  function board(p) {
    const c = new Chess();
    for (const s of tree.root) c.move(s);
    let last = null;
    for (const n of p) { const m = c.move(n.s); last = m.from + m.to; }
    if (!p.length) { const h = c.history({ verbose: true }); const m = h[h.length - 1]; last = m.from + m.to; }
    return { c, last };
  }

  function moveLabel(n, ply) {
    const num = Math.floor(ply / 2) + 1;
    return (ply % 2 === 0 ? `${num}.` : `${num}...`) + san(n.s) + mark(n);
  }

  // Move list: the root (dimmed) and the current path
  function drawMoves(clickable) {
    const rootTxt = tree.root.map((s, i) => (i % 2 === 0 ? `${i / 2 + 1}.` : '') + san(s)).join(' ');
    $('#otMoves').innerHTML = `<span class="muted">${esc(rootTxt)}</span> ` + path.map((n, i) =>
      `<button class="mv ${i === path.length - 1 ? 'on' : ''}" data-i="${i + 1}" ${clickable ? '' : 'disabled'}>${esc(moveLabel(n, rootLen() + i))}</button>`).join(' ');
  }

  function draw(dests = new Map(), color) {
    const { c, last } = board(path);
    cg.set({
      fen: c.fen(), turnColor: toColor(c.turn()), lastMove: last ? [last.slice(0, 2), last.slice(2, 4)] : undefined,
      check: c.inCheck() ? toColor(c.turn()) : false,
      movable: { color, dests },
    });
    return c;
  }

  function note(html, state = 'play') {
    $('#otNote').className = 'pfb ' + state;
    $('#otNote').innerHTML = `<div class="pfb-text"><em class="note-text">${html}</em></div>`;
  }

  // Facts about a node: share, score, quality
  function facts(n) {
    const bits = [];
    if (n.p != null) bits.push(t('{p}% of games', { p: n.p }));
    if (n.w != null) bits.push(t('you win {w}%', { w: n.w }));
    bits.push(evalText(n.e));
    const m = mark(n);
    if (m) bits.push(`<strong class="bad-text">${markLabel(m)}</strong>`);
    return bits.join(' · ');
  }

  function playSound(p) {
    const { c } = board(p.slice(0, -1));
    const m = c.move(p[p.length - 1].s);
    sound(m.captured ? 'capture' : 'move');
  }

  // ---------- study ----------
  function study() {
    const kids = childrenOf(path);
    const { c } = board(path);
    const dests = new Map();
    for (const k of kids) { const f = k.u.slice(0, 2); if (!dests.has(f)) dests.set(f, []); dests.get(f).push(k.u.slice(2, 4)); }
    draw(dests, kids.length ? toColor(c.turn()) : undefined);
    drawMoves(true);
    const cur = path[path.length - 1];
    const n = noteOf(path);
    const auto = cur && !n && mark(cur) ? t('This move loses about {n} pawns compared with the best one. Find how to punish it.', { n: (cur.l / 100).toFixed(1) }) : '';
    note(cur
      ? `<strong>${esc(moveLabel(cur, rootLen() + path.length - 1))}</strong> <span class="small muted">${facts(cur)}</span>${n ? '<br>' + esc(tx(n)) : auto ? '<br>' + esc(auto) : ''}`
      : `<strong>${esc(tx(line.name))}</strong>${n ? '<br>' + esc(tx(n)) : ''}`);
    const ply = rootLen() + path.length;
    const ours = c.turn() === o.side;
    $('#otBranches').innerHTML = !kids.length
      ? `<p class="small muted">${t('End of this branch.')}</p>`
      : `<p class="small muted">${ours ? t('Your move:') : t('If they play…')}</p>` + kids.map((k, i) => `
        <button class="branch" data-k="${i}">
          <span class="mono">${esc(moveLabel(k, ply))}</span>
          ${k.p != null ? `<span class="bar"><span style="width:${Math.max(2, k.p)}%"></span></span><span class="small muted">${k.p}%</span>` : `<span class="small muted">${evalText(k.e)}</span>`}
        </button>`).join('');
    $('#otBranches').onclick = e => { const b = e.target.closest('[data-k]'); if (b) step(kids[+b.dataset.k]); };
  }

  function step(n) { path = [...path, n]; playSound(path); study(); }
  function back(to) { path = path.slice(0, Math.max(0, to)); study(); }

  function studyActions() {
    $('#otActions').innerHTML = `
      <button class="btn ghost" id="first" aria-label="${t('First move')}">⏮</button>
      <button class="btn ghost" id="prev" aria-label="${t('Previous')}">◀</button>
      <button class="btn ghost" id="next" aria-label="${t('Next')}">▶</button>
      <button class="btn ghost" id="otAnalyse">🔍 ${t('Analyse')}</button>
      <a class="btn primary" href="#/tdrill/${o.id}/${line.id}">♟ ${t('Practise')}</a>`;
    const next = () => { const k = childrenOf(path); if (k.length) step(k[0]); };
    $('#first').onclick = () => back(0);
    $('#prev').onclick = () => back(path.length - 1);
    $('#next').onclick = next;
    $('#otMoves').onclick = e => { const b = e.target.closest('[data-i]'); if (b) back(+b.dataset.i); };
    $('#otAnalyse').onclick = () => {
      const c = new Chess();
      const ucis = [...tree.root, ...path.map(n => n.s)].map(s => { const m = c.move(s); return m.from + m.to + (m.promotion || ''); });
      openAnalysis({ fen: new Chess().fen(), solution: ucis, title: tx(line.name) });
    };
    keys = e => { if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') back(path.length - 1); };
  }

  // ---------- drill ----------
  let branch = null, mistakes = 0, wrongHere = 0, done = false, lastKey = null;

  function counter() { $('#otCount').textContent = `${masteredCount(memId, list)}/${list.length}`; }

  function drillStart() {
    branch = pickBranch(memId, list, lastKey);
    lastKey = branch.key;
    path = []; mistakes = 0; wrongHere = 0; done = false;
    cg.setAutoShapes([]);
    $('#otBranches').innerHTML = '';
    $('#otActions').innerHTML = `<a class="btn ghost" href="#/tree/${o.id}/${line.id}">🌳 ${t('Study')}</a>`;
    counter();
    advance();
  }

  function myTurn() { return board(path).c.turn() === o.side; }

  function advance() {
    clearTimeout(timer);
    if (path.length >= branch.path.length) return finish();
    if (myTurn()) {
      const { c } = board(path);
      const dests = new Map();
      for (const m of c.moves({ verbose: true })) { if (!dests.has(m.from)) dests.set(m.from, []); dests.get(m.from).push(m.to); }
      draw(dests, toColor(o.side));
      drawMoves(false);
      drillNote();
      return;
    }
    draw(); drawMoves(false);
    timer = setTimeout(() => { if (!alive) return; path = [...path, branch.path[path.length]]; playSound(path); advance(); }, path.length ? 500 : 350);
  }

  function drillNote(extra) {
    const opp = path[path.length - 1];
    const m = opp && mark(opp);
    let html = extra || `<strong>${t('Your move')}</strong>`;
    if (opp && opp.p != null) {
      html += `<br><span class="small muted">${esc(moveLabel(opp, rootLen() + path.length - 1))} · ${t('{p}% of games', { p: opp.p })}</span>`;
      if (m && !extra) html += `<br>${t('The opponent has made a mistake. Find the move that punishes it!')}`;
    }
    note(html, extra ? 'bad' : 'play');
  }

  function onUserMove(orig, dest) {
    if (!drill) {
      const k = childrenOf(path).find(x => x.u.slice(0, 4) === orig + dest);
      if (k) step(k); else study();
      return;
    }
    if (done || !branch) return;
    const { c } = board(path);
    const piece = c.get(orig);
    const promo = piece?.type === 'p' && (dest[1] === '8' || dest[1] === '1') ? 'q' : '';
    const want = branch.path[path.length];
    if (orig + dest + promo === want.u) {
      path = [...path, want]; wrongHere = 0;
      playSound(path);
      cg.setAutoShapes([]);
      advance();
      return;
    }
    mistakes++; wrongHere++;
    sound('move');
    setTimeout(() => advance(), 300);
    const hint = wrongHere >= 2;
    if (hint) cg.setAutoShapes([{ orig: want.u.slice(0, 2), dest: want.u.slice(2, 4), brush: 'green' }]);
    drillNote(`<strong>${t('Not this move')}</strong> — ${hint ? t('the line continues with the arrow.') : t('try again.')}`);
  }

  function finish() {
    done = true;
    draw(); drawMoves(true);
    remember(memId, branch.key, mistakes);
    counter();
    const n = noteOf(path) || noteOf(path.slice(0, -1));
    note(`<strong>${mistakes ? tn(mistakes, '{n} mistake', '{n} mistakes') : t('No mistakes. Well done!')}</strong>
      <br><span class="small muted">${t('Branch played in {p}% of games', { p: (branch.prob * 100).toFixed(branch.prob < 0.01 ? 1 : 0) })}</span>${n ? '<br>' + esc(tx(n)) : ''}`, mistakes ? 'failed' : 'ok');
    const idx = list.indexOf(branch);
    $('#otActions').innerHTML = `
      <a class="btn ghost" href="#/tree/${o.id}/${line.id}/${idx}">🌳 ${t('Study')}</a>
      <button class="btn ghost" id="otAnalyse">🔍 ${t('Analyse')}</button>
      <button class="btn success" id="otNext">${t('Next branch')} ›</button>`;
    $('#otNext').onclick = drillStart;
    $('#otAnalyse').onclick = () => {
      const c = new Chess();
      const ucis = [...tree.root, ...path.map(x => x.s)].map(s => { const m = c.move(s); return m.from + m.to + (m.promotion || ''); });
      openAnalysis({ fen: new Chess().fen(), solution: ucis, title: tx(line.name) });
    };
    keys = e => { if (e.key === 'Enter' || e.key === 'ArrowRight') drillStart(); };
  }

  note(t('Loading…'));
  loadTree(line.tree.file).then(tr => {
    if (!alive) return;
    tree = tr; list = leaves(tree);
    if (drill) { keys = null; drillStart(); }
    else {
      if (start != null && list[+start]) path = list[+start].path;
      study(); studyActions();
      $('#otCount').textContent = tn(list.length, '{n} branch', '{n} branches');
    }
  }).catch(e => note(esc(e.message), 'bad'));

  return () => {
    alive = false;
    clearTimeout(timer);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('keydown', onKey);
    cg.destroy();
  };
}
