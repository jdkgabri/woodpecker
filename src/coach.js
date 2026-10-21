// Game review with a coach: load a Lichess game, find its key moments (tactical and strategic)
// and guide the user through them with questions, hints and explanations instead of numbers.
import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { Engine } from './engine.js';
import { getAuth, authHeaders } from './lichess.js';
import * as store from './store.js';
import { sound } from './sound.js';
import { solvePosition } from './solver.js';
import { OPENINGS } from './openings-data.js';
import { loadTree } from './opening-tree.js';
import { t, tn, lang, san, locale } from './i18n.js';
import {
  parseGameId, replay, winPct, pickMoments, hangingPieces, nullMoveFen, describeMove, lineOutcome,
  quietReason, lessonFor, LESSONS, questionFor, strategicIdeas, strategicDamage, thePiece,
} from './coach-logic.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tx = obj => (obj ? obj[lang()] ?? obj.en : '');
const toColor = c => (c === 'w' ? 'white' : 'black');
const LICHESS = 'https://lichess.org';
const KEY = 'wp:coach:v1';
const FAST_MS = 250, DEEP_MS = 1500, REFUTE_MS = 1000, THREAT_MS = 500, TRY_MS = 700;

// Saved reviews on this device: { [gameId]: { game, color, moments, results, at } }
const saved = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
function saveReview(id, review) {
  const all = saved();
  all[id] = review;
  // keep the 30 most recent reviews
  const ids = Object.keys(all).sort((a, b) => (all[b].at || 0) - (all[a].at || 0));
  for (const old of ids.slice(30)) delete all[old];
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}
const coachUser = () => store.getSettings().coachUser || getAuth()?.username || '';

const KIND_LABEL = { blunder: 'Blunder', mistake: 'Mistake', inaccuracy: 'Inaccuracy', missed: 'Missed chance', strategy: 'Strategy', book: 'Repertoire' };
const KIND_CLASS = { blunder: 'bad', mistake: 'bad', inaccuracy: 'warn', missed: 'warn', strategy: 'info', book: 'info' };

// ---------- Lichess ----------
async function fetchGame(id) {
  // /game/export rejects the CORS preflight that the Authorization header triggers; the /api endpoint accepts it
  const res = await fetch(`${LICHESS}/api/games/export/_ids?moves=true&clocks=false&evals=false&opening=true`, {
    method: 'POST', body: id, headers: { Accept: 'application/x-ndjson', 'Content-Type': 'text/plain', ...authHeaders() },
  });
  if (res.status === 401) throw new Error(t('Lichess only shares this game with logged-in users. Connect your Lichess account in Settings and try again.'));
  if (!res.ok) throw new Error(t('Lichess responded {s}', { s: res.status }));
  const line = (await res.text()).split('\n').find(l => l.trim());
  if (!line) throw new Error(t('Game not found on Lichess.'));
  return slimGame(JSON.parse(line));
}
async function fetchRecent(user) {
  const res = await fetch(`${LICHESS}/api/games/user/${encodeURIComponent(user)}?max=20&moves=true&opening=true`, { headers: { Accept: 'application/x-ndjson', ...authHeaders() } });
  // Lichess only lists games for logged-in requests
  if (res.status === 404 || res.status === 401) throw new Error(getAuth() ? t('Lichess user not found.') : t('To list your games, connect your Lichess account in Settings. You can also paste a game link above.'));
  if (!res.ok) throw new Error(t('Lichess responded {s}', { s: res.status }));
  return (await res.text()).split('\n').filter(Boolean).map(l => slimGame(JSON.parse(l)));
}
function slimGame(g) {
  const p = c => ({ name: g.players?.[c]?.user?.name || g.players?.[c]?.aiLevel && `Stockfish ${g.players[c].aiLevel}` || '?', rating: g.players?.[c]?.rating || null });
  return { id: g.id, white: p('white'), black: p('black'), moves: (g.moves || '').split(' ').filter(Boolean), winner: g.winner || null, status: g.status, speed: g.speed, opening: g.opening?.name || '', at: g.createdAt || Date.now() };
}
const colorOf = (game, user) => {
  const u = (user || '').toLowerCase();
  if (game.white.name.toLowerCase() === u) return 'w';
  if (game.black.name.toLowerCase() === u) return 'b';
  return null;
};
function resultText(game, color) {
  if (!game.winner) return t('Draw');
  return (game.winner === 'white') === (color === 'w') ? t('Win') : t('Loss');
}

