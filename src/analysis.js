// Analysis screen: free board + Stockfish in the browser.
import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { Engine } from './engine.js';
import * as store from './store.js';
import { askPromotion } from './puzzleboard.js';
import { sound } from './sound.js';
import { t } from './i18n.js';

const KEY = 'wp:analysis';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toColor = c => (c === 'w' ? 'white' : 'black');

// Main line (alternating uci moves) of a solution tree
export function mainLine(tree) {
  const out = [];
  let t = tree;
  while (t && t[0]) {
    out.push(t[0][0]);
    if (t[0][1]) out.push(t[0][1]);
    t = t[0][2];
  }
  return out;
}

/**
 * Opens the analysis. payload: { fen, solution: [uci], wrong: [uci], title, ref?: { setId, cycleN, idx } }
 */
export function openAnalysis(payload) {
  try { sessionStorage.setItem(KEY, JSON.stringify(payload)); } catch {}
  location.hash = '#/analysis';
}

function sanLine(fen, ucis, numbered = true) {
  const c = new Chess(fen);
  const parts = [];
  for (const u of ucis) {
    let mv;
    try { mv = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || undefined }); } catch { break; }
    const n = mv.before.split(' ')[5];
    if (numbered) {
      if (mv.color === 'w') parts.push(`${n}. ${mv.san}`);
      else parts.push(parts.length ? mv.san : `${n}… ${mv.san}`);
    } else parts.push(mv.san);
  }
  return parts;
}

function fmtScore(l) {
  if (l.mate != null) return (l.mate > 0 ? '#' : '#-') + Math.abs(l.mate);
  const v = l.cp / 100;
  return (v > 0 ? '+' : '') + v.toFixed(2);
}

