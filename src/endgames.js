// Endgames: the 100 endgames of Jesús de la Villa's book, used with the author's and the
// publisher's permission. Each final has its key idea, its positions with the book's solution,
// and a practice mode against perfect defence (Lichess tablebases).
// Data: public/endgames/positions.json (built by tools/endgames.py) and content.json (texts).
import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { askPromotion } from './puzzleboard.js';
import { sound } from './sound.js';
import { t, tn, lang, san } from './i18n.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tx = obj => (obj ? obj[lang()] ?? obj.en : '');
const toColor = c => (c === 'w' ? 'white' : 'black');
const TB = 'https://tablebase.lichess.ovh/standard?fen=';
const PROGRESS = 'wp:endgames:v1';

let data = null;
async function load() {
  if (data) return data;
  const base = import.meta.env.BASE_URL + 'endgames/';
  const [pos, content] = await Promise.all([
    fetch(base + 'positions.json').then(r => r.json()),
    fetch(base + 'content.json').then(r => r.json()),
  ]);
  data = { pos, ...content };
  data.finals = data.chapters.flatMap(c => c.finals.map(f => ({ ...f, chapter: c })));
  return data;
}

// Progress per position (by PGN index): { [i]: { won: true, clean: true, at } }
const progress = () => { try { return JSON.parse(localStorage.getItem(PROGRESS) || '{}'); } catch { return {}; } };
function setProgress(i, clean) {
  const all = progress();
  const p = all[i] || {};
  all[i] = { won: true, clean: p.clean || clean, at: Date.now() };
  try { localStorage.setItem(PROGRESS, JSON.stringify(all)); } catch {}
}

const credit = () => `<p class="small muted credit">${t('Based on "100 Endgames You Must Know" by Jesús de la Villa (Esfera Editorial), with permission.')}</p>`;
const goalText = p => (p.goal === 'win'
  ? (p.hero === 'w' ? t('White wins') : t('Black wins'))
  : (p.hero === 'w' ? t('White draws') : t('Black draws')));
const toMoveText = fen => (fen.split(' ')[1] === 'w' ? t('White to move') : t('Black to move'));

// ---------- catalogue ----------
export function viewEndgames(app) {
  app.innerHTML = `<header class="top"><a class="icon-btn" href="#/">‹</a><h1>${t('Endgames')}</h1><span></span></header><main class="wrap" id="egMain"><p class="muted">${t('Loading…')}</p></main>`;
  load().then(d => {
    const pr = progress();
    app.querySelector('#egMain').innerHTML = `
      <p class="small muted">${t('The endgames every player must know, explained step by step. Study each idea, then practise it against perfect defence until you can win (or draw) it yourself.')}</p>
      ${credit()}
      ${d.chapters.map(c => {
        const ids = c.finals.flatMap(f => f.positions.map(p => p.p));
        const done = ids.filter(i => pr[i]?.won).length;
        return `<a class="card set-card" href="#/endgames/${c.id}">
          <div class="row"><strong>${c.n}. ${esc(tx(c.title))}</strong><span class="small muted">${done}/${ids.length}</span></div>
          <p class="small muted">${esc(tx(c.summary))}</p>
          <div class="bar big"><span style="width:${ids.length ? Math.round(100 * done / ids.length) : 0}%"></span></div>
        </a>`;
      }).join('')}`;
  }).catch(e => { app.querySelector('#egMain').innerHTML = `<p class="bad-text">${esc(e.message)}</p>`; });
}

// ---------- one chapter ----------
export function viewEndgameChapter(app, id) {
  app.innerHTML = `<header class="top"><a class="icon-btn" href="#/endgames">‹</a><h1 class="ellipsis" id="egTitle">${t('Endgames')}</h1><span></span></header><main class="wrap" id="egMain"></main>`;
  load().then(d => {
    const c = d.chapters.find(x => x.id === id);
    if (!c) return;
    const pr = progress();
    app.querySelector('#egTitle').textContent = `${c.n}. ${tx(c.title)}`;
    app.querySelector('#egMain').innerHTML = `
      ${c.intro ? `<section class="card">${tx(c.intro).split('\n').map(p => `<p>${esc(p)}</p>`).join('')}</section>` : ''}
      ${c.finals.map(f => {
        const chips = f.positions.map((p, k) => `<span class="chip ${pr[p.p]?.won ? 'ok' : ''}">${k + 1}</span>`).join('');
        return `<a class="card set-card" href="#/endgame/${f.n}">
          <div class="row"><strong>${t('Endgame {n}', { n: f.n })}. ${esc(tx(f.title))}</strong></div>
          <div class="chips">${chips}</div></a>`;
      }).join('')}`;
  });
}

