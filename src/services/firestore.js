// CRUD generico su Firestore, con onSnapshot per il realtime. Struttura:
// users/{uid}/{collezione}/{docId} per habits, completions, goals, diary; profilo,
// report e citazione del giorno sono campi del documento users/{uid}.

import {
  collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot,
  arrayUnion, arrayRemove, writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

// setDoc + merge e non updateDoc: updateDoc fallirebbe se users/{uid} non esiste.
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

// arrayUnion/arrayRemove sono atomici lato server. Riscrivere l'array intero
// sarebbe read-modify-write e due spunte ravvicinate si sovrascriverebbero.
export async function addCompletion(uid, dateISO, habitId) {
  // merge: true crea il documento del giorno se non esiste ancora.
  await setDoc(path(uid, 'completions', dateISO), { habits: arrayUnion(habitId) }, { merge: true });
}

export async function removeCompletion(uid, dateISO, habitId) {
  await setDoc(path(uid, 'completions', dateISO), { habits: arrayRemove(habitId) }, { merge: true });
}

// Toglie l'abitudine dai giorni in cui compare. Batch atomico, blocchi da 500
// (limite Firestore).
export async function removeHabitFromCompletions(uid, habitId, dates) {
  for (let i = 0; i < dates.length; i += 500) {
    const batch = writeBatch(db);
    dates.slice(i, i + 500).forEach((dateISO) => {
      batch.set(path(uid, 'completions', dateISO), { habits: arrayRemove(habitId) }, { merge: true });
    });
    await batch.commit();
  }
}

// Realtime: onSnapshot notifica a ogni cambiamento della collezione.
// Ritorna la unsubscribe, che il DataContext accumula e chiama nel cleanup.
export function subscribeCollection(uid, name, callback) {
  return onSnapshot(path(uid, name), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Realtime sul documento utente: profile, dailyReport e dailyQuote sono suoi campi.
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

// Salvo anche ora e abitudini previste: servono a dire quanto e' fresco il report
// e a capire quando e' stato superato dai fatti.
export async function setDailyReport(uid, text, dateISO, scheduledCount) {
  await mergeUserDoc(uid, {
    dailyReport: {
      text,
      date: dateISO,
      scheduledCount: scheduledCount ?? null,
      updatedAt: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    },
  });
}
