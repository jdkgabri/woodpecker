// Reminder logic (independent of Firebase Functions so it can be tested).
import { compute } from './habit.js';

const WINDOW_MIN = 60; // remind within the hour after the chosen time (in case a run is late)
export const APP_URL = 'https://woodpecker-93e04.web.app/';

// Local date 'YYYY-MM-DD' and minutes since midnight in the user's time zone
export function localParts(now, tz) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const p = Object.fromEntries(f.formatToParts(now).map(x => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, minutes: +p.hour * 60 + +p.minute, y: +p.year, m: +p.month, d: +p.day, hh: +p.hour, mm: +p.minute };
}

export function dueTimes(cfg, now) {
  const lp = localParts(now, cfg.tz || 'Europe/Madrid');
  const already = cfg.sent?.day === lp.day ? cfg.sent.times || [] : [];
  const due = (cfg.times || []).filter(t => {
    const [h, m] = t.split(':').map(Number);
    const diff = lp.minutes - (h * 60 + m);
    return diff >= 0 && diff < WINDOW_MIN && !already.includes(t);
  });
  return { lp, due, already };
}

export function message(streak, rnd = Math.random, lang = 'en') {
  const pick = a => a[Math.floor(rnd() * a.length)];
  if (lang !== 'es') {
    const d = streak === 1 ? 'day' : 'days';
    if (streak > 0) {
      return pick([
        { title: `🔥 Your ${streak}-day streak is waiting`, body: 'You have not trained today yet. A couple of puzzles and you keep it.' },
        { title: `🔥 Don't lose ${streak} ${d} of streak!`, body: 'A few minutes of tactics is enough to keep going.' },
        { title: '♞ The woodpecker never rests', body: `${streak} ${d} in a row. Time to keep pecking today.` },
      ]);
    }
    return pick([
      { title: '♞ A few puzzles today?', body: 'Your Woodpecker cycles are waiting. 5 minutes is enough.' },
      { title: '♞ Time for some tactics', body: 'Start a new streak today with a couple of puzzles.' },
    ]);
  }
  const d = streak === 1 ? 'día' : 'días';
  if (streak > 0) {
    return pick([
      { title: `🔥 Tu racha de ${streak} ${d} te espera`, body: 'Aún no has entrenado hoy. Un par de ejercicios y la mantienes.' },
      { title: `🔥 ¡No pierdas ${streak} ${d} de racha!`, body: 'Unos minutos de táctica bastan para seguir sumando.' },
      { title: '♞ El pájaro carpintero no descansa', body: `Llevas ${streak} ${d} seguidos. Hoy toca seguir picando.` },
    ]);
  }
  return pick([
    { title: '♞ ¿Unos ejercicios hoy?', body: 'Tus ciclos Woodpecker te esperan. Con 5 minutos basta.' },
    { title: '♞ Hora de entrenar táctica', body: 'Empieza hoy una nueva racha con un par de ejercicios.' },
  ]);
}

/**
 * Checks every user with reminders and sends the ones that are due.
 * deps: { db (firebase-admin Firestore), now, sendPush(sub, payload), sendEmail(to, msg), getEmail(uid), log }
 */
export async function runReminders({ db, now = new Date(), sendPush, sendEmail, getEmail, log = console.log }) {
  const snap = await db.collection('reminders').where('enabled', '==', true).get();
  const stats = { users: snap.size, sent: 0, skipped: 0 };
  for (const doc of snap.docs) {
    const uid = doc.id;
    const cfg = doc.data();
    const { lp, due, already } = dueTimes(cfg, now);
    if (!due.length) continue;
    const markSent = () => doc.ref.set({ sent: { day: lp.day, times: [...already, ...due] } }, { merge: true });
    try {
      const meta = (await db.doc(`users/${uid}/meta/main`).get()).data() || {};
      const days = meta.days || [];
      // Only if habit mode is still on and the user has not trained today
      if (!meta.habit?.enabled || days.includes(lp.day)) { stats.skipped++; await markSent(); continue; }
      // "now" with the user's local date and time, to compute the streak
      const localNow = new Date(lp.y, lp.m - 1, lp.d, lp.hh, lp.mm);
      const { streak } = compute({ days, frozen: meta.frozen || [], enabledAt: meta.habit.enabledAt, dismissed: meta.habit.dismissed }, localNow);
      const msg = message(streak, Math.random, cfg.lang);
      msg.lang = cfg.lang;
      if (cfg.push) {
        const devices = await doc.ref.collection('devices').get();
        for (const dev of devices.docs) {
          try {
            await sendPush(dev.data().sub, { ...msg, url: APP_URL });
          } catch (err) {
            // expired or revoked subscription: delete it
            if (err.statusCode === 404 || err.statusCode === 410) await dev.ref.delete();
            else log(`push ${uid}/${dev.id}: ${err.message}`);
          }
        }
      }
      if (cfg.email) {
        const to = await getEmail(uid);
        if (to) await sendEmail(to, msg);
      }
      stats.sent++;
      await markSent();
    } catch (err) {
      log(`recordatorio ${uid}: ${err.message}`);
    }
  }
  return stats;
}

// Sends a test reminder to the user, without checking whether they trained
export async function sendTest({ db, uid, sendPush, sendEmail, getEmail }) {
  const ref = db.doc(`reminders/${uid}`);
  const cfg = (await ref.get()).data() || {};
  const msg = cfg.lang !== 'es'
    ? { title: '♞ Test reminder', body: 'This is how your training reminders will look. Everything works!', lang: 'en' }
    : { title: '♞ Recordatorio de prueba', body: 'Así te llegarán los avisos para entrenar. ¡Todo funciona!', lang: 'es' };
  const result = { push: 0, email: false };
  if (cfg.push) {
    for (const dev of (await ref.collection('devices').get()).docs) {
      try { await sendPush(dev.data().sub, { ...msg, url: APP_URL }); result.push++; }
      catch (err) { if (err.statusCode === 404 || err.statusCode === 410) await dev.ref.delete(); }
    }
  }
  if (cfg.email) {
    const to = await getEmail(uid);
    if (to) { await sendEmail(to, msg); result.email = true; }
  }
  return result;
}

export function emailHtml(msg) {
  const en = msg.lang !== 'es';
  return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;background:#161512;color:#e8e6e3;border-radius:12px">
  <h2 style="margin:0 0 8px">${msg.title}</h2>
  <p style="color:#bdb8b0">${msg.body}</p>
  <p><a href="${APP_URL}" style="display:inline-block;background:#6fa83a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">${en ? 'Train now' : 'Entrenar ahora'}</a></p>
  <p style="color:#7d786f;font-size:12px">${en
    ? 'You get this email because you enabled reminders in Woodpecker. You can turn them off in Settings → Habit mode.'
    : 'Recibes este email porque activaste los recordatorios en Woodpecker. Puedes desactivarlos en Ajustes → Modo hábito.'}</p>
</div>`;
}
