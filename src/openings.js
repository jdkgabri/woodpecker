// Opening courses: catalogue, opening page, step-by-step study and move drill.
import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { OPENINGS, findOpening } from './openings-data.js';
import * as store from './store.js';
import { pickPuzzlesFromFile } from './puzzles.js';
import { openAnalysis } from './analysis.js';
import { sound } from './sound.js';
import { t, tn, lang, san } from './i18n.js';
import { treeMemory } from './opening-tree.js';
import { OPENING_VIDEOS } from './opening-videos.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tx = obj => (obj ? obj[lang()] ?? obj.en : '');
const toColor = c => (c === 'w' ? 'white' : 'black');
const allLines = o => [...o.lines, ...(o.traps || [])];

// Puzzle groups (files in public/openings/puzzles/) offered for training sets
const GROUPS = {
  'italian': { en: 'All Italian lines', es: 'Toda la Italiana' },
  'italian-giuoco': { en: 'Giuoco Piano / Pianissimo', es: 'Giuoco Piano / Pianissimo' },
  'italian-two-knights': { en: 'Two Knights (incl. Fried Liver)', es: 'Dos Caballos (incl. Fegatello)' },
  'italian-evans': { en: 'Evans Gambit', es: 'Gambito Evans' },
  'queens-gambit': { en: "All Queen's Gambit lines", es: 'Todo el Gambito de Dama' },
  'qg-declined': { en: 'Declined', es: 'Rehusado' },
  'qg-accepted': { en: 'Accepted', es: 'Aceptado' },
  'qg-slav': { en: 'Slav', es: 'Eslava' },
  'sicilian': { en: 'All Sicilian lines', es: 'Toda la Siciliana' },
  'sicilian-najdorf': { en: 'Najdorf', es: 'Najdorf' },
  'sicilian-dragon': { en: 'Dragon', es: 'Dragón' },
  'sicilian-anti': { en: 'Anti-Sicilians', es: 'Antisicilianas' },
  'black-lion': { en: 'Black Lion and Old Indian', es: 'Black Lion e India Antigua' },
};
const groupsOf = o => [o.puzzles, ...new Set(o.lines.map(l => l.puzzles).filter(g => g && g !== o.puzzles))];

// SAN with move numbers: "1.e4 e5 2.Nf3"
function numbered(sans, from = 0) {
  return sans.map((s, i) => {
    const ply = from + i;
    if (ply % 2 === 0) return `${ply / 2 + 1}.${san(s)}`;
    return i === 0 ? `${(ply + 1) / 2}...${san(s)}` : san(s);
  });
}

// Drill statistics, kept on this device: { 'opening/line': { runs, perfect, last } }
const DRILL_KEY = 'wp:drill:v1';
const drillStats = () => { try { return JSON.parse(localStorage.getItem(DRILL_KEY) || '{}'); } catch { return {}; } };
function saveDrill(key, mistakes) {
  const all = drillStats();
  const s = all[key] || { runs: 0, perfect: 0 };
  s.runs++; if (!mistakes) s.perfect++; s.last = mistakes; s.at = Date.now();
  all[key] = s;
  try { localStorage.setItem(DRILL_KEY, JSON.stringify(all)); } catch {}
}

