// Autenticazione con Firebase Auth. Alla registrazione creo anche il documento utente
// su Firestore, dove vivono profile, dailyReport e dailyQuote.

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { toISODate } from '../utils/dateUtils';

// Timeout sulle operazioni Firestore, per non restare appesi.
const FS_TIMEOUT_MS = 12000;
const FS_TIMEOUT_MSG =
  'Database non raggiungibile. Verifica di aver creato Firestore nel progetto Firebase e pubblicato le Security Rules.';

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return hydrateUser(cred.user);
}

export async function register(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  // Documento utente iniziale.
  await withTimeout(
    setDoc(doc(db, 'users', cred.user.uid), {
      email,
      displayName,
      createdAt: serverTimestamp(),
      profile: null,
      dailyReport: null,
      dailyQuote: null,
    }),
    FS_TIMEOUT_MS,
    FS_TIMEOUT_MSG
  );
  return hydrateUser(cred.user);
}

export async function logout() {
  return signOut(auth);
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export async function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error('Nessun utente autenticato.');
  // updatePassword richiede un accesso recente: rieseguo l'autenticazione
  // con la password attuale prima di cambiarla.
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  await ensureUserDoc(cred.user);
  return hydrateUser(cred.user);
}

// L'accesso con Google non passa da register(), quindi il documento utente va
// creato qui alla prima entrata, con gli stessi campi.
async function ensureUserDoc(fbUser) {
  const ref = doc(db, 'users', fbUser.uid);
  const snap = await withTimeout(getDoc(ref), FS_TIMEOUT_MS, FS_TIMEOUT_MSG);
  if (snap.exists()) return;
  await withTimeout(
    setDoc(ref, {
      email: fbUser.email,
      displayName: fbUser.displayName || '',
      createdAt: serverTimestamp(),
      profile: null,
      dailyReport: null,
      dailyQuote: null,
    }),
    FS_TIMEOUT_MS,
    FS_TIMEOUT_MSG
  );
}

// onAuthStateChanged reagisce ai cambi di sessione (login, logout, reload pagina).
// Restituisce la funzione di unsubscribe, che l'AuthContext chiama nel cleanup.
export function observeAuth(callback) {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) return callback(null);
    const hydrated = await hydrateUser(fbUser);
    callback(hydrated);
  });
}

// Auth + documento Firestore. Se la lettura fallisce torno i dati base: il profilo
// arriva comunque via onSnapshot.
async function hydrateUser(fbUser) {
  let data = {};
  try {
    const snap = await withTimeout(
      getDoc(doc(db, 'users', fbUser.uid)),
      FS_TIMEOUT_MS,
      FS_TIMEOUT_MSG
    );
    data = snap.exists() ? snap.data() : {};
  } catch (err) {
    console.warn('hydrateUser: profilo non letto,', err.message);
  }
  // createdAt e' un Timestamp: lo porto a 'YYYY-MM-DD' per formatLong.
  const createdAt = data.createdAt?.toDate
    ? toISODate(data.createdAt.toDate())
    : (typeof data.createdAt === 'string' ? data.createdAt : toISODate(new Date()));
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName || data.displayName || '',
    createdAt,
    // Metodi di accesso collegati all'account: un utente Google non ha password
    // da cambiare.
    providers: fbUser.providerData.map((p) => p.providerId),
    profile: data.profile || null,
    dailyReport: data.dailyReport || null,
    dailyQuote: data.dailyQuote || null,
  };
}