export function viewAnalysis(app) {
  let p;
  try { p = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch {}
  if (!p) { location.hash = '#/'; return () => {}; }

  const start = new Chess(p.fen);
  const hero = start.turn();
  let moves = [...(p.solution || [])]; // current line (uci from the start position)
  let ply = 0;                           // how many moves of "moves" are applied
  let engineOn = true;
  let orientation = toColor(hero);
  let engine = null;

  app.innerHTML = `
    <div class="train">
      <header class="top"><button class="icon-btn" id="back" aria-label="${t('Back')}">‹</button>
        <h1 class="ellipsis">${t('Analysis')} · ${esc(p.title || '')}</h1>
        <button class="icon-btn" id="flip" aria-label="${t('Flip board')}">⇅</button></header>
      <div class="eval-row"><b id="evalTxt">…</b><span class="muted small" id="depth"></span>
        <label class="switch mini"><input type="checkbox" id="engOn" checked><span>Stockfish</span></label></div>
      <div class="board-wrap with-gauge"><div class="gauge"><i id="gauge"></i></div><div class="board" id="board"></div></div>
      <div class="info">
        <div class="pv" id="pvs"><p class="muted small">${t('Loading engine…')}</p></div>
        <div class="movelist" id="moves"></div>
        <div class="small">
          <p><span class="muted">${t('Set solution:')}</span> <a href="#" id="loadSol" class="link">${esc(sanLine(p.fen, p.solution || []).join(' ') || '—')}</a></p>
          ${(p.wrong || []).length ? `<p><span class="muted">${t('Your moves:')}</span> ${p.wrong.map((u, i) => `<a href="#" class="link" data-wrong="${i}">${esc(sanLine(p.fen, [u])[0] || u)}</a>`).join(', ')}</p>` : ''}
        </div>
        ${p.notes ? `<p class="small notes">💬 ${esc(p.notes)}</p>` : ''}
        ${p.ref ? `<div id="refBox"></div>` : ''}
      </div>
      <div class="actions">
        <button class="btn ghost" id="first" aria-label="${t('First move')}">⏮</button>
        <button class="btn ghost" id="prev" aria-label="${t('Previous')}">◀</button>
        <button class="btn ghost" id="next" aria-label="${t('Next')}">▶</button>
        <button class="btn ghost" id="last" aria-label="${t('Last move')}">⏭</button>
        <a class="btn ghost" id="lichess" target="_blank" rel="noopener">Lichess</a>
      </div>
    </div>`;
  const $ = s => app.querySelector(s);

  const cg = Chessground($('#board'), {
    orientation,
    coordinates: store.getSettings().coords,
    animation: { enabled: true, duration: 180 },
    highlight: { lastMove: true, check: true },
    movable: { free: false, showDests: true, events: { after: (o, d) => userMove(o, d) } },
    drawable: { enabled: true },
  });
  const onResize = () => cg.redrawAll();
  window.addEventListener('resize', onResize);

  function position() {
    const c = new Chess(p.fen);
    let last;
    for (let i = 0; i < ply; i++) {
      const u = moves[i];
      last = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || undefined });
    }
    return { c, last };
  }

  function render() {
    const { c, last } = position();
    const dests = new Map();
    for (const m of c.moves({ verbose: true })) {
      if (!dests.has(m.from)) dests.set(m.from, []);
      dests.get(m.from).push(m.to);
    }
    cg.set({
      fen: c.fen(), orientation, turnColor: toColor(c.turn()),
      lastMove: last ? [last.from, last.to] : undefined,
      check: c.inCheck() ? toColor(c.turn()) : false,
      movable: { color: toColor(c.turn()), dests },
    });
    cg.setAutoShapes([]);
    $('#gauge').parentElement.classList.toggle('flip', orientation === 'black');
    // move list
    const sans = sanLine(p.fen, moves);
    $('#moves').innerHTML = sans.map((s, i) => `<button class="mv ${i + 1 === ply ? 'on' : ''}" data-ply="${i + 1}">${esc(s)}</button>`).join(' ');
    $('#lichess').href = 'https://lichess.org/analysis/' + c.fen().replace(/ /g, '_') + '?color=' + orientation;
    analyse(c);
  }

  function analyse(c) {
    $('#evalTxt').textContent = '…';
    $('#depth').textContent = '';
    if (c.isGameOver()) {
      engine?.stop();
      if (c.isCheckmate()) $('#gauge').style.height = c.turn() === 'w' ? '100%' : '0%';
      $('#evalTxt').textContent = c.isCheckmate() ? t('Checkmate') : t('Draw');
      $('#pvs').innerHTML = '';
      return;
    }
    if (!engineOn) { engine?.stop(); $('#pvs').innerHTML = `<p class="muted small">${t('Engine off')}</p>`; $('#evalTxt').textContent = ''; return; }
    if (!engine) engine = new Engine();
    const fen = c.fen();
    engine.analyse(fen, 3, (lines, depth) => {
      const best = lines[0];
      $('#evalTxt').textContent = fmtScore(best);
      // evaluation bar like Lichess (white's share)
      const wc = best.mate != null ? (best.mate > 0 ? 1 : -1) : 2 / (1 + Math.exp(-0.00368208 * best.cp)) - 1;
      $('#gauge').style.height = (50 - wc * 50) + '%';
      $('#depth').textContent = t('depth {d}', { d: depth });
      $('#pvs').innerHTML = lines.map((l, i) => `
        <button class="pvline" data-pv="${i}"><b>${fmtScore(l)}</b> ${esc(sanLine(fen, l.pv.slice(0, 10)).join(' '))}</button>`).join('');
      app.querySelectorAll('[data-pv]').forEach(b => b.onclick = () => playUci(lines[+b.dataset.pv].pv[0]));
      const u = best.pv[0];
      if (u) cg.setAutoShapes([{ orig: u.slice(0, 2), dest: u.slice(2, 4), brush: 'paleBlue' }]);
    });
  }

  function playUci(u) {
    if (moves[ply] === u) ply++;
    else { moves = moves.slice(0, ply).concat(u); ply++; }
    render();
    const { last } = position();
    if (last) sound(last.captured ? 'capture' : 'move');
  }

  async function userMove(orig, dest) {
    const { c } = position();
    const piece = c.get(orig);
    let promo = '';
    if (piece?.type === 'p' && (dest[1] === '8' || dest[1] === '1')) {
      promo = await askPromotion($('#board'), orientation, toColor(c.turn()), dest);
      if (!promo) return render();
    }
    playUci(orig + dest + promo, true);
  }

  $('#first').onclick = () => { ply = 0; render(); };
  $('#prev').onclick = () => { ply = Math.max(0, ply - 1); render(); };
  $('#next').onclick = () => { ply = Math.min(moves.length, ply + 1); render(); };
  $('#last').onclick = () => { ply = moves.length; render(); };
  $('#flip').onclick = () => { orientation = orientation === 'white' ? 'black' : 'white'; render(); };
  $('#back').onclick = () => history.back();
  $('#engOn').onchange = e => { engineOn = e.target.checked; render(); };
  $('#moves').onclick = e => { const b = e.target.closest('[data-ply]'); if (b) { ply = +b.dataset.ply; render(); } };
  $('#loadSol').onclick = e => { e.preventDefault(); moves = [...(p.solution || [])]; ply = 0; render(); };
  app.querySelectorAll('[data-wrong]').forEach(a => a.onclick = e => {
    e.preventDefault(); moves = [p.wrong[+a.dataset.wrong]]; ply = 1; render();
  });
  const onKey = e => {
    if (e.key === 'ArrowLeft') $('#prev').click();
    if (e.key === 'ArrowRight') $('#next').click();
  };
  document.addEventListener('keydown', onKey);

  // From a cycle: allow fixing the result if your move was good
  function renderRef() {
    const box = $('#refBox');
    if (!box) return;
    const set = store.getSet(p.ref.setId);
    const cycle = set?.cycles.find(c => c.n === p.ref.cycleN);
    const r = cycle?.results[p.ref.idx];
    if (!r) { box.innerHTML = ''; return; }
    // manual override of the result, in both directions (failed puzzles go to the mistake review)
    box.innerHTML = r.ok
      ? `<p class="small ok-text">✓ ${t('Counted as correct in cycle {n}', { n: cycle.n })}</p>
         <button class="btn ghost full" id="markBad">✗ ${t('Count as incorrect')}</button>`
      : `<p class="small bad-text">✗ ${t('Counted as incorrect in cycle {n}', { n: cycle.n })}</p>
         <button class="btn ghost full" id="markOk">✓ ${t('My move was good: count as correct')}</button>`;
    $('#markOk') && ($('#markOk').onclick = () => { r.ok = true; store.save(); renderRef(); });
    $('#markBad') && ($('#markBad').onclick = () => { r.ok = false; store.save(); renderRef(); });
  }
  if (p.ref) renderRef();

  render();

  return () => {
    window.removeEventListener('resize', onResize);
    document.removeEventListener('keydown', onKey);
    engine?.destroy();
    cg.destroy();
  };
}