// ---------- catalogue ----------
export function viewOpenings(app) {
  const card = o => `
    <a class="card set-card" href="#/opening/${o.id}">
      <div class="row"><strong>${esc(tx(o.name))}</strong><span class="muted small">${o.eco}</span></div>
      <p class="small muted">${esc(tx(o.summary))}</p>
      <div class="small muted">${tn(o.lines.length, '{n} line', '{n} lines')}${o.traps?.length ? ' · ' + tn(o.traps.length, '{n} trap', '{n} traps') : ''}</div>
    </a>`;
  // White openings by White's first move, Black openings by the move they answer
  const first = o => o.vs || o.lines[0].moves.split(' ')[0];
  const section = (title, keep, sub) => {
    const list = OPENINGS.filter(keep);
    return list.length ? `<h2 class="section-title">${title} <span class="muted small">· ${sub}</span></h2>${list.map(card).join('')}` : '';
  };
  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/">‹</a><h1>${t('Openings')}</h1><span></span></header>
    <main class="wrap">
      <p class="small muted">${t('Ideas, plans and main lines explained move by move, with drills and tactics from each opening.')}</p>
      ${section(t('With White'), o => o.side === 'w' && first(o) === 'e4', '1.e4')}
      ${section(t('With White'), o => o.side === 'w' && first(o) !== 'e4', t('1.d4 and others'))}
      ${section(t('With Black'), o => o.side === 'b' && first(o) === 'e4', t('against 1.e4'))}
      ${section(t('With Black'), o => o.side === 'b' && first(o) !== 'e4', t('against 1.d4 and others'))}
    </main>`;
}

// ---------- opening page ----------
// Video links imported in Settings, kept on this device only: { openingId: url }. They win over the bundled ones.
const LOCAL_VIDEO_KEY = 'wp:video:v1';
export const localVideos = () => { try { return JSON.parse(localStorage.getItem(LOCAL_VIDEO_KEY) || '{}'); } catch { return {}; } };
export function clearLocalVideos() { try { localStorage.removeItem(LOCAL_VIDEO_KEY); } catch {} }
// Accepts JSON or the opening-videos.js format ("id": 'url', with comments). Returns { added, skipped }.
export function importLocalVideos(text) {
  let pairs;
  try { pairs = Object.entries(JSON.parse(text)); } catch {
    pairs = [...text.matchAll(/["']?([\w-]+)["']?\s*:\s*(["'`])(.*?)\2/g)].map(m => [m[1], m[3]]);
  }
  const ids = new Set(OPENINGS.map(o => o.id));
  const all = {};
  let skipped = 0;
  for (const [id, url] of pairs) {
    if (typeof url !== 'string' || !url.trim()) continue;
    if (ids.has(id) && videoPlayer(url.trim())) all[id] = url.trim(); else skipped++;
  }
  if (!Object.keys(all).length) throw new Error(t('No valid video links found in the file.'));
  try { localStorage.setItem(LOCAL_VIDEO_KEY, JSON.stringify(all)); } catch {}
  return { added: Object.keys(all).length, skipped };
}

// YouTube and Vimeo links play in their embed; anything else goes to a <video> element.
function videoPlayer(url) {
  let u;
  try { u = new URL(url); } catch { return ''; }
  if (!/^https?:$/.test(u.protocol)) return '';
  const host = u.hostname.replace(/^(www|m)\./, '');
  const yt = host === 'youtu.be' ? u.pathname.slice(1) : host.endsWith('youtube.com') ? (u.searchParams.get('v') || u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]+)/)?.[1]) : null;
  const vimeo = host === 'vimeo.com' ? u.pathname.match(/^\/(\d+)/)?.[1] : null;
  const frame = src => `<div class="video-frame"><iframe src="${esc(src)}" allow="fullscreen; picture-in-picture; encrypted-media" allowfullscreen loading="lazy"></iframe></div>`;
  if (yt) return frame(`https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}`);
  if (vimeo) return frame(`https://player.vimeo.com/video/${vimeo}`);
  return `<video class="video-frame" src="${esc(u.href)}" controls preload="metadata" playsinline></video>`;
}

