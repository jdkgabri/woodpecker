// Lógica de los recordatorios (independiente de Firebase Functions para poder probarla).
import { compute } from './habit.js';

const WINDOW_MIN = 60; // se avisa durante la hora siguiente a la elegida (por si una ejecución se retrasa)
export const APP_URL = 'https://jdkgabri.github.io/woodpecker/';

// Fecha local 'YYYY-MM-DD' y minutos desde medianoche en la zona horaria del usuario
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

export function message(streak, rnd = Math.random, lang = 'es') {
  const pick = a => a[Math.floor(rnd() * a.length)];
  if (lang === 'en') {
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
 * Revisa todos los usuarios con recordatorios y envía los que tocan.
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
      // Solo si el modo hábito sigue activo y hoy aún no ha entrenado
      if (!meta.habit?.enabled || days.includes(lp.day)) { stats.skipped++; await markSent(); continue; }
      // "now" con la fecha y hora locales del usuario, para calcular la racha
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
            // suscripción caducada o revocada: se borra
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

// Envía un recordatorio de prueba al usuario, sin comprobar si ha entrenado
export async function sendTest({ db, uid, sendPush, sendEmail, getEmail }) {
  const ref = db.doc(`reminders/${uid}`);
  const cfg = (await ref.get()).data() || {};
  const msg = cfg.lang === 'en'
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
  const en = msg.lang === 'en';
  return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;background:#161512;color:#e8e6e3;border-radius:12px">
  <h2 style="margin:0 0 8px">${msg.title}</h2>
  <p style="color:#bdb8b0">${msg.body}</p>
  <p><a href="${APP_URL}" style="display:inline-block;background:#6fa83a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">${en ? 'Train now' : 'Entrenar ahora'}</a></p>
  <p style="color:#7d786f;font-size:12px">${en
    ? 'You get this email because you enabled reminders in Woodpecker. You can turn them off in Settings → Habit mode.'
    : 'Recibes este email porque activaste los recordatorios en Woodpecker. Puedes desactivarlos en Ajustes → Modo hábito.'}</p>
</div>`;
}
