import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useHabits } from '../../hooks/useHabits';
import { useGoals } from '../../hooks/useGoals';
import { useDiary } from '../../hooks/useDiary';
import { generateDailyReport, buildUserSnapshot } from '../../services/gemini';
import { setDailyReport } from '../../services/firestore';
import { scheduledHabitsOn } from '../../utils/scheduleUtils';
import { today } from '../../utils/dateUtils';
import styles from './DailyReportCard.module.css';

// Report del giorno: fotografia salvata su Firestore, generata una volta al giorno
// per non moltiplicare le chiamate AI. Da qui l'ora mostrata e il pulsante rigenera.
export function DailyReportCard() {
  const { user } = useAuth();
  const { habits, completions, loading: dataLoading } = useHabits();
  const { goals } = useGoals();
  const { diary } = useDiary();
  const [loading, setLoading] = useState(false);
  // Evita che due render ravvicinati facciano partire due chiamate insieme.
  const running = useRef(false);

  const oggi = today();
  const cached = user?.dailyReport;
  const previsteOggi = scheduledHabitsOn(habits, oggi).length;

  // Vale per la giornata e per quelle abitudini previste: se cambiano, va rifatto.
  const isFresh =
    cached?.date === oggi &&
    (cached.scheduledCount === undefined || cached.scheduledCount === previsteOggi);

  const generate = async () => {
    if (!user || running.current) return;
    running.current = true;
    setLoading(true);
    try {
      const snap = buildUserSnapshot({
        displayName: user.displayName,
        profile: user.profile,
        habits,
        completions,
        goals,
        diary,
      });
      const text = await generateDailyReport(snap);
      await setDailyReport(user.uid, text, oggi, previsteOggi);
    } catch (err) {
      console.error('Errore report giornaliero:', err);
    } finally {
      running.current = false;
      setLoading(false);
    }
  };

  // Aspetto dataLoading: zero abitudini deve essere un vero zero, non un array
  // ancora vuoto perche' lo snapshot non e' tornato.
  useEffect(() => {
    if (!user || isFresh || dataLoading) return;
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, oggi, isFresh, dataLoading]);

  if (loading && !cached?.text) {
    return <div className={styles.card}>Sto preparando il tuo report di oggi...</div>;
  }
  if (!cached?.text) return null;

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h3>Il tuo report di oggi</h3>
        <button
          className={styles.refresh}
          onClick={generate}
          disabled={loading}
          aria-label="Rigenera il report"
          title="Rigenera il report"
        >
          {loading ? '...' : '↻'}
        </button>
      </div>
      <p>{cached.text}</p>
      {cached.updatedAt && (
        <p className={styles.meta}>Aggiornato alle {cached.updatedAt}</p>
      )}
    </div>
  );
}