export function viewOpening(app, id, go) {
  const o = findOpening(id);
  if (!o) return go('#/openings');
  const other = o.side === 'w' ? 'b' : 'w';
  const stats = drillStats();
  const lineCard = (l, trap) => {
    const s = stats[`${o.id}/${l.id}`];
    const sans = l.moves.split(' ');
    const preview = numbered(sans.slice(0, 8)).join(' ') + (sans.length > 8 ? ' …' : '');
    const mem = l.tree ? Object.values(treeMemory(`${o.id}/${l.id}`)) : [];
    const treeBox = l.tree ? `
        <div class="${l.treeOnly ? '' : 'tree-box'}">
          ${l.treeOnly ? '' : `<p class="small"><strong>🌳 ${t('All branches')}</strong> · <span class="muted">${t('The replies club players really choose, with the best answer to each.')}</span></p>`}
          ${mem.length ? `<p class="small muted">${tn(mem.length, '{n} branch practised', '{n} branches practised')} · ${tn(mem.filter(m => m.box >= 2).length, '{n} mastered', '{n} mastered')}</p>` : ''}
          <div class="grid2">
            <a class="btn ghost" href="#/tree/${o.id}/${l.id}">🌳 ${t('Explore')}</a>
            <a class="btn primary" href="#/tdrill/${o.id}/${l.id}">♟ ${t('Practise branches')}</a>
          </div>
        </div>` : '';
    return `
      <div class="card">
        <strong>${esc(tx(l.name))}</strong>
        <p class="small muted mono">${esc(preview)}</p>
        ${l.treeOnly ? `<p class="small muted">${esc(tx(l.summary) || t('The replies club players really choose, with the best answer to each.'))}</p>` : `
        ${s ? `<p class="small ${s.last ? 'muted' : 'ok-text'}">${tn(s.runs, 'Practised {n} time', 'Practised {n} times')} · ${s.last ? tn(s.last, 'last time {n} mistake', 'last time {n} mistakes') : t('last time without mistakes')}</p>` : ''}
        <div class="grid2">
          <a class="btn ghost" href="#/opening/${o.id}/${l.id}">📖 ${t('Study')}</a>
          ${trap ? '' : `<a class="btn primary" href="#/drill/${o.id}/${l.id}">♟ ${t('Practise')}</a>`}
        </div>`}
        ${treeBox}
      </div>`;
  };
  const plans = (op, side) => op.plans?.[side] ? `
    <h3>${side === o.side ? t('Your plans') : t("The opponent's plans")}</h3>
    <ul class="plans">${tx(op.plans[side]).map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : '';
  const ideas = op => `
      <section class="card">
        ${tx(op.intro).map(p => `<p>${esc(p)}</p>`).join('')}
        ${op.structure ? `<h3>${t('Pawn structure')}</h3><p>${esc(tx(op.structure))}</p>` : ''}
        ${plans(op, o.side)}${plans(op, other)}
      </section>`;
  const linesOf = (lines, traps) => `
      ${lines.map(l => lineCard(l, false)).join('')}
      ${traps.length ? `<h3 class="section-title">${t('Traps')}</h3>${traps.map(l => lineCard(l, true)).join('')}` : ''}`;
  // grouped openings: a general intro, then each part with its ideas and lines
  const body = o.parts ? `
      <section class="card">
        <div class="row small muted"><span>${o.side === 'w' ? t('You play White') : t('You play Black')}</span><span>ECO ${o.eco}</span></div>
        ${tx(o.intro).map(p => `<p>${esc(p)}</p>`).join('')}
        <p class="small">${o.parts.map(p => `<a href="" data-part="${p.id}">${esc(tx(p.name))}</a>`).join(' · ')}</p>
      </section>
      ${o.parts.map(p => `
      <h2 class="section-title" id="part-${p.id}">${esc(tx(p.name))}</h2>
      ${ideas(p)}
      ${linesOf(o.lines.filter(l => l.part === p.id), (o.traps || []).filter(l => l.part === p.id))}`).join('')}` : `
      <section class="card">
        <div class="row small muted"><span>${o.side === 'w' ? t('You play White') : t('You play Black')}</span><span>ECO ${o.eco}</span></div>
        ${tx(o.intro).map(p => `<p>${esc(p)}</p>`).join('')}
      </section>
      <section class="card">
        <h2>${t('Pawn structure')}</h2>
        <p>${esc(tx(o.structure))}</p>
        ${plans(o, o.side)}${plans(o, other)}
      </section>
      <h2 class="section-title">${t('Main lines')}</h2>
      ${o.lines.map(l => lineCard(l, false)).join('')}
      ${o.traps?.length ? `<h2 class="section-title">${t('Traps')}</h2>${o.traps.map(l => lineCard(l, true)).join('')}` : ''}`;
  const videoUrl = localVideos()[o.id] || OPENING_VIDEOS[o.id];
  const video = videoUrl ? videoPlayer(videoUrl) : '';
  app.innerHTML = `
    <header class="top"><a class="icon-btn" href="#/openings">‹</a><h1 class="ellipsis">${esc(tx(o.name))}</h1><span></span></header>
    <main class="wrap">
      ${body}
      ${video ? `<h2 class="section-title">🎬 ${t('Video')}</h2><section class="card">${video}</section>` : ''}
      ${o.puzzles ? `
      <h2 class="section-title">${t('Tactics from this opening')}</h2>
      <section class="card form">
        <p class="small muted">${t('Puzzles from real games that started with this opening, where you play your side. Train them in cycles like any other set.')}</p>
        <label for="ogGroup">${t('Lines')}</label>
        <select id="ogGroup">${groupsOf(o).map(g => `<option value="${g}">${esc(tx(GROUPS[g]) || tx(o.groupNames?.[g]) || tx(o.name))}</option>`).join('')}</select>
        <div class="grid2">
          <div><label for="ogMin">${t('Min rating')}</label><input id="ogMin" type="number" min="400" max="3200" step="50" value="1000" inputmode="numeric"></div>
          <div><label for="ogMax">${t('Max rating')}</label><input id="ogMax" type="number" min="400" max="3200" step="50" value="2200" inputmode="numeric"></div>
        </div>
        <label for="ogN">${t('Number of puzzles')}</label>
        <input id="ogN" type="number" min="10" max="300" value="50" inputmode="numeric">
        <button class="btn primary full" id="ogCreate">${t('Create set')}</button>
        <p class="small muted" id="ogStatus"></p>
      </section>` : ''}
    </main>`;
  app.querySelectorAll('[data-part]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); app.querySelector('#part-' + el.dataset.part)?.scrollIntoView({ behavior: 'smooth' }); }));
  if (!o.puzzles) return;
  app.querySelector('#ogCreate').onclick = async e => {
    const btn = e.currentTarget;
    const status = m => { app.querySelector('#ogStatus').textContent = m; };
    const group = app.querySelector('#ogGroup').value;
    const min = +app.querySelector('#ogMin').value, max = +app.querySelector('#ogMax').value;
    const count = Math.max(10, Math.min(300, +app.querySelector('#ogN').value || 50));
    if (!(min > 0 && max >= min)) return status(t('The rating range is not valid.'));
    btn.disabled = true;
    try {
      status(t('Loading the collection…'));
      const used = new Set(store.sets().flatMap(s => s.items.map(i => i.id).filter(Boolean)));
      const r = await pickPuzzlesFromFile(`openings/puzzles/${group}.txt`, { min, max, count, avoid: used });
      if (!r.items.length) throw new Error(t('There are no puzzles in that range. Try a wider range.'));
      if (r.items.length < count && !confirm(t('Only {n} puzzles in that range. Create the set with {n}?', { n: r.items.length }))) { btn.disabled = false; return status(''); }
      const ratings = r.items.map(x => x.rating);
      const set = store.addSet({
        id: store.uid(), name: `${tx(o.name)} · ${tx(GROUPS[group]) || tx(o.groupNames?.[group]) || t('All lines')} (${min}–${max})`, source: 'opening', order: 'random', targetCycles: 5,
        createdAt: Date.now(), opening: { id: o.id, group, eloMin: Math.min(...ratings), eloMax: Math.max(...ratings) }, items: r.items, cycles: [],
      });
      go('#/set/' + set.id);
    } catch (err) {
      status(t('Error: {e}', { e: err.message }));
      btn.disabled = false;
    }
  };
}

// ---------- study and drill ----------
export function viewOpeningLine(app, id, lineId, mode, go) {
  const o = findOpening(id);
  const line = o && allLines(o).find(l => l.id === lineId);
  if (!line) { go('#/opening/' + id); return () => {}; }
  const drill = mode === 'drill' && !line.trap;
  const sans = line.moves.split(' ');
  const ucis = [];
  { const c = new Chess(); for (const s of sans) { const m = c.move(s); ucis.push(m.from + m.to + (m.promotion || '')); } }
  const lineIdx = o.lines.findIndex(l => l.id === line.id);
  const nextLine = !line.trap && o.lines[lineIdx + 1];

  app.innerHTML = `
    <div class="train">
      <header class="top"><a class="icon-btn" href="#/opening/${o.id}">‹</a>
        <h1 class="ellipsis">${drill ? '♟ ' : ''}${esc(tx(line.name))}</h1><span></span></header>
      <div class="board-wrap"><div class="board" id="board"></div></div>
      <div class="info">
        <div class="pfb" id="olNote"></div>
        <div class="movelist" id="olMoves"></div>
      </div>
      <div class="actions" id="olActions"></div>
    </div>`;
  const $ = s => app.querySelector(s);
  const cg = Chessground($('#board'), {
    orientation: toColor(o.side),
    animation: { enabled: true, duration: 200 },
    highlight: { lastMove: true, check: true },
    movable: { free: false, showDests: true, events: { after: (orig, dest) => userMove(orig, dest) } },
    draggable: { showGhost: true },
  });
  const onResize = () => cg.redrawAll();
  window.addEventListener('resize', onResize);

  let ply = 0, mistakes = 0, wrongHere = 0, timer = null, done = false;
  const position = n => { const c = new Chess(); for (let i = 0; i < n; i++) c.move(sans[i]); return c; };

  function draw(lastUci) {
    const c = position(ply);
    const myTurn = drill && !done && ply < sans.length && c.turn() === o.side;
    const dests = new Map();
    if (myTurn) for (const m of c.moves({ verbose: true })) { if (!dests.has(m.from)) dests.set(m.from, []); dests.get(m.from).push(m.to); }
    const lu = lastUci || (ply ? ucis[ply - 1] : null);
    cg.set({
      fen: c.fen(), turnColor: toColor(c.turn()), lastMove: lu ? [lu.slice(0, 2), lu.slice(2, 4)] : undefined,
      check: c.inCheck() ? toColor(c.turn()) : false,
      movable: { color: myTurn ? toColor(o.side) : undefined, dests },
    });
    // move list: in drill mode only what has been played
    const shown = drill ? ply : sans.length;
    $('#olMoves').innerHTML = numbered(sans.slice(0, shown)).map((s, i) =>
      `<button class="mv ${i + 1 === ply ? 'on' : ''}" data-ply="${i + 1}" ${drill ? 'disabled' : ''}>${esc(s)}</button>`).join(' ');
  }

  function note(html, state = 'play') {
    $('#olNote').className = 'pfb ' + state;
    $('#olNote').innerHTML = `<div class="pfb-text"><em class="note-text">${html}</em></div>`;
  }

  function studyNote() {
    const n = line.notes?.[ply];
    if (ply === 0) note(`<strong>${esc(tx(line.name))}</strong><br>${t('Use ▶ or the arrow keys to step through the moves.')}`);
    else note(`<strong>${esc(numbered([sans[ply - 1]], ply - 1)[0])}</strong>${n ? '<br>' + esc(tx(n)) : ''}`);
  }

  function studyActions() {
    $('#olActions').innerHTML = `
      <button class="btn ghost" id="first" aria-label="${t('First move')}">⏮</button>
      <button class="btn ghost" id="prev" aria-label="${t('Previous')}">◀</button>
      <button class="btn ghost" id="next" aria-label="${t('Next')}">▶</button>
      <button class="btn ghost" id="last" aria-label="${t('Last move')}">⏭</button>
      <button class="btn ghost" id="olAnalyse">🔍 ${t('Analyse')}</button>
      ${line.trap ? '' : `<a class="btn primary" href="#/drill/${o.id}/${line.id}">♟ ${t('Practise')}</a>`}`;
    const goTo = n => { const before = ply; ply = Math.max(0, Math.min(sans.length, n)); if (ply === before + 1) moveSound(ply - 1); draw(); studyNote(); };
    $('#first').onclick = () => goTo(0);
    $('#prev').onclick = () => goTo(ply - 1);
    $('#next').onclick = () => goTo(ply + 1);
    $('#last').onclick = () => goTo(sans.length);
    $('#olMoves').onclick = e => { const b = e.target.closest('[data-ply]'); if (b) goTo(+b.dataset.ply); };
    $('#olAnalyse').onclick = analyseLine;
    keys = e => {
      if (e.key === 'ArrowRight') goTo(ply + 1);
      if (e.key === 'ArrowLeft') goTo(ply - 1);
    };
  }

  // the analysis board opens at the current move, seen from the side that plays this opening
  function analyseLine() {
    openAnalysis({ fen: new Chess().fen(), solution: ucis, ply, orientation: toColor(o.side), label: t('Line:'), title: tx(line.name) });
  }

  function moveSound(i) {
    const c = position(i);
    const m = c.move(sans[i]);
    sound(m.captured ? 'capture' : 'move');
  }

  // ---- drill ----
  function opponentMoves() {
    clearTimeout(timer);
    const c = position(ply);
    if (ply >= sans.length) return finish();
    if (c.turn() === o.side) { draw(); drillNote(); return; }
    timer = setTimeout(() => { moveSound(ply); ply++; draw(); opponentMoves(); }, ply === 0 ? 300 : 450);
  }

  function drillNote(extra) {
    const prevNote = ply > 0 && line.notes?.[ply];
    note(`${extra || `<strong>${t('Your move')}</strong>`}${prevNote ? `<br><span class="muted">${esc(numbered([sans[ply - 1]], ply - 1)[0])}: ${esc(tx(prevNote))}</span>` : ''}`, extra ? 'bad' : 'play');
  }

  function userMove(orig, dest) {
    if (!drill || done) return;
    const c = position(ply);
    const piece = c.get(orig);
    const promo = piece?.type === 'p' && (dest[1] === '8' || dest[1] === '1') ? 'q' : '';
    const uci = orig + dest + promo;
    if (uci === ucis[ply]) {
      moveSound(ply);
      ply++; wrongHere = 0;
      cg.setAutoShapes([]);
      draw();
      opponentMoves();
      return;
    }
    mistakes++; wrongHere++;
    sound('move');
    setTimeout(() => draw(), 300);
    const hint = wrongHere >= 2;
    if (hint) cg.setAutoShapes([{ orig: ucis[ply].slice(0, 2), dest: ucis[ply].slice(2, 4), brush: 'green' }]);
    drillNote(`<strong>${t('Not this move')}</strong> — ${hint ? t('the line continues with the arrow.') : t('try again.')}`);
  }

  function finish() {
    done = true;
    draw();
    saveDrill(`${o.id}/${line.id}`, mistakes);
    note(`<strong>${t('Line completed!')}</strong><br>${mistakes ? tn(mistakes, '{n} mistake', '{n} mistakes') : t('No mistakes. Well done!')}`, mistakes ? 'failed' : 'ok');
    $('#olActions').innerHTML = `
      <button class="btn ghost" id="again">↺ ${t('Again')}</button>
      <a class="btn ghost" href="#/opening/${o.id}/${line.id}">📖 ${t('Study')}</a>
      <button class="btn ghost" id="olAnalyse" aria-label="${t('Analyse')}">🔍</button>
      ${nextLine ? `<a class="btn success" href="#/drill/${o.id}/${nextLine.id}">${t('Next line')} ›</a>` : `<a class="btn success" href="#/opening/${o.id}">${t('Back to the opening')}</a>`}`;
    $('#again').onclick = start;
    $('#olAnalyse').onclick = analyseLine;
  }

  function start() {
    ply = 0; mistakes = 0; wrongHere = 0; done = false;
    cg.setAutoShapes([]);
    $('#olActions').innerHTML = `<a class="btn ghost" href="#/opening/${o.id}/${line.id}">📖 ${t('Study')}</a>`;
    draw();
    drillNote();
    opponentMoves();
  }

  let keys = null;
  const onKey = e => keys?.(e);
  document.addEventListener('keydown', onKey);
  if (drill) start();
  else { draw(); studyNote(); studyActions(); }

  return () => {
    clearTimeout(timer);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('keydown', onKey);
    cg.destroy();
  };
}
