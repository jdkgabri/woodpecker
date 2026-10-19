// Create a set by importing a PGN of puzzles.
import * as store from './store.js';
import { analysePgn } from './pgn.js';
import { Engine } from './engine.js';
import { solvePosition, checkFirstMove } from './solver.js';
import { t, tn } from './i18n.js';

const MAX_PUZZLES = 3000;
const SECONDS_PER_SOLVE = 6;   // estimate on a computer
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function formPgn() {
  return `
    <section class="card form">
      <label for="pgnFile">${t('PGN file')}</label>
      <input id="pgnFile" type="file" accept=".pgn,.txt,application/x-chess-pgn,text/plain">
      <label for="pgnText">${t('Or paste the PGN here')}</label>
      <textarea id="pgnText" rows="5" spellcheck="false" placeholder='[FEN "..."]&#10;&#10;1. Qxh7+ Kxh7 2. Rh3#'></textarea>
      <label for="oppFirst">${t("Is the first move of each solution the opponent's?")}</label>
      <select id="oppFirst">
        <option value="auto">${t('Detect automatically')}</option>
        <option value="no">${t('No: the side to move starts')}</option>
        <option value="yes">${t('Yes (like Lichess puzzles)')}</option>
      </select>
      <label class="switch"><input type="checkbox" id="verify"><span>${t('Check the solutions with Stockfish (slower)')}</span></label>
      <button class="btn primary full" id="readPgn">${t('Read PGN')}</button>
    </section>
    <div id="pgnReport"></div>
    <p class="muted small">${t('If the PGN includes the solution (moves after the position), it is used as is: variations on your moves count as alternative solutions, except those marked ? or ??. If a puzzle has no moves, the solution is computed with Stockfish on this device.')}</p>`;
}

