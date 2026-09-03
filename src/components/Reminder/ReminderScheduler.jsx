import { useEffect } from 'react';
import { useReminderPref } from '../../hooks/useReminderPref';
import { permissionStatus, showNotification } from '../../services/notifications';

// Pianifica il promemoria giornaliero all'orario scelto dall'utente e si
// ripianifica per il giorno successivo. Non renderizza nulla.
export function ReminderScheduler() {
  const { pref } = useReminderPref();

  useEffect(() => {
    if (!pref.enabled || permissionStatus() !== 'granted') return;

    let timer;
    const schedule = () => {
      const [h, m] = pref.time.split(':').map(Number);
      const now = new Date();
      const next = new Date();
      next.setHours(h, m, 0, 0);
      // Se l'orario di oggi e' gia' passato, punto a domani.
      if (next <= now) next.setDate(next.getDate() + 1);

      timer = setTimeout(async () => {
        await showNotification('HabitForge', {
          body: 'È il momento di spuntare le tue abitudini di oggi 💪',
          tag: 'daily-reminder',
        });
        schedule();
      }, next - now);
    };

    schedule();
    return () => clearTimeout(timer);
  }, [pref.enabled, pref.time]);

  return null;
}
