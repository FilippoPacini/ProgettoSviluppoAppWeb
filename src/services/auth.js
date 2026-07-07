// Autenticazione con Firebase Auth. Alla registrazione creo anche il documento utente
// su Firestore, dove vivono profile, dailyReport e dailyQuote.

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { toISODate } from '../utils/dateUtils';

// Se Firestore non risponde (es. database non creato) l'operazione resterebbe appesa:
// la avvolgo in un timeout che rigetta con un messaggio chiaro.
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
  // Documento utente iniziale. Col timeout, se Firestore non risponde l'utente
  // vede un errore chiaro invece di un pulsante bloccato.
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

// onAuthStateChanged reagisce ai cambi di sessione (login, logout, reload pagina).
// Restituisce la funzione di unsubscribe, che l'AuthContext chiama nel cleanup.
export function observeAuth(callback) {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) return callback(null);
    const hydrated = await hydrateUser(fbUser);
    callback(hydrated);
  });
}

// Unisco i dati di Auth con il documento Firestore. La lettura del profilo non deve
// bloccare l'accesso: se fallisce o va in timeout restituisco i dati base, il profilo
// arriva poi via onSnapshot.
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
  // createdAt su Firestore e' un Timestamp: lo porto a stringa 'YYYY-MM-DD' cosi
  // formatLong (che si aspetta una data ISO) lo mostra correttamente nel profilo.
  const createdAt = data.createdAt?.toDate
    ? toISODate(data.createdAt.toDate())
    : (typeof data.createdAt === 'string' ? data.createdAt : toISODate(new Date()));
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName || data.displayName || '',
    createdAt,
    profile: data.profile || null,
    dailyReport: data.dailyReport || null,
    dailyQuote: data.dailyQuote || null,
  };
}
