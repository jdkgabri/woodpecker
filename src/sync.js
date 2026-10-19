// Sincronización opcional con Firebase (login con Google + Firestore).
// El almacenamiento local sigue siendo la fuente de verdad: aquí solo se replica.
// Estructura en Firestore:
//   users/{uid}/sets/{setId}  -> { json: "<set serializado>", updatedAt }
//   users/{uid}/meta/main     -> { deleted: { setId: timestamp }, days: [...] }
// (los sets se guardan como texto porque Firestore no admite arrays anidados)
import { firebaseConfig } from './firebase-config.js';
import * as store from './store.js';

// Solo para pruebas locales con los emuladores de Firebase (VITE_EMU=1 npm run dev)
const EMU = import.meta.env.VITE_EMU;
const config = EMU ? { apiKey: 'demo-key', projectId: 'demo-woodpecker', authDomain: 'localhost' } : firebaseConfig;

export const state = { configured: !!config?.apiKey, user: null, status: 'off', lastSync: null, error: null };
const listeners = new Set();
export const onChange = f => { listeners.add(f); return () => listeners.delete(f); };
const emit = () => listeners.forEach(f => f(state));

let fb = null;
let uid = null;
let unsubs = [];
let remoteVersions = new Map(); // setId -> updatedAt que hay en la nube
let remoteDeleted = {};
let remoteDays = new Set();
let pushTimer = null;
let pushing = null;
let firstSnapshot = false;

async function init() {
  if (fb) return fb;
  const [{ initializeApp }, A, F] = await Promise.all([
    import('firebase/app'), import('firebase/auth'), import('firebase/firestore'),
  ]);
  const app = initializeApp(config);
  const auth = A.getAuth(app); // la sesión se guarda en IndexedDB: no caduca al cerrar la app
  const db = F.getFirestore(app);
  if (EMU) {
    A.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    F.connectFirestoreEmulator(db, '127.0.0.1', 8080);
    window.__fb = { auth, A };
  }
  fb = { auth, db, A, F };
  return fb;
}

export async function start(onRemoteChange) {
  if (!state.configured) return;
  const { auth, A } = await init();
  A.getRedirectResult(auth).catch(e => { state.error = e.message; emit(); });
  A.onAuthStateChanged(auth, user => {
    unsubs.forEach(u => u());
    unsubs = [];
    remoteVersions = new Map();
    firstSnapshot = false;
    uid = user?.uid || null;
    state.user = user ? { email: user.email, name: user.displayName, photo: user.photoURL } : null;
    state.status = user ? 'syncing' : 'off';
    state.error = null;
    emit();
    if (user) subscribe(onRemoteChange);
  });
  store.onSave(() => schedulePush());
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  window.addEventListener('online', () => schedulePush(0));
}

function subscribe(onRemoteChange) {
  const { db, F } = fb;
  const setsCol = F.collection(db, 'users', uid, 'sets');
  const metaDoc = F.doc(db, 'users', uid, 'meta', 'main');
  let gotSets = false, gotMeta = false;
  const ready = () => {
    if (gotSets && gotMeta && !firstSnapshot) {
      firstSnapshot = true;
      schedulePush(0); // sube lo que solo existe (o es más nuevo) en este dispositivo
    }
  };
  unsubs.push(F.onSnapshot(metaDoc, snap => {
    const m = snap.data() || {};
    remoteDeleted = m.deleted || {};
    remoteDays = new Set(m.days || []);
    if (store.applyRemote({ deleted: remoteDeleted, days: [...remoteDays] })) onRemoteChange?.();
    gotMeta = true;
    ready();
  }, onError));
  unsubs.push(F.onSnapshot(setsCol, snap => {
    const sets = [];
    snap.docChanges().forEach(ch => {
      if (ch.type === 'removed') { remoteVersions.delete(ch.doc.id); return; }
      const d = ch.doc.data();
      remoteVersions.set(ch.doc.id, d.updatedAt);
      if (ch.doc.metadata.hasPendingWrites) return;
      try { sets.push({ ...JSON.parse(d.json), updatedAt: d.updatedAt }); } catch (e) { console.error(e); }
    });
    if (sets.length && store.applyRemote({ sets })) onRemoteChange?.();
    gotSets = true;
    state.lastSync = Date.now();
    if (state.status !== 'error') state.status = 'ok';
    emit();
    ready();
  }, onError));
}

function onError(e) {
  console.error(e);
  state.status = 'error';
  state.error = e.code === 'permission-denied' ? 'Permiso denegado: revisa las reglas de Firestore.' : e.message;
  emit();
}

function schedulePush(delay = 2000) {
  if (!uid || !firstSnapshot) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(push, delay);
}

export function flush() {
  clearTimeout(pushTimer);
  return push();
}

async function push() {
  if (!uid || !firstSnapshot) return;
  if (pushing) { await pushing; }
  pushing = (async () => {
    const { db, F } = fb;
    const data = store.rawData();
    const batch = F.writeBatch(db);
    const sent = [];
    let n = 0;
    for (const s of data.sets) {
      if ((remoteVersions.get(s.id) || 0) >= s.updatedAt) continue;
      const { updatedAt, ...rest } = s;
      batch.set(F.doc(db, 'users', uid, 'sets', s.id), { json: JSON.stringify(rest), updatedAt });
      sent.push([s.id, remoteVersions.get(s.id)]);
      remoteVersions.set(s.id, updatedAt);
      n++;
    }
    const newDeleted = {};
    for (const [id, t] of Object.entries(data.deleted)) {
      if (!remoteDeleted[id] || remoteDeleted[id] < t) newDeleted[id] = t;
      if (remoteVersions.has(id) && remoteVersions.get(id) <= t) {
        batch.delete(F.doc(db, 'users', uid, 'sets', id));
        remoteVersions.delete(id);
        n++;
      }
    }
    const newDays = data.days.filter(d => !remoteDays.has(d));
    if (Object.keys(newDeleted).length || newDays.length) {
      const meta = {};
      if (Object.keys(newDeleted).length) meta.deleted = newDeleted;
      if (newDays.length) meta.days = F.arrayUnion(...newDays);
      batch.set(F.doc(db, 'users', uid, 'meta', 'main'), meta, { merge: true });
      Object.assign(remoteDeleted, newDeleted);
      newDays.forEach(d => remoteDays.add(d));
      n++;
    }
    if (!n) return;
    state.status = 'syncing';
    emit();
    try {
      await batch.commit();
      state.status = 'ok';
      state.error = null;
      state.lastSync = Date.now();
    } catch (e) {
      // se reintentará en el siguiente guardado
      for (const [id, v] of sent) v === undefined ? remoteVersions.delete(id) : remoteVersions.set(id, v);
      onError(e);
      return;
    }
    emit();
  })();
  try { await pushing; } finally { pushing = null; }
}

export async function signIn() {
  const { auth, A } = await init();
  const provider = new A.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await A.signInWithPopup(auth, provider);
  } catch (e) {
    if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(e.code)) {
      await A.signInWithRedirect(auth, provider);
    } else if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(e.code)) {
      throw e;
    }
  }
}

export async function signOut() {
  await flush().catch(() => {});
  const { auth, A } = await init();
  await A.signOut(auth);
}
