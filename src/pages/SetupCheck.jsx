import { useState } from 'react';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/UI/Button';

// Pagina di autodiagnosi del setup (solo in sviluppo): verifica che le variabili VITE_*
// siano presenti e prova una scrittura/lettura/cancellazione reale su Firestore,
// riportando l'eventuale codice d'errore. Assente in produzione.

const ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_GEMINI_API_KEY',
];

export function SetupCheck() {
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  if (!import.meta.env.DEV) return <p>Non disponibile in produzione.</p>;

  const envReport = ENV_KEYS.map((k) => ({
    key: k,
    present: Boolean(import.meta.env[k]),
  }));

  const runFirestoreTest = async () => {
    if (!user) {
      setResult({ ok: false, message: 'Fai prima login: il test scrive sotto il tuo utente.' });
      return;
    }
    setRunning(true);
    setResult(null);
    const ref = doc(db, 'users', user.uid, '_diagnostica', 'ping');
    try {
      await setDoc(ref, { at: serverTimestamp(), nota: 'test scrittura' });
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Scrittura riuscita ma lettura vuota (incoerenza).');
      await deleteDoc(ref);
      setResult({
        ok: true,
        message: 'Firestore raggiungibile e scrivibile: scrittura, lettura e cancellazione OK.',
      });
    } catch (err) {
      // I codici piu' comuni: 'permission-denied' (Security Rules non pubblicate o
      // non corrispondenti), 'unavailable' (DB non creato / offline), 'unauthenticated'.
      setResult({
        ok: false,
        message: `Errore Firestore: ${err.code || ''} ${err.message}`,
        hint: hintFor(err.code),
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Verifica setup</h1>
        <p>Controllo rapido di variabili d'ambiente e connessione a Firestore (solo sviluppo).</p>
      </div>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Variabili d'ambiente</h2>
        <ul>
          {envReport.map((e) => (
            <li key={e.key}>
              {e.present ? '✅' : '❌'} {e.key} {e.present ? 'presente' : 'MANCANTE nel .env.local'}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Connessione Firestore</h2>
        <p>Utente: {user ? user.email : 'nessuno (fai login)'}</p>
        <Button onClick={runFirestoreTest} disabled={running}>
          {running ? 'Provo...' : 'Esegui test scrittura/lettura'}
        </Button>
        {result && (
          <p style={{ marginTop: '1rem', color: result.ok ? 'green' : 'var(--color-danger, #c0392b)' }}>
            {result.ok ? '✅ ' : '❌ '}{result.message}
            {result.hint && <><br /><em>{result.hint}</em></>}
          </p>
        )}
      </section>
    </div>
  );
}

function hintFor(code) {
  switch (code) {
    case 'permission-denied':
      return 'Le Security Rules bloccano la richiesta. Pubblicale con: firebase deploy --only firestore:rules (e controlla che match /users/{uid} con request.auth.uid == uid).';
    case 'unavailable':
      return 'Il database non risponde: assicurati di aver creato Firestore Database nella console (non solo il progetto).';
    case 'unauthenticated':
      return 'Sessione non autenticata: rifai il login.';
    default:
      return 'Controlla che il Project ID nel .env.local coincida con quello della console e che Firestore sia stato creato.';
  }
}
