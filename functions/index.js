// Firebase Functions: daily reminders (push and email).
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import webpush from 'web-push';
import nodemailer from 'nodemailer';
import { runReminders, sendTest, emailHtml } from './reminders.js';

initializeApp();

const VAPID_PUBLIC_KEY = 'BG_FbsQzrpVMQhq2iBvW1Sz8RSlobZLftrfgIBCuRPxRGr8PV8aBUiS1AS090Kd2PJhqBNYbHnb7qgq8zB5j_Q0';
const VAPID_PRIVATE_KEY = defineSecret('VAPID_PRIVATE_KEY');
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');
const GMAIL_USER = defineString('GMAIL_USER', { description: 'Gmail account that sends the reminders' });

function senders() {
  webpush.setVapidDetails('mailto:' + GMAIL_USER.value(), VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY.value());
  let mailer = null;
  return {
    sendPush: (sub, payload) => webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 3600, urgency: 'normal' }),
    sendEmail: async (to, msg) => {
      mailer = mailer || nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER.value(), pass: GMAIL_APP_PASSWORD.value() } });
      await mailer.sendMail({ from: `"Woodpecker" <${GMAIL_USER.value()}>`, to, subject: msg.title, text: `${msg.body}

https://woodpecker-93e04.web.app/`, html: emailHtml(msg) });
    },
    getEmail: async uid => (await getAuth().getUser(uid)).email,
  };
}

export const sendReminders = onSchedule({
  schedule: 'every 5 minutes',
  region: 'europe-west1',
  timeoutSeconds: 120,
  memory: '256MiB',
  maxInstances: 1,
  secrets: [VAPID_PRIVATE_KEY, GMAIL_APP_PASSWORD],
}, async () => {
  const stats = await runReminders({ db: getFirestore(), ...senders() });
  if (stats.sent) console.log('Reminders sent', stats);
});

export const testReminder = onCall({
  region: 'europe-west1',
  memory: '256MiB',
  maxInstances: 2,
  secrets: [VAPID_PRIVATE_KEY, GMAIL_APP_PASSWORD],
}, async req => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  return sendTest({ db: getFirestore(), uid: req.auth.uid, ...senders() });
});

// ---------- private library ----------
// PGN files for the owner's private sections (e.g. pawn structures). They live in functions/private/<shelf>/,
// which is not in git and is only deployed with the function: the files are returned only to the owner.
const LIBRARY_OWNER = 'HVCLXy57NDgXPkbrQSVZuAPBunA3';
const LIBRARY_DIR = new URL('./private/', import.meta.url);
export const library = onCall({ region: 'europe-west1', memory: '256MiB', maxInstances: 2 }, async req => {
  if (req.auth?.uid !== LIBRARY_OWNER) throw new HttpsError('permission-denied', 'Private section');
  const { readdir, readFile } = await import('node:fs/promises');
  const shelf = String(req.data?.shelf || '');
  if (!/^[a-z0-9-]+$/.test(shelf)) throw new HttpsError('invalid-argument', 'Bad shelf');
  const dir = new URL(shelf + '/', LIBRARY_DIR);
  const files = (await readdir(dir).catch(() => [])).filter(f => f.toLowerCase().endsWith('.pgn')).sort();
  const info = f => {
    const base = f.replace(/\.pgn$/i, '');
    const m = base.match(/^(\d+)[\s._-]*(.*)$/);
    return { id: base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), n: m ? +m[1] : 999, name: (m ? m[2] : base).replace(/[_-]+/g, ' ').trim() || base, file: f };
  };
  const list = files.map(info);
  if (!req.data?.id) return list.map(({ file, ...rest }) => rest);
  const f = list.find(x => x.id === req.data.id);
  if (!f) throw new HttpsError('not-found', 'No such file');
  return { id: f.id, n: f.n, name: f.name, pgn: await readFile(new URL(f.file, dir), 'utf8') };
});
