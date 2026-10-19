// Interfaz del modo hábito (opcional): racha, protectores, celebración y recordatorios.
import * as store from './store.js';
import * as sync from './sync.js';
import { MILESTONES, parseDay } from './habit.js';
import { t, tn, locale, lang } from './i18n.js';
import { computeXp, levelInfo, ACHIEVEMENTS, unlocked } from './progress.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const weekday = k => parseDay(k).toLocaleDateString(locale(), { weekday: 'narrow' }).toUpperCase();
const longDate = k => parseDay(k).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });

export const habitOn = () => !!store.habitData().enabled;
export const gamifyOn = () => habitOn() && !!store.habitData().gamify;

// ---------- XP, nivel y logros (opcional dentro del modo hábito) ----------
const progressData = () => { const d = store.rawData(); return { sets: d.sets, days: d.days, frozen: d.frozen }; };

export function levelCard(full) {
  const L = levelInfo(computeXp(progressData()));
  const got = new Set(unlocked(progressData()));
  const head = `
    <div class="lvl-top">
      <div class="lvl-icon">${L.icon}</div>
      <div class="lvl-text"><b>${t('Nivel {n}', { n: L.level })} · ${t(L.rank)}</b>
        <span class="small muted">${t('{xp} XP · faltan {k} para el nivel {n}', { xp: L.xp.toLocaleString(locale()), k: (L.to - L.xp).toLocaleString(locale()), n: L.level + 1 })}</span></div>
      ${full ? '' : `<a class="small link" href="#/stats">${t('{n}/{m} logros', { n: got.size, m: ACHIEVEMENTS.length })} ›</a>`}
    </div>
    <div class="bar"><i style="width:${Math.round(L.progress * 100)}%"></i></div>`;
  if (!full) return `<section class="card lvl">${head}</section>`;
  return `<section class="card lvl">${head}
    <h2 class="ach-title" id="logros">${t('Logros')} <span class="muted small">${got.size}/${ACHIEVEMENTS.length}</span></h2>
    <div class="ach-grid">${ACHIEVEMENTS.map(([id, icon, name, desc]) => `
      <div class="ach ${got.has(id) ? 'got' : ''}" title="${esc(t(desc))}"><span class="ach-i">${icon}</span><b>${esc(t(name))}</b><small>${esc(t(desc))}</small></div>`).join('')}</div>
    <p class="small muted">${t('XP: 10 por ejercicio resuelto, 3 por fallado, 50 por ciclo completado (+25 con 90 % de acierto, +25 si es más rápido que el anterior) y un extra diario según tu racha.')}</p>
  </section>`;
}

// Foto del progreso para detectar subidas de nivel y logros nuevos
export const progressSnapshot = () => (gamifyOn() ? { level: levelInfo(computeXp(progressData())).level, got: new Set(unlocked(progressData())) } : null);

export function notifyProgress(before) {
  if (!before || !gamifyOn()) return;
  const after = progressSnapshot();
  const msgs = [];
  if (after.level > before.level) {
    const L = levelInfo(computeXp(progressData()));
    msgs.push(`${L.icon} ${t('¡Nivel {n}!', { n: L.level })} · ${t(L.rank)}`);
  }
  for (const [id, icon, name] of ACHIEVEMENTS) if (after.got.has(id) && !before.got.has(id)) msgs.push(`${icon} ${t('Logro: {name}', { name: t(name) })}`);
  const delay = document.querySelector('.celebrate') ? 2600 : 0;
  msgs.forEach((m, i) => setTimeout(() => toast(m), delay + 2600 * i));
}

function toast(text) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('out'), 2300);
  setTimeout(() => el.remove(), 2800);
}

