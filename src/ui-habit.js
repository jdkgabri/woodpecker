// Interfaz del modo hábito (opcional): racha, protectores, celebración y recordatorios.
import * as store from './store.js';
import * as sync from './sync.js';
import { MILESTONES, parseDay } from './habit.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const WEEKDAY = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const longDate = k => parseDay(k).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const habitOn = () => !!store.habitData().enabled;

// ---------- tarjeta de racha en el inicio ----------
export function streakCard() {
  if (!habitOn()) return '';
  const h = store.habitState();
  const b = h.broken;
  const brokenHtml = b ? `
    <section class="card broken">
      <h2>💔 Tu racha de ${plural(b.prevStreak, 'día', 'días')} se ha roto</h2>
      <p class="small">No entrenaste ${b.needed === 1 ? `el ${longDate(b.gap[0])}` : `${b.needed} días (desde el ${longDate(b.gap[0])})`}.</p>
      ${b.canSave
        ? `<p class="small">Puedes salvarla usando ${plural(b.needed, 'protector', 'protectores')} de racha (tienes ${h.freezes}).</p>
           <div class="grid2"><button class="btn primary" id="saveStreak">🛡 Salvar racha</button><button class="btn ghost" id="dropStreak">Empezar de cero</button></div>`
        : `<p class="small muted">Harían falta ${plural(b.needed, 'protector', 'protectores')} y tienes ${h.freezes}.</p>
           <button class="btn ghost" id="dropStreak">Entendido</button>`}
    </section>` : '';
  return `${brokenHtml}
    <section class="card streak ${h.trainedToday ? 'done' : ''}">
      <div class="streak-top">
        <div class="flame ${h.streak ? 'lit' : ''}">🔥</div>
        <div class="streak-num"><b>${h.streak}</b><span>${h.streak === 1 ? 'día de racha' : 'días de racha'}</span></div>
        <div class="freezes" title="Protectores de racha: tienes 1 y ganas 1 cada lunes">🛡 ${h.freezes}</div>
      </div>
      <div class="week">${h.week.map(w => `<div class="wd ${w.state}"><i></i><small>${WEEKDAY[parseDay(w.day).getDay()]}</small></div>`).join('')}</div>
      <p class="small ${h.trainedToday ? 'ok-text' : 'muted'}">${h.trainedToday
        ? '✓ Hoy ya has entrenado. ¡Racha a salvo!'
        : h.streak ? 'Haz al menos un ejercicio de un ciclo hoy para mantenerla.' : 'Haz un ejercicio de un ciclo para empezar una racha.'}
        ${h.nextMilestone ? ` · Próximo hito: ${h.nextMilestone} días` : ''}</p>
    </section>`;
}

export function bindStreakCard(root, rerender) {
  const h = store.habitState();
  root.querySelector('#saveStreak')?.addEventListener('click', () => {
    store.useFreezes(h.broken.gap);
    rerender();
    celebrate(store.habitState().streak, '🛡 ¡Racha salvada!');
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
      <b>${esc(title || (streak === 1 ? '¡Racha iniciada!' : `¡${streak} días seguidos!`))}</b>
      <span>${milestone ? `Has alcanzado el hito de ${streak} días` : 'Racha de hoy asegurada'}</span>
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
    <h2>Modo hábito</h2>
    <label class="switch"><input type="checkbox" id="habitOn" ${on ? 'checked' : ''}><span>Activar racha diaria, protectores y recordatorios</span></label>
    <p class="small muted">Opcional. Si no lo activas, la app no muestra rachas ni te envía avisos: entrenas cuando quieras, sin presión.</p>
    ${on ? `<div id="remBox"><p class="small muted">Cargando recordatorios…</p></div>` : ''}`;
}

export async function bindHabitSettings(root, rerender) {
  root.querySelector('#habitOn')?.addEventListener('change', async e => {
    store.setHabit({ enabled: e.target.checked });
    if (!e.target.checked && sync.state.user) {
      await sync.saveReminders({ enabled: false }).catch(() => {});
    }
    rerender();
  });
  const box = root.querySelector('#remBox');
  if (!box) return;
  if (!sync.state.configured || !sync.state.user) {
    box.innerHTML = `<h3>Recordatorios</h3><p class="small muted">Para recibir recordatorios inicia sesión con Google (arriba, en Sincronización).</p>`;
    return;
  }
  let cfg = { enabled: false, push: false, email: false, times: ['20:00'], ...(await sync.loadReminders().catch(() => null) || {}) };
  if (!cfg.times?.length) cfg.times = ['20:00'];
  let pushHere = await sync.pushEnabledHere().catch(() => false);
  let msg = '';

  const save = async () => {
    cfg.enabled = cfg.push || cfg.email;
    try { await sync.saveReminders({ enabled: cfg.enabled, push: cfg.push, email: cfg.email, times: cfg.times }); msg = '✓ Guardado'; }
    catch (err) { msg = 'Error: ' + err.message; }
    render();
  };

  function render() {
    box.innerHTML = `
      <h3>Recordatorios</h3>
      <p class="small muted">Solo se envían si ese día aún no has hecho ningún ejercicio de un ciclo.</p>
      <label class="switch"><input type="checkbox" id="remPush" ${cfg.push ? 'checked' : ''}><span>Notificación en el móvil</span></label>
      ${cfg.push ? `<p class="small ${pushHere ? 'ok-text' : 'muted'}">${pushHere
        ? '✓ Este dispositivo recibirá las notificaciones.'
        : sync.pushSupported() ? 'Este dispositivo aún no recibe notificaciones.' : 'Este navegador no admite notificaciones.'}</p>
        ${sync.pushSupported() ? `<button class="btn ghost" id="pushHere">${pushHere ? 'Dejar de recibirlas en este dispositivo' : 'Recibirlas en este dispositivo'}</button>` : ''}` : ''}
      <label class="switch"><input type="checkbox" id="remEmail" ${cfg.email ? 'checked' : ''}><span>Email a ${esc(sync.state.user.email || 'tu cuenta')}</span></label>
      ${cfg.push || cfg.email ? `
        <label class="small muted">Horas del aviso</label>
        <div class="times">
          ${cfg.times.map((t, i) => `<div class="time-row"><input type="time" value="${t}" data-t="${i}">${cfg.times.length > 1 ? `<button class="icon-btn" data-del="${i}" aria-label="Quitar">✕</button>` : ''}</div>`).join('')}
        </div>
        ${cfg.times.length < 5 ? '<button class="btn ghost" id="addTime">＋ Añadir otra hora</button>' : ''}
        <button class="btn ghost" id="testRem">🔔 Enviar un recordatorio de prueba</button>` : ''}
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
        if (pushHere) { await sync.disablePushHere(); pushHere = false; msg = 'Este dispositivo ya no recibirá notificaciones'; }
        else { await sync.enablePushHere(); pushHere = true; msg = '✓ Notificaciones activadas en este dispositivo'; }
      } catch (err) { msg = err.message; }
      render();
    });
    box.querySelector('#testRem') && (box.querySelector('#testRem').onclick = async () => {
      msg = 'Enviando…'; render();
      try {
        const r = await sync.sendTestReminder();
        const parts = [];
        if (cfg.push) parts.push(r.push ? `notificación a ${r.push} ${r.push === 1 ? 'dispositivo' : 'dispositivos'}` : 'ningún dispositivo registrado para notificaciones');
        if (cfg.email) parts.push(r.email ? 'email enviado' : 'email no enviado');
        msg = '✓ ' + parts.join(' · ');
      } catch (err) { msg = 'Error: ' + err.message; }
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
