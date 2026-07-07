// CRUD generico su Firestore, con onSnapshot per il realtime. Struttura:
// users/{uid}/{collezione}/{docId} per habits, completions, goals, diary; profilo,
// report e citazione del giorno sono campi del documento users/{uid}.

import {
  collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

// I campi del documento utente li scrivo con setDoc + { merge: true }: updateDoc
// fallirebbe se users/{uid} non esiste ancora, il merge lo crea senza toccare il resto.
const mergeUserDoc = (uid, patch) => setDoc(doc(db, 'users', uid), patch, { merge: true });

// Helper: se passo docId punto al documento, altrimenti alla collezione.
const path = (uid, name, docId) =>
  docId ? doc(db, 'users', uid, name, docId) : collection(db, 'users', uid, name);

export async function getCollection(uid, name) {
  const snap = await getDocs(path(uid, name));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addDocument(uid, name, data) {
  const ref = await addDoc(path(uid, name), data);
  return ref.id;
}

export async function setDocument(uid, name, docId, data) {
  await setDoc(path(uid, name, docId), data);
}

export async function updateDocument(uid, name, docId, patch) {
  await updateDoc(path(uid, name, docId), patch);
}

export async function deleteDocument(uid, name, docId) {
  await deleteDoc(path(uid, name, docId));
}

// Realtime: onSnapshot notifica a ogni cambiamento della collezione.
// Ritorna la unsubscribe, che il DataContext accumula e chiama nel cleanup.
export function subscribeCollection(uid, name, callback) {
  return onSnapshot(path(uid, name), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Realtime sul documento utente: profile, dailyReport e dailyQuote cambiano come
// campi di users/{uid}. Sottoscriverlo con onSnapshot fa aggiornare la
// UI senza ricaricare la pagina.
export function subscribeUserDoc(uid, callback) {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}

// Il profilo di personalita' e' un campo del documento utente, non una sottocollezione.
export async function saveProfile(uid, profile) {
  await mergeUserDoc(uid, { profile });
}

// Citazione motivazionale del giorno. E' un campo del documento utente (come
// dailyReport) e arriva live via onSnapshot. source: 'local' (lista filosofi) o 'ai'.
export async function setDailyQuote(uid, quote, dateISO) {
  await mergeUserDoc(uid, {
    dailyQuote: { ...quote, date: dateISO },
  });
}

export async function setDailyReport(uid, text, dateISO) {
  await mergeUserDoc(uid, {
    dailyReport: { text, date: dateISO },
  });
}