// ---------- tarjeta de racha en el inicio ----------
export function streakCard() {
  if (!habitOn()) return '';
  const h = store.habitState();
  const b = h.broken;
  const brokenHtml = b ? `
    <section class="card broken">
      <h2>💔 ${tn(b.prevStreak, 'Tu racha de {n} día se ha roto', 'Tu racha de {n} días se ha roto')}</h2>
      <p class="small">${b.needed === 1 ? t('No entrenaste el {date}.', { date: longDate(b.gap[0]) }) : t('No entrenaste {n} días (desde el {date}).', { n: b.needed, date: longDate(b.gap[0]) })}</p>
      ${b.canSave
        ? `<p class="small">${tn(b.needed, 'Puedes salvarla usando {n} protector de racha (tienes {f}).', 'Puedes salvarla usando {n} protectores de racha (tienes {f}).', { f: h.freezes })}</p>
           <div class="grid2"><button class="btn primary" id="saveStreak">🛡 ${t('Salvar racha')}</button><button class="btn ghost" id="dropStreak">${t('Empezar de cero')}</button></div>`
        : `<p class="small muted">${tn(b.needed, 'Haría falta {n} protector y tienes {f}.', 'Harían falta {n} protectores y tienes {f}.', { f: h.freezes })}</p>
           <button class="btn ghost" id="dropStreak">${t('Entendido')}</button>`}
    </section>` : '';
  return `${brokenHtml}
    <section class="card streak ${h.trainedToday ? 'done' : ''}">
      <div class="streak-top">
        <div class="flame ${h.streak ? 'lit' : ''}">🔥</div>
        <div class="streak-num"><b>${h.streak}</b><span>${h.streak === 1 ? t('día de racha') : t('días de racha')}</span></div>
        <div class="freezes" title="${t('Protectores de racha: tienes 1 y ganas 1 cada lunes')}">🛡 ${h.freezes}</div>
      </div>
      <div class="week">${h.week.map(w => `<div class="wd ${w.state}"><i></i><small>${weekday(w.day)}</small></div>`).join('')}</div>
      <p class="small ${h.trainedToday ? 'ok-text' : 'muted'}">${h.trainedToday
        ? '✓ ' + t('Hoy ya has entrenado. ¡Racha a salvo!')
        : h.streak ? t('Haz al menos un ejercicio de un ciclo hoy para mantenerla.') : t('Haz un ejercicio de un ciclo para empezar una racha.')}
        ${h.nextMilestone ? ' · ' + t('Próximo hito: {n} días', { n: h.nextMilestone }) : ''}</p>
    </section>`;
}

export function bindStreakCard(root, rerender) {
  const h = store.habitState();
  root.querySelector('#saveStreak')?.addEventListener('click', () => {
    store.useFreezes(h.broken.gap);
    rerender();
    celebrate(store.habitState().streak, '🛡 ' + t('¡Racha salvada!'));
  });
  root.querySelector('#dropStreak')?.addEventListener('click', () => {
    store.dismissBreak(h.broken.lastDay);
    rerender();
  });
}

// ---------- celebración al primer ejercicio del día ----------
export function celebrate(streak, title) {
  if (!habitOn()) return;
  const milestone = MILESTONES.includes(streak);
  document.querySelector('.celebrate')?.remove();
  const el = document.createElement('div');
  el.className = 'celebrate' + (milestone ? ' milestone' : '');
  el.innerHTML = `
    <div class="cel-box">
      <div class="cel-flame">${milestone ? '🏆' : '🔥'}</div>
      <b>${esc(title || (streak === 1 ? t('¡Racha iniciada!') : t('¡{n} días seguidos!', { n: streak })))}</b>
      <span>${milestone ? t('Has alcanzado el hito de {n} días', { n: streak }) : t('Racha de hoy asegurada')}</span>
    </div>
    ${milestone ? Array.from({ length: 18 }, (_, i) => `<i class="conf" style="--i:${i}"></i>`).join('') : ''}`;
  el.addEventListener('click', () => el.remove());
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('out'), milestone ? 3200 : 2000);
  setTimeout(() => el.remove(), milestone ? 3700 : 2500);
}

// ---------- ajustes ----------
export function habitSettings() {
  const on = habitOn();
  return `
    <h2>${t('Modo hábito')}</h2>
    <label class="switch"><input type="checkbox" id="habitOn" ${on ? 'checked' : ''}><span>${t('Activar racha diaria, protectores y recordatorios')}</span></label>
    <p class="small muted">${t('Opcional. Si no lo activas, la app no muestra rachas ni te envía avisos: entrenas cuando quieras, sin presión.')}</p>
    ${on ? `<label class="switch"><input type="checkbox" id="gamifyOn" ${store.habitData().gamify ? 'checked' : ''}><span>${t('Mostrar puntos (XP), niveles y logros')}</span></label>` : ''}
    ${on ? `<div id="remBox"><p class="small muted">${t('Cargando recordatorios…')}</p></div>` : ''}`;
}

