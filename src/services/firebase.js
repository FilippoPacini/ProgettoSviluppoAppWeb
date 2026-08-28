// Inizializzazione di Firebase con la config dalle variabili d'ambiente Vite.
// Config pubblica lato client; l'isolamento dei dati e' demandato alle Security Rules.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Persistenza offline: disattiva di default, senza si perde tutto al refresh.
// persistentMultipleTabManager = cache condivisa fra schede (altrimenti
// 'failed-precondition'). initializeFirestore + localCache al posto di
// enableIndexedDbPersistence, deprecata in v11.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const isFirebaseReady = () => Boolean(app);