// ---------- one final: idea, solution, practice ----------
export function viewEndgame(app, n, k0, go) {
  let cg = null, alive = true, timer = null;
  const cleanup = () => { alive = false; clearTimeout(timer); cg?.destroy(); window.removeEventListener('resize', onResize); document.removeEventListener('keydown', onKey); };
  const onResize = () => cg?.redrawAll();
  let keys = null;
  const onKey = e => keys?.(e);
  window.addEventListener('resize', onResize);
  document.addEventListener('keydown', onKey);
  app.innerHTML = `<header class="top"><a class="icon-btn" href="#/endgames" id="egBack">‹</a><h1 class="ellipsis" id="egTitle">${t('Endgames')}</h1><span class="small muted" id="egCount"></span></header><main id="egMain"></main>`;

  load().then(d => {
    const fIdx = d.finals.findIndex(f => f.n === +n);
    const f = d.finals[fIdx];
    if (!f || !alive) return;
    app.querySelector('#egBack').href = `#/endgames/${f.chapter.id}`;
    app.querySelector('#egTitle').textContent = `${f.n}. ${tx(f.title)}`;
    let k = Math.min(+k0 || 0, f.positions.length - 1);
    const main = app.querySelector('#egMain');

    function show(mode) {
      clearTimeout(timer);
      keys = null;
      const ref = f.positions[k];
      const p = d.pos[ref.p - 1];
      app.querySelector('#egCount').textContent = f.positions.length > 1 ? `${k + 1}/${f.positions.length}` : '';
      main.innerHTML = `
        <div class="train">
          <div class="row coach-head"><span class="badge info">${goalText(p)}</span><span class="small muted">${toMoveText(p.fen)}</span></div>
          <div class="board-wrap"><div class="board" id="board"></div></div>
          <div class="info">
            <div class="pfb" id="egNote"></div>
            <div class="movelist" id="egMoves"></div>
            <div class="small eg-text" id="egText"></div>
          </div>
          <div class="actions" id="egActions"></div>
          <div class="eg-tabs">
            <button class="btn ${mode === 'study' ? 'primary' : 'ghost'}" id="tabStudy">📖 ${t('Solution')}</button>
            <button class="btn ${mode === 'practice' ? 'primary' : 'ghost'}" id="tabPractice">♟ ${t('Practise')}</button>
          </div>
          <div class="wrap">
            ${k === 0 ? `<section class="card eg-idea">${tx(f.idea).split('\n').map(x => `<p>${esc(x)}</p>`).join('')}</section>` : ''}
            <div class="grid2">
              ${k > 0 ? `<button class="btn ghost" id="egPrev">‹ ${t('Previous position')}</button>` : fIdx > 0 ? `<a class="btn ghost" href="#/endgame/${d.finals[fIdx - 1].n}">‹ ${t('Previous endgame')}</a>` : '<span></span>'}
              ${k + 1 < f.positions.length ? `<button class="btn ghost" id="egNext">${t('Next position')} ›</button>` : fIdx + 1 < d.finals.length ? `<a class="btn ghost" href="#/endgame/${d.finals[fIdx + 1].n}">${t('Next endgame')} ›</a>` : '<span></span>'}
            </div>
            ${credit()}
          </div>
        </div>`;
      const $ = s => main.querySelector(s);
      $('#tabStudy').onclick = () => show('study');
      $('#tabPractice').onclick = () => show('practice');
      $('#egPrev') && ($('#egPrev').onclick = () => { k--; show('study'); });
      $('#egNext') && ($('#egNext').onclick = () => { k++; show('study'); });
      cg?.destroy();
      cg = Chessground($('#board'), {
        orientation: toColor(p.hero), animation: { enabled: true, duration: 200 },
        highlight: { lastMove: true, check: true }, coordinates: true,
        movable: { free: false, showDests: true },
        draggable: { showGhost: true },
      });
      // the note explains the solution, so it is only shown when studying
      $('#egText').innerHTML = ref.note && mode === 'study' ? `<p>${esc(tx(ref.note))}</p>` : '';
      if (mode === 'practice') practice(p, $); else study(p, $);
    }

    // --- the book's solution, step by step ---
    function study(p, $) {
      let ply = 0;
      const pos = n2 => { const c = new Chess(p.fen); for (let i = 0; i < n2; i++) c.move(p.main[i]); return c; };
      const number = (i, s) => {
        const startBlack = p.fen.split(' ')[1] === 'b';
        const moveNo = +p.fen.split(' ')[5] + Math.floor((i + (startBlack ? 1 : 0)) / 2);
        const white = (i + (startBlack ? 1 : 0)) % 2 === 0;
        return white ? `${moveNo}.${san(s)}` : (i === 0 ? `${moveNo}...${san(s)}` : san(s));
      };
      const draw = () => {
        const c = pos(ply);
        const h = c.history({ verbose: true });
        let last = null;
        if (ply > 0) { const prev = pos(ply - 1); const m = prev.move(p.main[ply - 1]); last = [m.from, m.to]; }
        cg.set({ fen: c.fen(), turnColor: toColor(c.turn()), lastMove: last || undefined, check: c.inCheck() ? toColor(c.turn()) : false, movable: { color: undefined } });
        void h;
        $('#egMoves').innerHTML = p.main.map((s, i) => `<button class="mv ${i + 1 === ply ? 'on' : ''}" data-ply="${i + 1}">${esc(number(i, s))}</button>`).join(' ')
          + (p.pgn.includes('(') ? `<div class="small muted eg-vars">${esc(t('With variations'))}: ${esc(sanLine(p.pgn))}</div>` : '');
        $('#egNote').className = 'pfb play';
        $('#egNote').innerHTML = `<div class="pfb-text"><strong>${esc(goalText(p))}</strong><em>${ply === 0 ? t('Use ▶ or the arrow keys to step through the solution.') : ply === p.main.length ? t('End of the solution. Now try it yourself in Practise.') : ''}</em></div>`;
      };
      const goTo = x => {
        const before = ply;
        ply = Math.max(0, Math.min(p.main.length, x));
        if (ply === before + 1) { const m = pos(before).move(p.main[before]); sound(m.captured ? 'capture' : 'move'); }
        draw();
      };
      $('#egActions').innerHTML = `
        <button class="btn ghost" id="first">⏮</button><button class="btn ghost" id="prev">◀</button>
        <button class="btn ghost" id="next">▶</button><button class="btn ghost" id="last">⏭</button>`;
      $('#first').onclick = () => goTo(0);
      $('#prev').onclick = () => goTo(ply - 1);
      $('#next').onclick = () => goTo(ply + 1);
      $('#last').onclick = () => goTo(p.main.length);
      $('#egMoves').onclick = e => { const b = e.target.closest('[data-ply]'); if (b) goTo(+b.dataset.ply); };
      keys = e => { if (e.key === 'ArrowRight') goTo(ply + 1); if (e.key === 'ArrowLeft') goTo(ply - 1); };
      draw();
    }

    // --- practice against the tablebase ---
    function practice(p, $) {
      const c = new Chess(p.fen);
      const hero = p.hero;
      let mistakes = 0, heroMoves = 0, busy = false, done = false;
      const history = [];
      const note = (html, state = 'play') => { $('#egNote').className = 'pfb ' + state; $('#egNote').innerHTML = `<div class="pfb-text">${html}</div>`; };
      const dests = () => {
        const m = new Map();
        for (const mv of c.moves({ verbose: true })) { if (!m.has(mv.from)) m.set(mv.from, []); m.get(mv.from).push(mv.to); }
        return m;
      };
      const draw = last => cg.set({
        fen: c.fen(), turnColor: toColor(c.turn()), lastMove: last, check: c.inCheck() ? toColor(c.turn()) : false,
        movable: { color: !done && c.turn() === hero && !busy ? toColor(hero) : undefined, dests: dests(), events: { after: onMove } },
      });
      $('#egMoves').innerHTML = '';
      $('#egActions').innerHTML = `<button class="btn ghost" id="egHint">💡 ${t('Hint')}</button><button class="btn ghost" id="egUndo">↶ ${t('Take back')}</button><button class="btn ghost" id="egReset">↺ ${t('Restart')}</button>`;
      $('#egReset').onclick = () => show('practice');
      $('#egUndo').onclick = undo;
      $('#egHint').onclick = hint;
      note(`<strong>${esc(goalText(p))}</strong><em>${p.goal === 'win' ? t('Win against the perfect defence of the tablebase.') : t('Hold the draw against the best attack of the tablebase.')}</em>`);
      draw();
      if (c.turn() !== hero) opponent();

      function undo() {
        if (busy || history.length < 1) return;
        // take back the user's last move and the reply
        let last;
        while (history.length) { last = history.pop(); c.undo(); if (last.hero) break; }
        done = false;
        draw();
        note(`<strong>${t('Your move')}</strong>`);
      }

      async function hint() {
        if (busy || done || c.turn() !== hero) return;
        const r = await probe(c.fen());
        if (!r) return offline();
        const best = bestFor(r);
        if (best) cg.setAutoShapes([{ orig: best.uci.slice(0, 2), dest: best.uci.slice(2, 4), brush: 'green' }]);
      }

      async function onMove(orig, dest) {
        if (busy || done) return;
        const piece = c.get(orig);
        let promo;
        if (piece?.type === 'p' && (dest[1] === '8' || dest[1] === '1')) {
          promo = await askPromotion($('#board'), toColor(hero), toColor(hero), dest);
          if (!promo) { draw(); return; }
        }
        const before = c.fen();
        let mv;
        try { mv = c.move({ from: orig, to: dest, promotion: promo }); } catch { draw(); return; }
        sound(mv.captured ? 'capture' : 'move');
        history.push({ hero: true });
        heroMoves++;
        cg.setAutoShapes([]);
        busy = true;
        draw([mv.from, mv.to]);
        const r = await probe(c.fen());
        busy = false;
        if (!alive) return;
        if (!r) { draw([mv.from, mv.to]); return offline(); }
        const ok = p.goal === 'win' ? ['loss', 'blessed-loss', 'maybe-loss'].includes(r.category) || c.isCheckmate()
          : !['loss', 'blessed-loss', 'maybe-loss'].includes(r.category) || c.isStalemate() || c.isDraw();
        if (!ok) {
          mistakes++;
          const msg = p.goal === 'win'
            ? (r.category === 'draw' ? t('That lets the win slip: the position is now a draw.') : t('That loses!'))
            : t('That loses: now your opponent can force a win.');
          const pre = await probe(before);
          const best = pre && bestFor(pre);
          note(`<strong>${msg}</strong><em>${best ? t('A move that keeps the result was {m}.', { m: san(best.san) }) : ''} ${t('Take back and try again.')}</em>`, 'bad');
          if (best) cg.setAutoShapes([{ orig: best.uci.slice(0, 2), dest: best.uci.slice(2, 4), brush: 'green' }]);
          done = true; draw([mv.from, mv.to]);
          return;
        }
        if (finished()) return;
        opponent();
      }

      async function opponent() {
        busy = true; draw();
        const r = await probe(c.fen());
        if (!alive) return;
        if (!r) { busy = false; return offline(); }
        const reply = r.moves?.[0];
        timer = setTimeout(() => {
          if (!alive || !reply) { busy = false; return; }
          const m = c.move(reply.san);
          history.push({ hero: false });
          sound(m.captured ? 'capture' : 'move');
          busy = false;
          draw([m.from, m.to]);
          if (finished()) return;
          note(`<strong>${t('Your move')}</strong><em>${p.goal === 'win' && r.dtm ? t('Mate in {n} with perfect play.', { n: Math.ceil(Math.abs(r.dtm) / 2) }) : ''}</em>`);
        }, 450);
      }

      function finished() {
        const won = c.isCheckmate() && c.turn() !== hero;
        const heroOnlyKing = c.board().flat().filter(s => s && s.color === hero).length === 1;
        const drawn = c.isDraw() || c.isStalemate() || c.isInsufficientMaterial();
        // a win is "done" once the opponent has only the king and we keep a queen or rook (the rest is a basic mate)
        const enemy = hero === 'w' ? 'b' : 'w';
        const basicMate = p.goal === 'win' && c.board().flat().filter(s => s && s.color === enemy).length === 1 && c.board().flat().some(s => s && s.color === hero && 'qr'.includes(s.type));
        const heldDraw = p.goal === 'draw' && (drawn || heroMoves >= 12);
        if (won || basicMate || heldDraw) {
          done = true; draw();
          setProgress(p.i, mistakes === 0);
          note(`<strong>${p.goal === 'win' ? (won ? t('Checkmate! Well done.') : t('Won! The rest is a basic mate.')) : t('Draw held! Well done.')}</strong><em>${mistakes ? tn(mistakes, '{n} mistake', '{n} mistakes') : t('No mistakes.')}</em>`, 'ok');
          return true;
        }
        if (drawn || (heroOnlyKing && p.goal === 'win')) {
          done = true; draw();
          note(`<strong>${t('The game is over.')}</strong>`, 'failed');
          return true;
        }
        return false;
      }

      function offline() {
        note(`<strong>${t('Practice needs an internet connection')}</strong><em>${t('The perfect defence comes from the Lichess tablebases.')}</em>`, 'bad');
      }
    }

    show('study');
  });
  return cleanup;
}

// Best move for the side to move in a tablebase response (moves are sorted best first)
const bestFor = r => r.moves?.[0] || null;

const tbCache = new Map();
async function probe(fen) {
  if (tbCache.has(fen)) return tbCache.get(fen);
  try {
    const res = await fetch(TB + encodeURIComponent(fen));
    if (!res.ok) return null;
    const r = await res.json();
    tbCache.set(fen, r);
    return r;
  } catch { return null; }
}

// PGN movetext with variations, with piece letters in the user's language
function sanLine(pgn) {
  return pgn.replace(/\b([KQRBN])(?=[a-h1-8x])/g, m => san(m));
}
