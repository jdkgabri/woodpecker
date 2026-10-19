// Crear un set importando un PGN de ejercicios.
import * as store from './store.js';
import { analysePgn } from './pgn.js';
import { Engine } from './engine.js';
import { solvePosition, checkFirstMove } from './solver.js';
import { t, tn } from './i18n.js';

const MAX_PUZZLES = 3000;
const SECONDS_PER_SOLVE = 6;   // estimación en un PC
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function formPgn() {
  return `
    <section class="card form">
      <label for="pgnFile">${t('Archivo PGN')}</label>
      <input id="pgnFile" type="file" accept=".pgn,.txt,application/x-chess-pgn,text/plain">
      <label for="pgnText">${t('O pega aquí el PGN')}</label>
      <textarea id="pgnText" rows="5" spellcheck="false" placeholder='[FEN "..."]&#10;&#10;1. Qxh7+ Kxh7 2. Rh3#'></textarea>
      <label for="oppFirst">${t('¿La primera jugada de cada solución es del rival?')}</label>
      <select id="oppFirst">
        <option value="auto">${t('Detectar automáticamente')}</option>
        <option value="no">${t('No: empieza el que tiene el turno')}</option>
        <option value="yes">${t('Sí (como los puzles de Lichess)')}</option>
      </select>
      <label class="switch"><input type="checkbox" id="verify"><span>${t('Verificar las soluciones con Stockfish (más lento)')}</span></label>
      <button class="btn primary full" id="readPgn">${t('Leer PGN')}</button>
    </section>
    <div id="pgnReport"></div>
    <p class="muted small">${t('Si el PGN trae la solución (jugadas tras la posición), se usa tal cual: las variantes en tus jugadas cuentan como soluciones alternativas, salvo las marcadas con ? o ??. Si un ejercicio no trae jugadas, la solución se calcula con Stockfish en este dispositivo.')}</p>`;
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
    if (!text.trim()) return report(`<p class="bad-text small">${t('Elige un archivo o pega un PGN.')}</p>`);
    results = analysePgn(text, $('#oppFirst').value);
    if (!results.length) return report(`<p class="bad-text small">${t('No se ha encontrado ningún ejercicio en el PGN.')}</p>`);
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
      nofen: t('sin [FEN]: parece una partida completa, no un ejercicio'),
      empty: t('vacío'),
      badfen: t('FEN no válido'),
      illegal: r.detail ? t('jugada ilegal: {m}', { m: r.detail }) : t('jugada ilegal'),
      short: t('solución demasiado corta'),
    }[r.reason] || r.reason);
    const list = (arr, fmt) => `<ul class="small issues">${arr.slice(0, 8).map(r => `<li>#${r.index}${r.label ? ' · ' + esc(r.label) : ''}: ${fmt(r)}</li>`).join('')}${arr.length > 8 ? `<li>… ${t('y {n} más', { n: arr.length - 8 })}</li>` : ''}</ul>`;
    const verify = $('#verify').checked;
    const secs = nosol.length * SECONDS_PER_SOLVE + (verify ? sol.length : 0);
    report(`
      <section class="card">
        <h2>${tn(results.length, '{n} ejercicio encontrado', '{n} ejercicios encontrados')}</h2>
        <p class="small ok-text">✓ ${tn(sol.length, '{n} con solución', '{n} con solución')}</p>
        ${nosol.length ? `<p class="small">⚙ ${tn(nosol.length, '{n} sin solución: se calculará con Stockfish', '{n} sin solución: se calcularán con Stockfish')}</p>` : ''}
        ${oppDetected.length ? `<p class="small warn-text">⚠ ${tn(oppDetected.length, 'En {n} se ha supuesto que la primera jugada es del rival (tienen un número par de jugadas). Si no es así, cambia la opción de arriba y vuelve a leer.', 'En {n} se ha supuesto que la primera jugada es del rival (tienen un número par de jugadas). Si no es así, cambia la opción de arriba y vuelve a leer.')}</p>${list(oppDetected, () => t('primera jugada del rival'))}` : ''}
        ${errors.length ? `<p class="small bad-text">✗ ${tn(errors.length, '{n} no se puede usar y se omitirá:', '{n} no se pueden usar y se omitirán:')}</p>${list(errors, reason)}` : ''}
        ${usable > MAX_PUZZLES ? `<p class="small bad-text">${t('Se usarán solo los primeros {n}.', { n: MAX_PUZZLES })}</p>` : ''}
        ${secs > 30 ? `<p class="small muted">${t('Tiempo estimado: unos {m} min en un ordenador (más en el móvil). Mantén la pantalla encendida.', { m: Math.max(1, Math.round(secs / 60)) })}</p>` : ''}
        ${usable ? `
          <label for="pgnName">${t('Nombre')}</label>
          <input id="pgnName" type="text" value="${esc(t('PGN importado ({n})', { n: Math.min(usable, MAX_PUZZLES) }))}">
          <div class="grid2">
            <div><label for="pgnOrder">${t('Orden')}</label>
              <select id="pgnOrder"><option value="seq">${t('Orden del archivo')}</option><option value="random">${t('Aleatorio (se baraja en cada ciclo)')}</option></select></div>
            <div><label for="pgnCycles">${t('Ciclos objetivo')}</label><input id="pgnCycles" type="number" min="1" max="20" value="7" inputmode="numeric"></div>
          </div>
          <button class="btn primary full" id="createPgn">${t('Crear set')}</button>
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
        <button class="btn ghost" id="cancelPgn">${t('Cancelar')}</button>`;
      $('#cancelPgn').onclick = () => ctrl.abort();
    };
    try {
      if (needEngine) {
        engine = new Engine();
        lock = await navigator.wakeLock?.request('screen').catch(() => null);
      }
      let k = 0;
      for (const r of usable) {
        if (ctrl.signal.aborted) throw new Error(t('Cancelado'));
        let tree = r.tree;
        if (r.kind === 'nosolution') {
          prog(k, usable.length, t('Calculando soluciones…'));
          tree = await solvePosition(engine, r.fen, { signal: ctrl.signal });
          if (!tree) { warnings.push({ ...r, why: t('Stockfish no encontró una solución clara') }); k++; continue; }
        } else if (verify) {
          prog(k, usable.length, t('Verificando soluciones…'));
          const doubt = await checkFirstMove(engine, r.fen, r.tree[0][0]);
          if (doubt) warnings.push({ ...r, why: doubt === 'missesMate' ? t('la solución no da el mate que hay') : t('Stockfish prefiere otra jugada') });
        }
        items.push({ pgn: true, n: r.index, fen: r.fen, tree, ...(r.label ? { label: r.label } : {}), ...(r.notes ? { notes: r.notes } : {}) });
        k++;
      }
    } catch (err) {
      $('#pgnProgress').innerHTML = `<p class="small bad-text">${esc(err.message === 'aborted' ? t('Cancelado') : err.message)}</p>`;
      btn.disabled = false;
      cleanup();
      return;
    }
    cleanup();
    if (!items.length) { $('#pgnProgress').innerHTML = `<p class="small bad-text">${t('No queda ningún ejercicio utilizable.')}</p>`; btn.disabled = false; return; }
    if (warnings.length) {
      const msg = t('{n} ejercicios con posibles problemas:', { n: warnings.length }) + '\n' +
        warnings.slice(0, 10).map(w => `#${w.index}: ${w.why}`).join('\n') + (warnings.length > 10 ? '\n…' : '') +
        '\n\n' + t('Se crearán igualmente (puedes revisarlos con el análisis). ¿Continuar?');
      if (!confirm(msg)) { btn.disabled = false; return; }
    }
    const set = store.addSet({
      id: store.uid(), name: $('#pgnName').value.trim() || t('PGN importado ({n})', { n: items.length }),
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
