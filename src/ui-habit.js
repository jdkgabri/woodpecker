// Habit mode UI (optional): streak, streak freezes, celebration and reminders.
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

// ---------- XP, level and achievements (optional within habit mode) ----------
const progressData = () => { const d = store.rawData(); return { sets: d.sets, days: d.days, frozen: d.frozen }; };

export function levelCard(full) {
  const L = levelInfo(computeXp(progressData()));
  const got = new Set(unlocked(progressData()));
  const head = `
    <div class="lvl-top">
      <div class="lvl-icon">${L.icon}</div>
      <div class="lvl-text"><b>${t('Level {n}', { n: L.level })} · ${t(L.rank)}</b>
        <span class="small muted">${t('{xp} XP · {k} to level {n}', { xp: L.xp.toLocaleString(locale()), k: (L.to - L.xp).toLocaleString(locale()), n: L.level + 1 })}</span></div>
      ${full ? '' : `<a class="small link" href="#/stats">${t('{n}/{m} achievements', { n: got.size, m: ACHIEVEMENTS.length })} ›</a>`}
    </div>
    <div class="bar"><i style="width:${Math.round(L.progress * 100)}%"></i></div>`;
  if (!full) return `<section class="card lvl">${head}</section>`;
  return `<section class="card lvl">${head}
    <h2 class="ach-title" id="achievements">${t('Achievements')} <span class="muted small">${got.size}/${ACHIEVEMENTS.length}</span></h2>
    <div class="ach-grid">${ACHIEVEMENTS.map(([id, icon, name, desc]) => `
      <div class="ach ${got.has(id) ? 'got' : ''}" title="${esc(t(desc))}"><span class="ach-i">${icon}</span><b>${esc(t(name))}</b><small>${esc(t(desc))}</small></div>`).join('')}</div>
    <p class="small muted">${t('XP: 10 per solved puzzle, 3 per failed one, 50 per completed cycle (+25 with 90% accuracy, +25 if faster than the previous one) and a daily bonus based on your streak.')}</p>
  </section>`;
}

// Progress snapshot to detect level-ups and new achievements
export const progressSnapshot = () => (gamifyOn() ? { level: levelInfo(computeXp(progressData())).level, got: new Set(unlocked(progressData())) } : null);

export function notifyProgress(before) {
  if (!before || !gamifyOn()) return;
  const after = progressSnapshot();
  const msgs = [];
  if (after.level > before.level) {
    const L = levelInfo(computeXp(progressData()));
    msgs.push(`${L.icon} ${t('Level {n}!', { n: L.level })} · ${t(L.rank)}`);
  }
  for (const [id, icon, name] of ACHIEVEMENTS) if (after.got.has(id) && !before.got.has(id)) msgs.push(`${icon} ${t('Achievement: {name}', { name: t(name) })}`);
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

// ---------- streak card on the home screen ----------
export function streakCard() {
  if (!habitOn()) return '';
  const h = store.habitState();
  const b = h.broken;
  const brokenHtml = b ? `
    <section class="card broken">
      <h2>💔 ${tn(b.prevStreak, 'Your {n}-day streak is broken', 'Your {n}-day streak is broken|many')}</h2>
      <p class="small">${b.needed === 1 ? t('You did not train on {date}.', { date: longDate(b.gap[0]) }) : t('You did not train for {n} days (since {date}).', { n: b.needed, date: longDate(b.gap[0]) })}</p>
      ${b.canSave
        ? `<p class="small">${tn(b.needed, 'You can save it using {n} streak freeze (you have {f}).', 'You can save it using {n} streak freezes (you have {f}).', { f: h.freezes })}</p>
           <div class="grid2"><button class="btn primary" id="saveStreak">🛡 ${t('Save streak')}</button><button class="btn ghost" id="dropStreak">${t('Start over')}</button></div>`
        : `<p class="small muted">${tn(b.needed, 'It would take {n} streak freeze and you have {f}.', 'It would take {n} streak freezes and you have {f}.', { f: h.freezes })}</p>
           <button class="btn ghost" id="dropStreak">${t('Got it')}</button>`}
    </section>` : '';
  return `${brokenHtml}
    <section class="card streak ${h.trainedToday ? 'done' : ''}">
      <div class="streak-top">
        <div class="flame ${h.streak ? 'lit' : ''}">🔥</div>
        <div class="streak-num"><b>${h.streak}</b><span>${h.streak === 1 ? t('day streak') : t('day streak|many')}</span></div>
        <div class="freezes" title="${t('Streak freezes: you start with 1 and earn 1 every Monday')}">🛡 ${h.freezes}</div>
      </div>
      <div class="week">${h.week.map(w => `<div class="wd ${w.state}"><i></i><small>${weekday(w.day)}</small></div>`).join('')}</div>
      <p class="small ${h.trainedToday ? 'ok-text' : 'muted'}">${h.trainedToday
        ? '✓ ' + t('You already trained today. Streak safe!')
        : h.streak ? t('Do at least one puzzle from a cycle today to keep it.') : t('Do a puzzle from a cycle to start a streak.')}
        ${h.nextMilestone ? ' · ' + t('Next milestone: {n} days', { n: h.nextMilestone }) : ''}</p>
    </section>`;
}

export function bindStreakCard(root, rerender) {
  const h = store.habitState();
  root.querySelector('#saveStreak')?.addEventListener('click', () => {
    store.useFreezes(h.broken.gap);
    rerender();
    celebrate(store.habitState().streak, '🛡 ' + t('Streak saved!'));
  });
  root.querySelector('#dropStreak')?.addEventListener('click', () => {
    store.dismissBreak(h.broken.lastDay);
    rerender();
  });
}

// ---------- celebration on the day's first puzzle ----------
export function celebrate(streak, title) {
  if (!habitOn()) return;
  const milestone = MILESTONES.includes(streak);
  document.querySelector('.celebrate')?.remove();
  const el = document.createElement('div');
  el.className = 'celebrate' + (milestone ? ' milestone' : '');
  el.innerHTML = `
    <div class="cel-box">
      <div class="cel-flame">${milestone ? '🏆' : '🔥'}</div>
      <b>${esc(title || (streak === 1 ? t('Streak started!') : t('{n} days in a row!', { n: streak })))}</b>
      <span>${milestone ? t('You reached the {n}-day milestone', { n: streak }) : t("Today's streak secured")}</span>
    </div>
    ${milestone ? Array.from({ length: 18 }, (_, i) => `<i class="conf" style="--i:${i}"></i>`).join('') : ''}`;
  el.addEventListener('click', () => el.remove());
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('out'), milestone ? 3200 : 2000);
  setTimeout(() => el.remove(), milestone ? 3700 : 2500);
}