export function bindPgn(app, go) {
  const $ = s => app.querySelector(s);
  let results = null, ctrl = null, engine = null, lock = null;

  $('#pgnFile').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (f) $('#pgnText').value = await f.text();
  });

  $('#readPgn').addEventListener('click', () => {
    const text = $('#pgnText').value;
    if (!text.trim()) return report(`<p class="bad-text small">${t('Choose a file or paste a PGN.')}</p>`);
    results = analysePgn(text, $('#oppFirst').value);
    if (!results.length) return report(`<p class="bad-text small">${t('No puzzles were found in the PGN.')}</p>`);
    showReport();
  });

  function report(html) { $('#pgnReport').innerHTML = html; }

  function showReport() {
    const sol = results.filter(r => r.kind === 'solution');
    const nosol = results.filter(r => r.kind === 'nosolution');
    const errors = results.filter(r => r.kind === 'error');
    const oppDetected = sol.filter(r => r.flags.includes('opponentFirst'));
    const usable = sol.length + nosol.length;
    const reason = r => ({
      nofen: t('no [FEN]: looks like a full game, not a puzzle'),
      empty: t('empty'),
      badfen: t('invalid FEN'),
      illegal: r.detail ? t('illegal move: {m}', { m: r.detail }) : t('illegal move'),
      short: t('solution too short'),
    }[r.reason] || r.reason);
    const list = (arr, fmt) => `<ul class="small issues">${arr.slice(0, 8).map(r => `<li>#${r.index}${r.label ? ' · ' + esc(r.label) : ''}: ${fmt(r)}</li>`).join('')}${arr.length > 8 ? `<li>… ${t('and {n} more', { n: arr.length - 8 })}</li>` : ''}</ul>`;
    const verify = $('#verify').checked;
    const secs = nosol.length * SECONDS_PER_SOLVE + (verify ? sol.length : 0);
    report(`
      <section class="card">
        <h2>${tn(results.length, '{n} puzzle found', '{n} puzzles found')}</h2>
        <p class="small ok-text">✓ ${tn(sol.length, '{n} with solution', '{n} with solution')}</p>
        ${nosol.length ? `<p class="small">⚙ ${tn(nosol.length, '{n} without solution: it will be computed with Stockfish', '{n} without solution: they will be computed with Stockfish')}</p>` : ''}
        ${oppDetected.length ? `<p class="small warn-text">⚠ ${tn(oppDetected.length, "In {n}, the first move was assumed to be the opponent's (they have an even number of moves). If that is wrong, change the option above and read again.", "In {n}, the first move was assumed to be the opponent's (they have an even number of moves). If that is wrong, change the option above and read again.")}</p>${list(oppDetected, () => t("first move is the opponent's"))}` : ''}
        ${errors.length ? `<p class="small bad-text">✗ ${tn(errors.length, '{n} puzzle cannot be used and will be skipped:', '{n} puzzles cannot be used and will be skipped:')}</p>${list(errors, reason)}` : ''}
        ${usable > MAX_PUZZLES ? `<p class="small bad-text">${t('Only the first {n} will be used.', { n: MAX_PUZZLES })}</p>` : ''}
        ${secs > 30 ? `<p class="small muted">${t('Estimated time: about {m} min on a computer (longer on a phone). Keep the screen on.', { m: Math.max(1, Math.round(secs / 60)) })}</p>` : ''}
        ${usable ? `
          <label for="pgnName">${t('Name')}</label>
          <input id="pgnName" type="text" value="${esc(t('Imported PGN ({n})', { n: Math.min(usable, MAX_PUZZLES) }))}">
          <div class="grid2">
            <div><label for="pgnOrder">${t('Order')}</label>
              <select id="pgnOrder"><option value="seq">${t('File order')}</option><option value="random">${t('Random (reshuffled every cycle)')}</option></select></div>
            <div><label for="pgnCycles">${t('Target cycles')}</label><input id="pgnCycles" type="number" min="1" max="20" value="7" inputmode="numeric"></div>
          </div>
          <button class="btn primary full" id="createPgn">${t('Create set')}</button>
          <div id="pgnProgress"></div>` : ''}
      </section>`);
    $('#createPgn')?.addEventListener('click', create);
  }

  async function create(e) {
    const btn = e.currentTarget;
    btn.disabled = true;
    const items = [];
    const usable = results.filter(r => r.kind !== 'error').slice(0, MAX_PUZZLES);
    const verify = $('#verify').checked;
    const needEngine = usable.some(r => r.kind === 'nosolution') || verify;
    const warnings = [];
    ctrl = new AbortController();
    const prog = (done, total, label) => {
      $('#pgnProgress').innerHTML = `
        <div class="bar big"><i style="width:${(done / total) * 100}%"></i></div>
        <p class="small muted">${esc(label)} ${done}/${total}</p>
        <button class="btn ghost" id="cancelPgn">${t('Cancel')}</button>`;
      $('#cancelPgn').onclick = () => ctrl.abort();
    };
    try {
      if (needEngine) {
        engine = new Engine();
        lock = await navigator.wakeLock?.request('screen').catch(() => null);
      }
      let k = 0;
      for (const r of usable) {
        if (ctrl.signal.aborted) throw new Error(t('Cancelled'));
        let tree = r.tree;
        if (r.kind === 'nosolution') {
          prog(k, usable.length, t('Computing solutions…'));
          tree = await solvePosition(engine, r.fen, { signal: ctrl.signal });
          if (!tree) { warnings.push({ ...r, why: t('Stockfish found no clear solution') }); k++; continue; }
        } else if (verify) {
          prog(k, usable.length, t('Checking solutions…'));
          const doubt = await checkFirstMove(engine, r.fen, r.tree[0][0]);
          if (doubt) warnings.push({ ...r, why: doubt === 'missesMate' ? t('the solution misses an existing mate') : t('Stockfish prefers another move') });
        }
        items.push({ pgn: true, n: r.index, fen: r.fen, tree, ...(r.label ? { label: r.label } : {}), ...(r.notes ? { notes: r.notes } : {}) });
        k++;
      }
    } catch (err) {
      $('#pgnProgress').innerHTML = `<p class="small bad-text">${esc(err.message === 'aborted' ? t('Cancelled') : err.message)}</p>`;
      btn.disabled = false;
      cleanup();
      return;
    }
    cleanup();
    if (!items.length) { $('#pgnProgress').innerHTML = `<p class="small bad-text">${t('No usable puzzles left.')}</p>`; btn.disabled = false; return; }
    if (warnings.length) {
      const msg = t('{n} puzzles with possible problems:', { n: warnings.length }) + '\n' +
        warnings.slice(0, 10).map(w => `#${w.index}: ${w.why}`).join('\n') + (warnings.length > 10 ? '\n…' : '') +
        '\n\n' + t('They will be created anyway (you can review them with the analysis). Continue?');
      if (!confirm(msg)) { btn.disabled = false; return; }
    }
    const set = store.addSet({
      id: store.uid(), name: $('#pgnName').value.trim() || t('Imported PGN ({n})', { n: items.length }),
      source: 'pgn', order: $('#pgnOrder').value, targetCycles: +$('#pgnCycles').value || 7, createdAt: Date.now(), items, cycles: [],
    });
    go('#/set/' + set.id);
  }

  function cleanup() {
    engine?.destroy(); engine = null;
    lock?.release?.().catch(() => {}); lock = null;
  }
  return () => { ctrl?.abort(); cleanup(); };
}
