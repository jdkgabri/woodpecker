// Pawn structures: the owner's private PGN library, one file per structure (each game is a chapter),
// studied and practised with the course viewer. The files are uploaded from this screen to the
// owner's own account (sync.js library) and are never part of the app.
import { t, tn } from './i18n.js';
import * as sync from './sync.js';
import { loadCourse, forgetCourse } from './courses.js';

export const OWNER = 'HVCLXy57NDgXPkbrQSVZuAPBunA3';
const SHELF = 'structures';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// "11-The-Maroczy.pgn" -> { n: 11, name: "The Maroczy" }
export function fileInfo(fileName) {
  const base = fileName.replace(/\.pgn$/i, '');
  const m = base.match(/^(\d+)[\s._-]*(.*)$/);
  const name = (m ? m[2] : base).replace(/[_-]+/g, ' ').trim() || base;
  return { n: m ? +m[1] : 999, name };
}
const idOf = fileName => SHELF + '-' + fileName.replace(/\.pgn$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const header = title => `<header class="top"><a class="icon-btn" href="#/">‹</a><h1>${esc(title)}</h1><span></span></header>`;

export async function viewStructures(app) {
  app.innerHTML = `${header(t('Pawn structures'))}<main class="wrap" id="stMain"><p class="muted">${t('Loading…')}</p></main>`;
  const main = app.querySelector('#stMain');
  const uid = await sync.currentUid().catch(() => null);
  if (uid !== OWNER) {
    main.innerHTML = `<p class="muted">${t('This section is private: sign in with its owner\'s account.')}</p>`;
    return;
  }
  let files;
  try { files = await sync.libraryList(SHELF); }
  catch (e) { main.innerHTML = `<p class="bad-text">${esc(e.message)}</p>`; return; }
  const cards = await Promise.all(files.map(async f => {
    let extra = '';
    try {
      const c = await loadCourse('l-' + f.id);
      extra = tn(c.chapters.length, '{n} game', '{n} games');
    } catch {}
    return `<a class="card set-card" href="#/course/l-${f.id}">
      <div class="row"><strong>${f.n < 999 ? f.n + '. ' : ''}${esc(f.name)}</strong><span class="small muted">${extra}</span></div></a>`;
  }));
  main.innerHTML = `
    <p class="small muted">${t('Model games for each pawn structure: study them move by move with their notes, and practise finding the moves.')}</p>
    ${cards.join('') || `<p class="muted">${t('No files yet.')}</p>`}
    <section class="card form">
      <p class="small muted">${t('Load the PGN files (one per structure, the number at the start of the name sets the order). They are kept only in your account; a file with the same name is replaced.')}</p>
      <label class="btn ${files.length ? 'ghost' : 'primary'} full" for="stFiles">⬆ ${t('Load PGN files')}</label>
      <input type="file" id="stFiles" accept=".pgn,application/x-chess-pgn,text/plain" multiple hidden>
      <p class="small" id="stStatus"></p>
    </section>`;
  main.querySelector('#stFiles').onchange = async e => {
    const list = [...e.target.files];
    e.target.value = '';
    if (!list.length) return;
    const status = main.querySelector('#stStatus');
    status.textContent = t('Uploading…');
    try {
      const up = await Promise.all(list.map(async f => ({ id: idOf(f.name), ...fileInfo(f.name), pgn: await f.text() })));
      const big = up.find(f => f.pgn.length > 900000);
      if (big) throw new Error(t('"{name}" is too big (max 900 KB per file).', { name: big.name }));
      await sync.libraryPut(SHELF, up);
      up.forEach(f => forgetCourse('l-' + f.id));
      viewStructures(app);
    } catch (err) { status.textContent = t('Error: {e}', { e: err.message }); }
  };
}
