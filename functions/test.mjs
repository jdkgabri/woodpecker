// Pruebas de runReminders contra el emulador de Firestore:
//   npx firebase emulators:exec --only firestore --project demo-woodpecker "cd functions && node test.mjs"
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { runReminders, dueTimes } from './reminders.js';

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Ejecutar con el emulador de Firestore');
initializeApp({ projectId: 'demo-woodpecker' });
const db = getFirestore();

let failed = 0;
const check = (name, ok, extra = '') => { if (!ok) failed++; console.log(ok ? 'OK  ' : 'FAIL', name, ok ? '' : extra); };

const enabledAt = new Date('2026-10-01T10:00:00Z').getTime();
async function user(uid, { habit = true, days = [], times = ['20:00'], push = true, email = true, devices = ['dev1'] }) {
  await db.doc(`users/${uid}/meta/main`).set({ days, frozen: [], habit: { enabled: habit, enabledAt, updatedAt: 1 } });
  await db.doc(`reminders/${uid}`).set({ enabled: true, push, email, times, tz: 'Europe/Madrid' });
  for (const d of devices) await db.doc(`reminders/${uid}/devices/${d}`).set({ sub: { endpoint: `https://push.example/${uid}/${d}` } });
}

const sent = [];
const deps = now => ({
  db, now,
  sendPush: async (sub, payload) => {
    if (sub.endpoint.endsWith('/dead')) { const e = new Error('Gone'); e.statusCode = 410; throw e; }
    sent.push({ kind: 'push', to: sub.endpoint, title: payload.title });
  },
  sendEmail: async (to, msg) => sent.push({ kind: 'email', to, title: msg.title }),
  getEmail: async uid => `${uid}@test.com`,
  log: () => {},
});

// Lunes 19 oct 2026; Madrid = UTC+2
await user('ana', { days: ['2026-10-17', '2026-10-18'], devices: ['dev1', 'dead'] }); // racha 2, no ha entrenado hoy
await user('ben', { days: ['2026-10-18', '2026-10-19'] });                            // ya entrenó hoy
await user('cris', { habit: false });                                                 // modo hábito desactivado
await user('dani', { times: ['21:00'] });                                             // aún no es su hora
await user('eva', { times: ['20:00', '22:30'], email: false });                       // varias horas, solo push
await user('finn', {});                                                               // en inglés
await db.doc('reminders/finn').set({ lang: 'en' }, { merge: true });

check('dueTimes: ventana de una hora', dueTimes({ times: ['20:00'], tz: 'Europe/Madrid' }, new Date('2026-10-19T18:59:00Z')).due.length === 1
  && dueTimes({ times: ['20:00'], tz: 'Europe/Madrid' }, new Date('2026-10-19T19:00:00Z')).due.length === 0);

await runReminders(deps(new Date('2026-10-19T18:02:00Z'))); // 20:02 en Madrid
const s1 = sent.splice(0);
check('ana recibe push y email', s1.filter(x => x.to.includes('ana')).length === 2, JSON.stringify(s1));
check('mensaje con su racha de 2 días', s1.some(x => x.to.includes('ana') && /2 días/.test(x.title)), JSON.stringify(s1));
check('ben no (ya entrenó hoy)', !s1.some(x => x.to.includes('ben')));
check('cris no (modo hábito desactivado)', !s1.some(x => x.to.includes('cris')));
check('dani no (su hora es las 21:00)', !s1.some(x => x.to.includes('dani')));
check('eva recibe solo push', s1.filter(x => x.to.includes('eva')).map(x => x.kind).join() === 'push');
check('finn lo recibe en inglés', s1.some(x => x.to.includes('finn') && /puzzles|tactics|streak|woodpecker/i.test(x.title)), JSON.stringify(s1.filter(x => x.to.includes('finn'))));
check('suscripción caducada eliminada', !(await db.doc('reminders/ana/devices/dead').get()).exists);

await runReminders(deps(new Date('2026-10-19T18:07:00Z')));
check('no se repite en la siguiente ejecución', sent.splice(0).length === 0);

await runReminders(deps(new Date('2026-10-19T19:03:00Z'))); // 21:03
const s3 = sent.splice(0);
check('dani recibe a las 21:00', s3.some(x => x.to.includes('dani')) && !s3.some(x => x.to.includes('ana')), JSON.stringify(s3));

await db.doc('users/eva/meta/main').set({ days: ['2026-10-19'] }, { merge: true }); // eva entrena a las 21:30
await runReminders(deps(new Date('2026-10-19T20:31:00Z'))); // 22:31
check('eva no recibe el de las 22:30 porque ya entrenó', !sent.splice(0).some(x => x.to.includes('eva')));

await runReminders(deps(new Date('2026-10-20T18:01:00Z'))); // martes 20:01
const s5 = sent.splice(0);
check('al día siguiente ana vuelve a recibirlo', s5.some(x => x.to.includes('ana')), JSON.stringify(s5));

process.exit(failed ? 1 : 0);
