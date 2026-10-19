// Tests of runReminders against the Firestore emulator:
//   npx firebase emulators:exec --only firestore --project demo-woodpecker "cd functions && node test.mjs"
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { runReminders, dueTimes } from './reminders.js';

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Run with the Firestore emulator');
initializeApp({ projectId: 'demo-woodpecker' });
const db = getFirestore();

let failed = 0;
const check = (name, ok, extra = '') => { if (!ok) failed++; console.log(ok ? 'OK  ' : 'FAIL', name, ok ? '' : extra); };

const enabledAt = new Date('2026-10-01T10:00:00Z').getTime();
async function user(uid, { habit = true, days = [], times = ['20:00'], push = true, email = true, devices = ['dev1'], lang } = {}) {
  await db.doc(`users/${uid}/meta/main`).set({ days, frozen: [], habit: { enabled: habit, enabledAt, updatedAt: 1 } });
  await db.doc(`reminders/${uid}`).set({ enabled: true, push, email, times, tz: 'Europe/Madrid', ...(lang ? { lang } : {}) });
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

// Monday 19 Oct 2026; Madrid = UTC+2
await user('ana', { days: ['2026-10-17', '2026-10-18'], devices: ['dev1', 'dead'] }); // 2-day streak, not trained today
await user('ben', { days: ['2026-10-18', '2026-10-19'] });                            // already trained today
await user('cris', { habit: false });                                                 // habit mode off
await user('dani', { times: ['21:00'] });                                             // not their time yet
await user('eva', { times: ['20:00', '22:30'], email: false });                       // several times, push only
await user('sofia', { days: ['2026-10-18'], lang: 'es' });                            // Spanish

check('dueTimes: one-hour window', dueTimes({ times: ['20:00'], tz: 'Europe/Madrid' }, new Date('2026-10-19T18:59:00Z')).due.length === 1
  && dueTimes({ times: ['20:00'], tz: 'Europe/Madrid' }, new Date('2026-10-19T19:00:00Z')).due.length === 0);

await runReminders(deps(new Date('2026-10-19T18:02:00Z'))); // 20:02 in Madrid
const s1 = sent.splice(0);
check('ana gets push and email', s1.filter(x => x.to.includes('ana')).length === 2, JSON.stringify(s1));
check('in English by default, with her 2-day streak', s1.some(x => x.to.includes('ana') && /2-day|2 days/.test(x.title)), JSON.stringify(s1));
check('sofia gets it in Spanish', s1.some(x => x.to.includes('sofia') && /día|ejercicios|táctica|racha|carpintero/i.test(x.title)), JSON.stringify(s1.filter(x => x.to.includes('sofia'))));
check('not ben (trained today)', !s1.some(x => x.to.includes('ben')));
check('not cris (habit mode off)', !s1.some(x => x.to.includes('cris')));
check('not dani (her time is 21:00)', !s1.some(x => x.to.includes('dani')));
check('eva gets push only', s1.filter(x => x.to.includes('eva')).map(x => x.kind).join() === 'push');
check('expired subscription deleted', !(await db.doc('reminders/ana/devices/dead').get()).exists);

await runReminders(deps(new Date('2026-10-19T18:07:00Z')));
check('not repeated on the next run', sent.splice(0).length === 0);

await runReminders(deps(new Date('2026-10-19T19:03:00Z'))); // 21:03
const s3 = sent.splice(0);
check('dani gets it at 21:00', s3.some(x => x.to.includes('dani')) && !s3.some(x => x.to.includes('ana')), JSON.stringify(s3));

await db.doc('users/eva/meta/main').set({ days: ['2026-10-19'] }, { merge: true }); // eva trains at 21:30
await runReminders(deps(new Date('2026-10-19T20:31:00Z'))); // 22:31
check('eva does not get the 22:30 one because she trained', !sent.splice(0).some(x => x.to.includes('eva')));

await runReminders(deps(new Date('2026-10-20T18:01:00Z'))); // Tuesday 20:01
const s5 = sent.splice(0);
check('ana gets it again the next day', s5.some(x => x.to.includes('ana')), JSON.stringify(s5));

process.exit(failed ? 1 : 0);