export async function bindHabitSettings(root, rerender) {
  root.querySelector('#habitOn')?.addEventListener('change', async e => {
    store.setHabit({ enabled: e.target.checked });
    if (!e.target.checked && sync.state.user) {
      await sync.saveReminders({ enabled: false }).catch(() => {});
    }
    rerender();
  });
  root.querySelector('#gamifyOn')?.addEventListener('change', e => { store.setHabit({ gamify: e.target.checked }); });
  const box = root.querySelector('#remBox');
  if (!box) return;
  if (!sync.state.configured || !sync.state.user) {
    box.innerHTML = `<h3>${t('Recordatorios')}</h3><p class="small muted">${t('Para recibir recordatorios inicia sesión con Google (arriba, en Sincronización).')}</p>`;
    return;
  }
  let cfg = { enabled: false, push: false, email: false, times: ['20:00'], ...(await sync.loadReminders().catch(() => null) || {}) };
  if (!cfg.times?.length) cfg.times = ['20:00'];
  // los avisos se envían en el idioma actual de la app
  if (cfg.enabled && cfg.lang !== lang()) sync.saveLang().catch(() => {});
  let pushHere = await sync.pushEnabledHere().catch(() => false);
  let msg = '';

  const save = async () => {
    cfg.enabled = cfg.push || cfg.email;
    try { await sync.saveReminders({ enabled: cfg.enabled, push: cfg.push, email: cfg.email, times: cfg.times }); msg = '✓ ' + t('Guardado'); }
    catch (err) { msg = t('Error: {e}', { e: err.message }); }
    render();
  };

  function render() {
    box.innerHTML = `
      <h3>${t('Recordatorios')}</h3>
      <p class="small muted">${t('Solo se envían si ese día aún no has hecho ningún ejercicio de un ciclo.')}</p>
      <label class="switch"><input type="checkbox" id="remPush" ${cfg.push ? 'checked' : ''}><span>${t('Notificación en el móvil')}</span></label>
      ${cfg.push ? `<p class="small ${pushHere ? 'ok-text' : 'muted'}">${pushHere
        ? '✓ ' + t('Este dispositivo recibirá las notificaciones.')
        : sync.pushSupported() ? t('Este dispositivo aún no recibe notificaciones.') : t('Este navegador no admite notificaciones.')}</p>
        ${sync.pushSupported() ? `<button class="btn ghost" id="pushHere">${pushHere ? t('Dejar de recibirlas en este dispositivo') : t('Recibirlas en este dispositivo')}</button>` : ''}` : ''}
      <label class="switch"><input type="checkbox" id="remEmail" ${cfg.email ? 'checked' : ''}><span>${t('Email a {e}', { e: esc(sync.state.user.email || t('tu cuenta')) })}</span></label>
      ${cfg.push || cfg.email ? `
        <label class="small muted">${t('Horas del aviso')}</label>
        <div class="times">
          ${cfg.times.map((tm, i) => `<div class="time-row"><input type="time" value="${tm}" data-t="${i}">${cfg.times.length > 1 ? `<button class="icon-btn" data-del="${i}" aria-label="${t('Quitar')}">✕</button>` : ''}</div>`).join('')}
        </div>
        ${cfg.times.length < 5 ? `<button class="btn ghost" id="addTime">＋ ${t('Añadir otra hora')}</button>` : ''}
        <button class="btn ghost" id="testRem">🔔 ${t('Enviar un recordatorio de prueba')}</button>` : ''}
      <p class="small muted" id="remMsg">${esc(msg)}</p>`;
    box.querySelector('#remPush').onchange = async e => {
      cfg.push = e.target.checked;
      if (cfg.push && !pushHere) {
        try { await sync.enablePushHere(); pushHere = true; } catch (err) { msg = err.message; }
      }
      save();
    };
    box.querySelector('#remEmail').onchange = e => { cfg.email = e.target.checked; save(); };
    box.querySelector('#pushHere') && (box.querySelector('#pushHere').onclick = async () => {
      try {
        if (pushHere) { await sync.disablePushHere(); pushHere = false; msg = t('Este dispositivo ya no recibirá notificaciones'); }
        else { await sync.enablePushHere(); pushHere = true; msg = '✓ ' + t('Notificaciones activadas en este dispositivo'); }
      } catch (err) { msg = err.message; }
      render();
    });
    box.querySelector('#testRem') && (box.querySelector('#testRem').onclick = async () => {
      msg = t('Enviando…'); render();
      try {
        const r = await sync.sendTestReminder();
        const parts = [];
        if (cfg.push) parts.push(r.push ? tn(r.push, 'notificación a {n} dispositivo', 'notificación a {n} dispositivos') : t('ningún dispositivo registrado para notificaciones'));
        if (cfg.email) parts.push(r.email ? t('email enviado') : t('email no enviado'));
        msg = '✓ ' + parts.join(' · ');
      } catch (err) { msg = t('Error: {e}', { e: err.message }); }
      render();
    });
    box.querySelectorAll('[data-t]').forEach(inp => inp.onchange = () => {
      cfg.times[+inp.dataset.t] = inp.value;
      cfg.times = [...new Set(cfg.times.filter(Boolean))].sort();
      save();
    });
    box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { cfg.times.splice(+b.dataset.del, 1); save(); });
    box.querySelector('#addTime') && (box.querySelector('#addTime').onclick = () => {
      const last = cfg.times[cfg.times.length - 1] || '19:00';
      const [h, m] = last.split(':').map(Number);
      cfg.times.push(`${String(Math.min(23, h + 2)).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      cfg.times = [...new Set(cfg.times)].sort();
      save();
    });
  }
  render();
}
