import { useState } from 'react';
import { useReminderPref } from '../../hooks/useReminderPref';
import {
  notificationsSupported,
  permissionStatus,
  requestPermission,
  showNotification,
} from '../../services/notifications';
import { Button } from '../UI/Button';
import styles from './ReminderSettings.module.css';

// Impostazioni del promemoria giornaliero. Il permesso lo chiedo solo quando
// l'utente attiva l'interruttore o prova una notifica: cosi' la richiesta arriva
// in un momento in cui ha senso, non a freddo all'apertura dell'app.
export function ReminderSettings() {
  const { pref, setEnabled, setTime } = useReminderPref();
  const [perm, setPerm] = useState(permissionStatus());

  if (!notificationsSupported()) {
    return (
      <section className={styles.card}>
        <h3>Promemoria giornaliero</h3>
        <p>Questo browser non supporta le notifiche.</p>
      </section>
    );
  }

  const toggle = async () => {
    // Sto attivando: se il permesso non e' ancora stato dato, lo chiedo ora.
    if (!pref.enabled) {
      let p = permissionStatus();
      if (p === 'default') p = await requestPermission();
      setPerm(p);
      if (p !== 'granted') return; // negato: non attivo il promemoria
    }
    setEnabled(!pref.enabled);
  };

  const sendTest = async () => {
    let p = permissionStatus();
    if (p === 'default') p = await requestPermission();
    setPerm(p);
    if (p === 'granted') {
      await showNotification('HabitForge', {
        body: 'Notifica di prova: funziona! 🎉',
        tag: 'test',
      });
    }
  };

  return (
    <section className={styles.card}>
      <h3>Promemoria giornaliero</h3>
      <p className={styles.desc}>
        Ricevi una notifica all'orario che scegli, per ricordarti di spuntare le abitudini.
      </p>

      <div className={styles.row}>
        <label className={styles.switch}>
          <input type="checkbox" checked={pref.enabled} onChange={toggle} />
          <span>{pref.enabled ? 'Attivo' : 'Disattivo'}</span>
        </label>
        <input
          type="time"
          className={styles.time}
          value={pref.time}
          onChange={(e) => setTime(e.target.value)}
          disabled={!pref.enabled}
          aria-label="Orario del promemoria"
        />
      </div>

      {perm === 'denied' && (
        <p className={styles.warn}>
          Le notifiche sono bloccate per questo sito: riattivale dalle impostazioni del browser.
        </p>
      )}

      <Button variant="secondary" onClick={sendTest}>
        Invia una notifica di prova
      </Button>
    </section>
  );
}
