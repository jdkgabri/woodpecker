// Pawn structures: the owner's private PGN library, one file per structure (each game is a chapter),
// studied and practised with the course viewer. The files come from the "library" Cloud Function,
// which only serves them to the owner's account; they are never part of the app.
import { t, tn } from './i18n.js';
import * as sync from './sync.js';
import { loadCourse } from './courses.js';

export const OWNER = 'HVCLXy57NDgXPkbrQSVZuAPBunA3';
const SHELF = 'structures';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function viewStructures(app) {
  app.innerHTML = `<header class="top"><a class="icon-btn" href="#/">‹</a><h1>${t('Pawn structures')}</h1><span></span></header><main class="wrap" id="stMain"><p class="muted">${t('Loading…')}</p></main>`;
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
    const id = `l-${SHELF}~${f.id}`;
    let extra = '';
    try {
      const c = await loadCourse(id);
      extra = c.chapters.length ? tn(c.chapters.length, '{n} game', '{n} games') : tn(c.notes?.length || 0, '{n} position', '{n} positions');
    } catch {}
    return `<a class="card set-card" href="#/course/${id}">
      <div class="row"><strong>${f.n < 999 ? f.n + '. ' : ''}${esc(f.name)}</strong><span class="small muted">${extra}</span></div></a>`;
  }));
  main.innerHTML = `
    <p class="small muted">${t('Model games for each pawn structure: study them move by move with their notes, and practise finding the moves.')}</p>
    ${cards.join('') || `<p class="muted">${t('No files yet.')}</p>`}`;
}
