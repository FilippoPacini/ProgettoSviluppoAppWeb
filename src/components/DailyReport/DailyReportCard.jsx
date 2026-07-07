import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useHabits } from '../../hooks/useHabits';
import { useGoals } from '../../hooks/useGoals';
import { useDiary } from '../../hooks/useDiary';
import { generateDailyReport, buildUserSnapshot } from '../../services/gemini';
import { setDailyReport } from '../../services/firestore';
import { today } from '../../utils/dateUtils';
import styles from './DailyReportCard.module.css';

// Report motivazionale del giorno. Generato UNA volta al giorno per utente:
// il controllo cached.date === oggi evita chiamate ripetute se apro l'app piu'
// volte nello stesso giorno. Il testo e' salvato su Firestore (dailyReport).
export function DailyReportCard() {
  const { user } = useAuth();
  const { habits, completions } = useHabits();
  const { goals } = useGoals();
  const { diary } = useDiary();
  const [loading, setLoading] = useState(false);

  const oggi = today();
  const cached = user?.dailyReport;
  const isFresh = cached?.date === oggi;

  useEffect(() => {
    if (!user || isFresh || habits.length === 0) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const snap = buildUserSnapshot({ displayName: user.displayName, profile: user.profile, habits, completions, goals, diary });
        const text = await generateDailyReport(snap);
        if (!cancelled) await setDailyReport(user.uid, text, oggi);
      } catch (err) {
        console.error('Errore report giornaliero:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, oggi, isFresh, habits.length]);

  if (loading && !cached?.text) {
    return <div className={styles.card}>Sto preparando il tuo report di oggi...</div>;
  }
  if (!cached?.text) return null;

  return (
    <div className={styles.card}>
      <h3>Il tuo report di oggi</h3>
      <p>{cached.text}</p>
    </div>
  );
}