// ---------- page: choose a game ----------
export function viewCoach(app, go) {
  const reviews = Object.entries(saved()).sort((a, b) => b[1].at - a[1].at);
  const user = coachUser();
  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/">‹</a><h1>${t('Game review')}</h1><span></span></header>
    <main class="wrap">
      <p class="small muted">${t('Your coach goes through your game with you: it finds the key moments, asks you questions before giving answers, and explains the ideas in words — tactics and plans.')}</p>
      <section class="card form">
        <label for="cgUrl">${t('Lichess game link or ID')}</label>
        <input id="cgUrl" placeholder="https://lichess.org/AbCdEfGh" autocomplete="off">
        <button class="btn primary full" id="cgGo">${t('Review this game')}</button>
        <p class="small muted" id="cgStatus"></p>
      </section>
      <section class="card form">
        <label for="cgUser">${t('Your recent Lichess games')}</label>
        <div class="row gap"><input id="cgUser" value="${esc(user)}" placeholder="${t('Lichess username')}" autocomplete="off"><button class="btn ghost" id="cgLoad">${t('Load')}</button></div>
        <div id="cgList" class="game-list"></div>
      </section>
      ${reviews.length ? `<h2 class="section-title">${t('Reviewed games')}</h2>${reviews.map(([id, r]) => gameRow(r.game, r.color, id, r)).join('')}` : ''}
    </main>`;
  const $ = s => app.querySelector(s);
  const status = m => { $('#cgStatus').textContent = m; };
  $('#cgGo').onclick = () => {
    const id = parseGameId($('#cgUrl').value);
    if (!id) return status(t('That does not look like a Lichess game link.'));
    const color = /\/black\b/.test($('#cgUrl').value) ? 'b' : /\/white\b/.test($('#cgUrl').value) ? 'w' : '';
    go(`#/coach/${id}${color ? '/' + color : ''}`);
  };
  const load = async () => {
    const name = $('#cgUser').value.trim();
    if (!name) return;
    store.setSettings({ ...store.getSettings(), coachUser: name });
    $('#cgList').innerHTML = `<p class="small muted">${t('Loading…')}</p>`;
    try {
      const games = await fetchRecent(name);
      $('#cgList').innerHTML = games.length ? games.map(g => gameRow(g, colorOf(g, name), g.id)).join('') : `<p class="small muted">${t('No games found.')}</p>`;
    } catch (e) { $('#cgList').innerHTML = `<p class="small bad-text">${esc(e.message)}</p>`; }
  };
  $('#cgLoad').onclick = load;
  if (user) load();
}

function gameRow(g, color, id, review) {
  const me = color === 'b' ? g.black : g.white, opp = color === 'b' ? g.white : g.black;
  const res = color ? resultText(g, color) : '';
  const done = review ? `<span class="small ok-text">✓ ${tn(review.moments.length, '{n} moment', '{n} moments')}</span>` : '';
  return `
    <a class="card game-row" href="#/coach/${id}${color ? '/' + color : ''}">
      <div class="row"><strong>${color ? (color === 'w' ? '♔' : '♚') : ''} ${esc(me.name)} – ${esc(opp.name)}${opp.rating ? ` <span class="muted small">(${opp.rating})</span>` : ''}</strong>
        <span class="small ${res === t('Win') ? 'ok-text' : res === t('Loss') ? 'bad-text' : 'muted'}">${res}</span></div>
      <div class="small muted ellipsis">${esc(g.opening || '')}${g.speed ? ' · ' + esc(g.speed) : ''} · ${new Date(g.at).toLocaleDateString(locale())} ${done}</div>
    </a>`;
}

