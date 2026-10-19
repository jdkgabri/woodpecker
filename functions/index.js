// Firebase Functions: recordatorios diarios (push y email).
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret, defineString } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import webpush from 'web-push';
import nodemailer from 'nodemailer';
import { runReminders, emailHtml } from './reminders.js';

initializeApp();

const VAPID_PUBLIC_KEY = 'BG_FbsQzrpVMQhq2iBvW1Sz8RSlobZLftrfgIBCuRPxRGr8PV8aBUiS1AS090Kd2PJhqBNYbHnb7qgq8zB5j_Q0';
const VAPID_PRIVATE_KEY = defineSecret('VAPID_PRIVATE_KEY');
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');
const GMAIL_USER = defineString('GMAIL_USER', { description: 'Cuenta de Gmail que envía los recordatorios' });

export const sendReminders = onSchedule({
  schedule: 'every 5 minutes',
  region: 'europe-west1',
  timeoutSeconds: 120,
  memory: '256MiB',
  maxInstances: 1,
  secrets: [VAPID_PRIVATE_KEY, GMAIL_APP_PASSWORD],
}, async () => {
  webpush.setVapidDetails('mailto:' + GMAIL_USER.value(), VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY.value());
  let mailer = null;
  const stats = await runReminders({
    db: getFirestore(),
    sendPush: (sub, payload) => webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 3600, urgency: 'normal' }),
    sendEmail: async (to, msg) => {
      mailer = mailer || nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER.value(), pass: GMAIL_APP_PASSWORD.value() } });
      await mailer.sendMail({ from: `"Woodpecker" <${GMAIL_USER.value()}>`, to, subject: msg.title, text: `${msg.body}\n\nhttps://jdkgabri.github.io/woodpecker/`, html: emailHtml(msg) });
    },
    getEmail: async uid => (await getAuth().getUser(uid)).email,
  });
  if (stats.sent) console.log('Recordatorios enviados', stats);
});