// ---------- settings ----------
export function habitSettings() {
  const on = habitOn();
  return `
    <h2>${t('Habit mode')}</h2>
    <label class="switch"><input type="checkbox" id="habitOn" ${on ? 'checked' : ''}><span>${t('Enable daily streak, streak freezes and reminders')}</span></label>
    <p class="small muted">${t('Optional. If you leave it off, the app shows no streaks and sends no reminders: train whenever you want, no pressure.')}</p>
    ${on ? `<label class="switch"><input type="checkbox" id="gamifyOn" ${store.habitData().gamify ? 'checked' : ''}><span>${t('Show points (XP), levels and achievements')}</span></label>` : ''}
    ${on ? `<div id="remBox"><p class="small muted">${t('Loading reminders…')}</p></div>` : ''}`;
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
    box.innerHTML = `<h3>${t('Reminders')}</h3><p class="small muted">${t('To get reminders, sign in with Google (above, under Sync).')}</p>`;
    return;
  }
  let cfg = { enabled: false, push: false, email: false, times: ['20:00'], ...(await sync.loadReminders().catch(() => null) || {}) };
  if (!cfg.times?.length) cfg.times = ['20:00'];
  // reminders are sent in the app's current language
  if (cfg.enabled && cfg.lang !== lang()) sync.saveLang().catch(() => {});
  let pushHere = await sync.pushEnabledHere().catch(() => false);
  let msg = '';

  const save = async () => {
    cfg.enabled = cfg.push || cfg.email;
    try { await sync.saveReminders({ enabled: cfg.enabled, push: cfg.push, email: cfg.email, times: cfg.times }); msg = '✓ ' + t('Saved'); }
    catch (err) { msg = t('Error: {e}', { e: err.message }); }
    render();
  };

  function render() {
    box.innerHTML = `
      <h3>${t('Reminders')}</h3>
      <p class="small muted">${t('They are only sent if you have not done any puzzle from a cycle that day.')}</p>
      <label class="switch"><input type="checkbox" id="remPush" ${cfg.push ? 'checked' : ''}><span>${t('Phone notification')}</span></label>
      ${cfg.push ? `<p class="small ${pushHere ? 'ok-text' : 'muted'}">${pushHere
        ? '✓ ' + t('This device will receive notifications.')
        : sync.pushSupported() ? t('This device does not receive notifications yet.') : t('This browser does not support notifications.')}</p>
        ${sync.pushSupported() ? `<button class="btn ghost" id="pushHere">${pushHere ? t('Stop receiving them on this device') : t('Receive them on this device')}</button>` : ''}` : ''}
      <label class="switch"><input type="checkbox" id="remEmail" ${cfg.email ? 'checked' : ''}><span>${t('Email to {e}', { e: esc(sync.state.user.email || t('your account')) })}</span></label>
      ${cfg.push || cfg.email ? `
        <label class="small muted">${t('Reminder times')}</label>
        <div class="times">
          ${cfg.times.map((tm, i) => `<div class="time-row"><input type="time" value="${tm}" data-t="${i}">${cfg.times.length > 1 ? `<button class="icon-btn" data-del="${i}" aria-label="${t('Remove')}">✕</button>` : ''}</div>`).join('')}
        </div>
        ${cfg.times.length < 5 ? `<button class="btn ghost" id="addTime">＋ ${t('Add another time')}</button>` : ''}
        <button class="btn ghost" id="testRem">🔔 ${t('Send a test reminder')}</button>` : ''}
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
        if (pushHere) { await sync.disablePushHere(); pushHere = false; msg = t('This device will no longer receive notifications'); }
        else { await sync.enablePushHere(); pushHere = true; msg = '✓ ' + t('Notifications enabled on this device'); }
      } catch (err) { msg = err.message; }
      render();
    });
    box.querySelector('#testRem') && (box.querySelector('#testRem').onclick = async () => {
      msg = t('Sending…'); render();
      try {
        const r = await sync.sendTestReminder();
        const parts = [];
        if (cfg.push) parts.push(r.push ? tn(r.push, 'notification to {n} device', 'notification to {n} devices') : t('no device registered for notifications'));
        if (cfg.email) parts.push(r.email ? t('email sent') : t('email not sent'));
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