// ---------- the review ----------
export function viewCoachGame(app, id, colorParam, go) {
  let alive = true, engine = null, cg = null, cleanupMoment = () => {};
  const cleanup = () => { alive = false; cleanupMoment(); cg?.destroy(); engine?.destroy(); };

  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/coach">‹</a><h1 class="ellipsis" id="cgTitle">${t('Game review')}</h1><span class="small muted" id="cgStep"></span></header>
    <main id="cgMain"></main>`;
  const main = app.querySelector('#cgMain');
  const progress = (txt, pct) => {
    main.innerHTML = `<div class="wrap"><section class="card"><p>${esc(txt)}</p>${pct != null ? `<div class="bar big"><span style="width:${pct}%"></span></div>` : ''}<p class="small muted">${t('Your coach is looking at the game. This takes a moment and works offline once the engine is loaded.')}</p></section></div>`;
  };

  (async () => {
    try {
      let review = saved()[id];
      if (!review) {
        progress(t('Loading the game…'));
        const game = await fetchGame(id);
        let color = colorParam || colorOf(game, coachUser());
        if (!color) color = await askColor(main, game);
        if (!alive) return;
        engine = new Engine();
        review = await analyse(game, color, engine, progress, () => alive);
        if (!alive) return;
        saveReview(id, review);
      }
      app.querySelector('#cgTitle').textContent = `${review.game.white.name} – ${review.game.black.name}`;
      if (!review.moments.length) return showSummary(review, true);
      runMoments(review, 0);
    } catch (e) {
      if (alive) main.innerHTML = `<div class="wrap"><section class="card"><p class="bad-text">${esc(e.message)}</p><a class="btn ghost" href="#/coach">${t('Back')}</a></section></div>`;
    }
  })();

  function askColor(el, game) {
    return new Promise(resolve => {
      el.innerHTML = `<div class="wrap"><section class="card"><p>${t('Which side did you play?')}</p><div class="grid2">
        <button class="btn ghost" data-c="w">♔ ${esc(game.white.name)}</button><button class="btn ghost" data-c="b">♚ ${esc(game.black.name)}</button></div></section></div>`;
      el.onclick = e => { const b = e.target.closest('[data-c]'); if (b) { el.onclick = null; resolve(b.dataset.c); } };
    });
  }

  // --- one moment ---
  function runMoments(review, idx) {
    cleanupMoment();
    const mo = review.moments[idx];
    if (!mo) return showSummary(review);
    review.results ||= [];
    const total = review.moments.length;
    app.querySelector('#cgStep').textContent = `${idx + 1}/${total}`;
    const moveNo = Math.floor(mo.ply / 2) + 1;
    main.innerHTML = `
      <div class="train">
        <div class="row coach-head"><span class="badge ${KIND_CLASS[mo.kind]}">${t(KIND_LABEL[mo.kind])}</span>
          <span class="small muted">${t('Move {n}', { n: moveNo })} · ${review.color === 'w' ? t('You play White') : t('You play Black')}</span></div>
        <div class="board-wrap"><div class="board" id="board"></div></div>
        <div class="info">
          <div class="pfb" id="coNote"></div>
          <div class="coach-extra small" id="coExtra"></div>
        </div>
        <div class="actions" id="coActions"></div>
      </div>`;
    const $ = s => main.querySelector(s);
    cg?.destroy();
    let solved = false, tries = 0, hints = 0, busy = false, waiting = false;
    const chess = () => new Chess(mo.fen);
    const dests = () => {
      const d = new Map();
      for (const m of chess().moves({ verbose: true })) { if (!d.has(m.from)) d.set(m.from, []); d.get(m.from).push(m.to); }
      return d;
    };
    const reset = () => {
      cg.set({ fen: mo.fen, turnColor: toColor(review.color), lastMove: mo.lastMove ? [mo.lastMove.slice(0, 2), mo.lastMove.slice(2, 4)] : undefined,
        check: chess().inCheck() ? toColor(review.color) : false, movable: { color: solved ? undefined : toColor(review.color), dests: dests() } });
    };
    cg = Chessground($('#board'), {
      orientation: toColor(review.color), animation: { enabled: true, duration: 200 },
      highlight: { lastMove: true, check: true },
      movable: { free: false, showDests: true, events: { after: (o, d) => onMove(o, d) } },
      draggable: { showGhost: true },
    });
    const onResize = () => cg.redrawAll();
    window.addEventListener('resize', onResize);
    cleanupMoment = () => window.removeEventListener('resize', onResize);
    reset();

    const note = (html, state = 'play') => {
      $('#coNote').className = 'pfb ' + state;
      $('#coNote').innerHTML = `<div class="pfb-text">${html}</div>`;
    };
    const question = () => note(`<strong>${esc(questionFor(mo.lesson, { color: review.color }))}</strong>${mo.lesson === 'book' && mo.book ? `<em>${esc(mo.book.opening)}</em>` : ''}`);
    const actions = () => {
      const prev = idx > 0 ? `<button class="btn ghost" id="coPrev">‹ ${t('Previous')}</button>` : '';
      $('#coActions').innerHTML = solved
        ? `${prev}<button class="btn ghost" id="coLine">▶ ${t('Show the line')}</button><button class="btn primary" id="coNext">${idx + 1 < total ? t('Next moment') + ' ›' : t('Summary') + ' ›'}</button>`
        : waiting
          ? `${prev}<button class="btn primary" id="coRetry">↺ ${t('Try again')}</button><button class="btn ghost" id="coHint">💡 ${t('Hint')}</button><button class="btn ghost" id="coSol">${t('Show the solution')}</button>`
          : `${prev}<button class="btn ghost" id="coHint">💡 ${t('Hint')}</button><button class="btn ghost" id="coSol">${t('Show the solution')}</button><button class="btn ghost" id="coSkip">${t('Skip')}</button>`;
      if (idx > 0) $('#coPrev').onclick = () => runMoments(review, idx - 1);
      if (solved) {
        $('#coNext').onclick = () => runMoments(review, idx + 1);
        $('#coLine').onclick = playLine;
        return;
      }
      $('#coHint').onclick = () => { if (waiting) retry(); hint(); };
      $('#coSol').onclick = () => finish(false, true);
      if (waiting) $('#coRetry').onclick = () => { retry(); question(); };
      else $('#coSkip').onclick = () => { review.results[idx] = review.results[idx] ?? 'skipped'; saveReview(id, review); runMoments(review, idx + 1); };
    };
    question();
    actions();

    // after a wrong try the move (and the opponent's answer) stay on the board until "Try again"
    function retry() {
      waiting = false;
      cg.setAutoShapes([]);
      reset();
      actions();
    }
    function wrongTry(c, reply) {
      waiting = true;
      cg.set({ movable: { color: undefined } });
      if (reply) setTimeout(() => {
        if (!alive || !waiting) return;
        let m;
        try { m = c.move({ from: reply.slice(0, 2), to: reply.slice(2, 4), promotion: reply[4] }); } catch { return; }
        sound(m.captured ? 'capture' : 'move');
        cg.set({ fen: c.fen(), lastMove: [m.from, m.to], turnColor: toColor(c.turn()), check: c.inCheck() ? toColor(c.turn()) : false });
      }, 500);
      actions();
    }

    function hint() {
      hints++;
      const shapes = [];
      if (hints === 1) {
        let txt;
        if (mo.lesson === 'threat' && mo.threat) {
          shapes.push({ orig: mo.threat.uci.slice(0, 2), dest: mo.threat.uci.slice(2, 4), brush: 'red' });
          txt = t('If it were your opponent\'s move, they would play {m}: {why}', { m: san(mo.threat.san), why: mo.threat.text });
        } else if (mo.lesson === 'hanging' && mo.hanging) {
          shapes.push({ orig: mo.hanging.square, brush: 'red' });
          txt = t('Look at your {piece} on {sq}.', { piece: t(mo.hanging.typeName + '|piece'), sq: mo.hanging.square });
        } else if (mo.lesson === 'mate-danger' || mo.lesson === 'tactic-allowed') {
          shapes.push({ orig: mo.refute.uci.slice(0, 2), dest: mo.refute.uci.slice(2, 4), brush: 'red' });
          txt = t('In the game, your opponent answered with {m}. Your move has to prevent that.', { m: san(mo.refute.san) });
        } else if (mo.lesson === 'tactic-missed' && mo.target) {
          shapes.push({ orig: mo.target, brush: 'yellow' });
          txt = t('Look at the square {sq}.', { sq: mo.target });
        } else if (mo.lesson === 'strategy' && mo.ideaHint) {
          txt = mo.ideaHint;
        } else {
          shapes.push({ orig: mo.best.uci.slice(0, 2), brush: 'green' });
          txt = t('Think about a move with {piece} on {sq}.', { piece: thePiece(new Chess(mo.fen).get(mo.best.uci.slice(0, 2)).type), sq: mo.best.uci.slice(0, 2) });
        }
        $('#coExtra').innerHTML = `💡 ${esc(txt)}`;
      } else {
        shapes.push({ orig: mo.best.uci.slice(0, 2), dest: mo.best.uci.slice(2, 4), brush: 'green' });
        $('#coExtra').innerHTML = `💡 ${esc(t('The arrow shows the move. Can you see why it works?'))}`;
      }
      cg.setAutoShapes(shapes);
    }

    async function onMove(orig, dest) {
      if (solved || busy || waiting) { reset(); return; }
      const c = chess();
      const piece = c.get(orig);
      const promo = piece?.type === 'p' && (dest[1] === '8' || dest[1] === '1') ? 'q' : '';
      const uci = orig + dest + promo;
      let mv;
      try { mv = c.move({ from: orig, to: dest, promotion: promo || undefined }); } catch { reset(); return; }
      sound(mv.captured ? 'capture' : 'move');
      tries++;
      if (mo.good.includes(uci)) return finish(true, false, null, true);
      if (uci === mo.played) {
        note(`<strong>${t('That is what you played in the game.')}</strong><em>${esc(mo.refute.text)}</em>`, 'bad');
        return wrongTry(c, mo.refute.uci);
      }
      if (mo.lesson === 'book') {
        note(`<strong>${t('That is not the move from your tree.')}</strong><em>${t('Try again or look at the solution.')}</em>`, 'warn');
        return wrongTry(c, null);
      }
      busy = true;
      note(`<strong>${t('Let me check that move…')}</strong>`);
      engine ||= new Engine();
      const r = (await engine.search(c.fen(), { multipv: 1, movetime: TRY_MS }))[0];
      busy = false;
      if (!alive) return;
      const mine = r ? 100 - winPct(r) : 50;
      const diff = mo.bestWp - mine;
      if (diff <= 4) return finish(true, false, uci, true);
      const reply = r?.pv?.[0];
      let why = '';
      if (reply) {
        const out = lineOutcome(c.fen(), r.pv, r.mate != null ? r.mate : null, 8, r.cp);
        const s = new Chess(c.fen()).move({ from: reply.slice(0, 2), to: reply.slice(2, 4), promotion: reply[4] }).san;
        why = out.kind !== 'none'
          ? t('After {m}, {what}.', { m: san(s), what: out.text })
          : t('Your opponent answers {m} and is better.', { m: san(s) });
      }
      if (diff <= 12) note(`<strong>${t('Not bad, but there is something better.')}</strong><em>${esc(why)}</em>`, 'warn');
      else note(`<strong>${t('That has a problem.')}</strong><em>${esc(why)}</em>`, 'bad');
      wrongTry(c, reply);
    }

    // keepMove: the user's (good) move stays on the board; otherwise the best move is played from the start
    function finish(correct, shown = false, alt = null, keepMove = false) {
      solved = true;
      waiting = false;
      review.results[idx] = correct ? (tries === 1 && !hints ? 'first' : 'solved') : 'shown';
      saveReview(id, review);
      cg.setAutoShapes([]);
      if (keepMove) cg.set({ movable: { color: undefined } });
      else {
        reset();
        cg.set({ movable: { color: undefined } });
        setTimeout(() => {
          if (!alive) return;
          const c = chess();
          const u = mo.best.uci;
          let m;
          try { m = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); } catch { return; }
          sound(m.captured ? 'capture' : 'move');
          cg.set({ fen: c.fen(), lastMove: [m.from, m.to], check: c.inCheck() ? toColor(c.turn()) : false });
        }, 300);
      }
      const head = correct ? (alt ? t('Good move! The engine slightly prefers {m}.', { m: san(mo.best.san) }) : t('Excellent!')) : t('The best move was {m}.', { m: san(mo.best.san) });
      const lesson = LESSONS[mo.lesson];
      note(`<strong>${esc(head)}</strong><em>${esc(mo.best.text)}</em>`, correct ? 'ok' : 'failed');
      const extra = [];
      if (mo.played && mo.lesson !== 'book') extra.push(`<p><b>${t('In the game')}:</b> ${esc(t('you played {m}.', { m: san(mo.playedSan) }))} ${esc(mo.refute.text)}</p>`);
      for (const d of mo.damage || []) extra.push(`<p>⚠️ ${esc(d)}</p>`);
      if (mo.book) extra.push(`<p>📖 <a href="${mo.book.href}">${t('Review this line in your {o} tree', { o: esc(mo.book.opening) })}</a></p>`);
      if (lesson) extra.push(`<p class="lesson">🎓 <b>${t(lesson.title)}.</b> ${t(lesson.tip)}</p>`);
      $('#coExtra').innerHTML = extra.join('');
      actions();
      void shown;
    }

    function playLine() {
      const c = chess();
      const pv = mo.best.pv.slice(0, 6);
      let i = 0;
      cg.setAutoShapes([]);
      const step = () => {
        if (!alive || i >= pv.length) return;
        const u = pv[i++];
        let m;
        try { m = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); } catch { return; }
        sound(m.captured ? 'capture' : 'move');
        cg.set({ fen: c.fen(), lastMove: [m.from, m.to], check: c.inCheck() ? toColor(c.turn()) : false });
        setTimeout(step, 700);
      };
      step();
    }
  }

  // --- summary ---
  function showSummary(review, empty = false) {
    cleanupMoment();
    app.querySelector('#cgStep').textContent = '';
    const res = review.results || [];
    const first = res.filter(r => r === 'first').length, solvedN = res.filter(r => r === 'solved').length;
    const counts = {};
    for (const m of review.moments) counts[m.lesson] = (counts[m.lesson] || 0) + 1;
    const tactical = review.moments.filter(m => !['book', 'positional', 'strategy'].includes(m.lesson));
    main.innerHTML = `
      <div class="wrap">
        <section class="card">
          <h2>${t('Summary')}</h2>
          ${empty ? `<p>${t('No big mistakes in this game: well played! Your coach found nothing important to review.')}</p>` : `
          <p>${t('You found {a} of {n} moments on the first try, and {b} more with help.', { a: first, n: review.moments.length, b: solvedN })}</p>`}
        </section>
        ${Object.keys(counts).length ? `<section class="card"><h3>${t('What to work on')}</h3><ul class="plans">${Object.entries(counts).sort((a, b) => b[1] - a[1])
          .map(([k, n]) => `<li><b>${t(LESSONS[k].title)}</b> (${n}) — ${t(LESSONS[k].tip)}</li>`).join('')}</ul></section>` : ''}
        ${review.moments.length ? `<section class="card"><h3>${t('Moments')}</h3>${review.moments.map((m, i) => `
          <button class="branch moment-row" data-i="${i}"><span>${t('Move {n}', { n: Math.floor(m.ply / 2) + 1 })}</span>
            <span class="badge ${KIND_CLASS[m.kind]}">${t(KIND_LABEL[m.kind])}</span>
            <span>${res[i] === 'first' ? '✅' : res[i] === 'solved' ? '☑️' : res[i] === 'shown' ? '👀' : '·'}</span></button>`).join('')}</section>` : ''}
        <div class="grid2">
          ${tactical.length ? `<button class="btn primary" id="cgSet">🧩 ${t('Train these positions')}</button>` : ''}
          <button class="btn ghost" id="cgAgain">↺ ${t('Review again')}</button>
        </div>
        <p class="small muted" id="cgSetStatus"></p>
        <a class="btn ghost full" href="https://lichess.org/${id}" target="_blank" rel="noopener">${t('Open the game on Lichess')}</a>
      </div>`;
    main.querySelectorAll('[data-i]').forEach(b => { b.onclick = () => runMoments(review, +b.dataset.i); });
    main.querySelector('#cgAgain').onclick = () => { review.results = []; saveReview(id, review); runMoments(review, 0); };
    const setBtn = main.querySelector('#cgSet');
    if (setBtn) setBtn.onclick = async () => {
      setBtn.disabled = true;
      const st = m => { main.querySelector('#cgSetStatus').textContent = m; };
      engine ||= new Engine();
      const items = [];
      for (const [k, m] of tactical.entries()) {
        st(t('Preparing position {i} of {n}…', { i: k + 1, n: tactical.length }));
        const tree = await solvePosition(engine, m.fen, { movetime: 1200 });
        if (!alive) return;
        if (tree?.length) items.push({ pgn: true, n: k + 1, fen: m.fen, tree, label: `${review.game.white.name} – ${review.game.black.name}, ${t('move {n}', { n: Math.floor(m.ply / 2) + 1 })}` });
      }
      if (!items.length) { st(t('No positions could be prepared.')); setBtn.disabled = false; return; }
      const set = store.addSet({ id: store.uid(), name: `${t('Review')}: ${review.game.white.name} – ${review.game.black.name}`, source: 'pgn', order: 'random', targetCycles: 5, createdAt: Date.now(), items, cycles: [] });
      go('#/set/' + set.id);
    };
  }

  return cleanup;
}

// ---------- the analysis ----------
async function analyse(game, color, engine, progress, isAlive) {
  const { fens, moves } = replay(game.moves);
  const evals = [];
  const n = fens.length;
  for (let i = 0; i < n; i++) {
    if (!isAlive()) return null;
    progress(t('Looking at move {i} of {n}…', { i: Math.ceil((i + 1) / 2), n: Math.ceil(n / 2) }), Math.round(100 * i / n));
    const c = new Chess(fens[i]);
    // a finished game: the side to move is mated (or it is a draw)
    evals.push(c.isGameOver() ? (c.isCheckmate() ? { mate: -1, cp: null, pv: [] } : { cp: 0, mate: null, pv: [] }) : (await engine.search(fens[i], { multipv: 1, movetime: FAST_MS }))[0]);
  }
  const picked = pickMoments({ fens, moves, evals, color });
  const book = await bookMoment(game.moves, color);
  if (book && !picked.some(m => m.ply === book.ply)) picked.push({ ply: book.ply, kind: 'book', loss: 0, best: book.uci, played: moves[book.ply].uci, book });
  picked.sort((a, b) => a.ply - b.ply);

  const moments = [];
  for (const [k, p] of picked.entries()) {
    if (!isAlive()) return null;
    progress(t('Preparing moment {i} of {n}…', { i: k + 1, n: picked.length }), 100);
    moments.push(await deepMoment(engine, fens, moves, p, color));
  }
  return { game, color, moments, results: [], at: Date.now() };
}

// Everything the coach needs to talk about one moment.
async function deepMoment(engine, fens, moves, p0, color) {
  let p = p0;
  const fen = fens[p.ply];
  const lines = p.kind === 'book' ? [] : await engine.search(fen, { multipv: 3, movetime: DEEP_MS });
  let bestUci = p.kind === 'book' ? p.best : lines[0]?.pv[0] || p.best;
  if (p.kind === 'strategy' && p.best !== bestUci) {
    // the strategic move must still be good after a deeper look
    const sl = lines.find(l => l.pv[0] === p.best);
    if (sl && winPct(lines[0]) - winPct(sl) <= 4) bestUci = p.best;
    else p = { ...p, kind: 'inaccuracy' };
  }
  const best = lines.find(l => l.pv[0] === bestUci) || lines[0] || { pv: [bestUci], cp: 0 };
  const bestWp = winPct(best);
  const good = [bestUci, ...lines.filter(l => bestWp - winPct(l) <= 4).map(l => l.pv[0])];
  const sanOf = (f, u) => new Chess(f).move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }).san;
  const pieceOf = (f, u) => ({ p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }[new Chess(f).get(u.slice(0, 2)).type]);

  // what the best move does
  const bestOut = lineOutcome(fen, best.pv || [bestUci], best.mate != null ? best.mate : null, 8, best.cp);
  const bestSan = sanOf(fen, bestUci);
  const ideas = strategicIdeas(fen, bestUci);
  let bestText = `${san(bestSan)} ${describeMove(fen, bestUci)}.`;
  if (bestOut.kind !== 'none') bestText += ' ' + t('If your opponent does not react, {what}.', { what: bestOut.text });
  else bestText += ' ' + (ideas[0]?.text || quietReason(fen, bestUci));
  if (ideas.length > 1 && bestOut.kind === 'none') bestText += ' ' + ideas[1].text;

  // what was wrong with the game move: the opponent's best reply
  const playedSan = moves[p.ply].san;
  let refute = { uci: '', san: '', text: '' }, refuteOut = { kind: 'none' };
  if (p.kind !== 'book') {
    const afterFen = fens[p.ply + 1];
    const r = (await engine.search(afterFen, { multipv: 1, movetime: REFUTE_MS }))[0];
    if (r?.pv?.[0]) {
      refuteOut = lineOutcome(afterFen, r.pv, r.mate != null ? r.mate : null, 8, r.cp);
      const rs = sanOf(afterFen, r.pv[0]);
      refute = {
        uci: r.pv[0], san: rs,
        text: refuteOut.kind !== 'none'
          ? t('Your opponent can answer {m} ({how}), and {what}.', { m: san(rs), how: describeMove(afterFen, r.pv[0]), what: refuteOut.text })
          : t('After {m} your opponent gets the better position.', { m: san(rs) }),
      };
    }
  }

  // was there already a threat before the user's move?
  let threat = null;
  const nf = nullMoveFen(fen);
  if (nf && p.kind !== 'book') {
    const th = (await engine.search(nf, { multipv: 1, movetime: THREAT_MS }))[0];
    if (th?.pv?.[0]) {
      const out = lineOutcome(nf, th.pv, th.mate != null ? th.mate : null, 8, th.cp);
      if (out.kind === 'mate' || (out.kind === 'material' && out.gain >= 2)) {
        const ts = sanOf(nf, th.pv[0]);
        // only if the user's game move did not deal with it
        if (refuteOut.kind !== 'none') threat = { uci: th.pv[0], san: ts, kind: out.kind, text: `${describeMove(nf, th.pv[0])}, ${out.text}` };
      }
    }
  }
  // quiet moments: what did the game move allow, and does the best move prevent it?
  let prevents = '';
  if (p.kind !== 'book' && refute.uci && refuteOut.kind === 'none') {
    const afterBest = new Chess(fen);
    afterBest.move({ from: bestUci.slice(0, 2), to: bestUci.slice(2, 4), promotion: bestUci[4] });
    if (!afterBest.isGameOver()) {
      const rb = (await engine.search(afterBest.fen(), { multipv: 1, movetime: TRY_MS }))[0];
      const legal = afterBest.moves({ verbose: true }).some(m => m.from + m.to + (m.promotion || '') === refute.uci);
      if (rb?.pv?.[0] && rb.pv[0] !== refute.uci) {
        prevents = legal
          ? t('Your move allowed {m}; after {b}, that idea no longer works so well.', { m: san(refute.san), b: san(bestSan) })
          : t('Your move allowed {m}; after {b}, it is not even possible.', { m: san(refute.san), b: san(bestSan) });
      }
    }
    // a big swing without material: an attack or a strong initiative
    const swing = p.loss;
    if (swing >= 15) refute.text = t('After {m} your opponent gets a very strong attack or initiative, even without winning material at once.', { m: san(refute.san) });
  }
  const hang = hangingPieces(new Chess(fen), color);
  const hanging = hang.find(h => refute.uci && refute.uci.slice(2, 4) === h.square) || null;
  if (p.kind === 'strategy' && (threat || refuteOut.kind !== 'none')) p = { ...p, kind: 'inaccuracy' }; // not a quiet position after all
  const lesson = lessonFor(p.kind, { best: bestOut, refute: refuteOut, hangingBefore: !!hanging, threat });

  // a target for the hint in tactical moments: the first square the best line captures on
  let target = null;
  { const c = new Chess(fen); for (const u of (best.pv || []).slice(0, 4)) { try { const m = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); if (m.captured && m.color === color) { target = m.to; break; } } catch { break; } } }
  const ideaHint = ideas[0] ? ideaHintText(ideas[0].kind) : '';

  const lastMove = p.ply > 0 ? moves[p.ply - 1].uci : null;
  return {
    ply: p.ply, kind: p.kind, lesson, fen, lastMove, played: moves[p.ply].uci, playedSan,
    best: { uci: bestUci, san: bestSan, pv: best.pv || [bestUci], text: bestText, pieceName: pieceOf(fen, bestUci) },
    bestWp, good: [...new Set(good)], refute, threat,
    hanging: hanging ? { square: hanging.square, typeName: { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen' }[hanging.type] } : null,
    target, ideaHint,
    damage: p.kind === 'book' ? [] : [prevents, ...strategicDamage(fen, moves[p.ply].uci).map(d => d.text)].filter(Boolean),
    book: p.book ? { opening: p.book.opening, href: p.book.href } : null,
  };
}

function ideaHintText(kind) {
  return {
    restrict: t('Is there an enemy piece with few squares? Could you take away the ones it has left?'),
    outpost: t('Look for a square in the enemy half where a knight would be protected by a pawn and could never be chased away.'),
    diagonal: t('One of your bishops is blocked by your own pawns. Can you free it?'),
    'open-file': t('Is there an open file? Who controls it?'),
    'half-open': t('Look at the files with only enemy pawns: a rook there puts pressure on them.'),
    tie: t('Can a rook attack a pawn that only pieces can defend?'),
    seventh: t('Can a rook reach the seventh rank?'),
    double: t('Two rooks on the same file are twice as strong.'),
    battery: t('Can your queen and a bishop line up against the enemy king?'),
    break: t('Which pawn break opens lines for your pieces?'),
    passed: t('Can you create a passed pawn?'),
    'push-passed': t('Your passed pawn wants to move forward.'),
    'bad-bishop': t('Which of your bishops is worse? Can you trade it?'),
    simplify: t('You are ahead in material: which trade brings you closer to a won endgame?'),
    structure: t('Can an exchange damage your opponent\'s pawn structure?'),
    castle: t('Is your king safe in the centre?'),
    develop: t('Which pieces are still at home?'),
    'king-activity': t('In the endgame, what is your king doing?'),
    activity: t('Which of your pieces is the least active?'),
    centralise: t('A knight on the edge controls few squares. Where would it be better?'),
  }[kind] || '';
}

// The first move where the user left one of their opening trees (only for the side they played).
async function bookMoment(sans, color) {
  const candidates = [];
  for (const o of OPENINGS) {
    if (o.side !== color) continue;
    for (const l of o.lines) {
      if (!l.tree) continue;
      const lm = l.moves.split(' ');
      if (lm.slice(0, 2).join(' ') !== sans.slice(0, 2).join(' ')) continue;
      candidates.push({ o, l });
    }
  }
  let best = null;
  for (const { o, l } of candidates) {
    let tree;
    try { tree = await loadTree(l.tree.file); } catch { continue; }
    if (tree.root.some((s, i) => sans[i] !== s)) continue;
    let ns = tree.c, i = tree.root.length;
    while (i < sans.length && ns?.length) {
      const myTurn = (i % 2 === 0) === (color === 'w');
      if (myTurn) {
        const node = ns[0];
        if (node.s !== sans[i]) {
          if (!best || i > best.ply) best = { ply: i, uci: node.u, san: node.s, opening: tx(o.name), href: `#/tree/${o.id}/${l.id}` };
          break;
        }
        ns = node.c; i++;
      } else {
        const node = ns.find(x => x.s === sans[i]);
        if (!node) break;
        ns = node.c; i++;
      }
    }
  }
  return best;
}
