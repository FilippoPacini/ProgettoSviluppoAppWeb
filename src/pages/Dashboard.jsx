import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useHabits } from '../hooks/useHabits';
import { HabitCard } from '../components/HabitCard/HabitCard';
import { DailyReportCard } from '../components/DailyReport/DailyReportCard';
import { DailyQuoteCard } from '../components/DailyQuote/DailyQuoteCard';
import { Spinner } from '../components/UI/Spinner';
import { longestStreak } from '../utils/streakCalculator';
import { today, addDays, isoWeekday, formatLong } from '../utils/dateUtils';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { user } = useAuth();
  const { habits, completions, loading, toggleCompletion, isCompleted } = useHabits();

  const oggi = today();
  const weekday = isoWeekday(oggi);

  // Abitudini in programma oggi: le daily sempre, le custom solo nei loro giorni.
  const todaysHabits = useMemo(
    () => habits.filter((h) => h.frequency === 'daily' || h.days.includes(weekday)),
    [habits, weekday]
  );

  // Statistiche derivate. useMemo perché scorrono tutte le completions e non
  // devono ricalcolarsi a ogni render, solo quando cambiano i dati sottostanti.
  const stats = useMemo(() => {
    const doneToday = todaysHabits.filter((h) => isCompleted(h.id, oggi)).length;
    const totalToday = todaysHabits.length;

    // Percentuale sull’ultima settimana: completamenti effettivi su quelli attesi
    let expected = 0;
    let completed = 0;
    for (let i = 0; i < 7; i++) {
      const iso = addDays(oggi, -i);
      const wd = isoWeekday(iso);
      const scheduled = habits.filter((h) => h.frequency === 'daily' || h.days.includes(wd));
      expected += scheduled.length;
      completed += (completions[iso] || []).length;
    }
    const weeklyRate = expected > 0 ? Math.round((completed / expected) * 100) : 0;

    // Streak più lunga tra tutte le abitudini
    const best = habits.reduce((max, h) => Math.max(max, longestStreak(h, completions)), 0);

    return { doneToday, totalToday, weeklyRate, best };
  }, [habits, todaysHabits, completions, isCompleted, oggi]);

  if (loading) {
    return (
      <div className="page-container">
        <Spinner label="Carico le tue abitudini..." />
      </div>
    );
  }

  const firstName = user ? user.displayName.split(' ')[0] : '';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Ciao, {firstName} 👋</h1>
        <p>{formatLong(oggi)}</p>
      </div>

      <DailyReportCard />
      <DailyQuoteCard />

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {stats.doneToday}/{stats.totalToday}
          </span>
          <span className={styles.statLabel}>Oggi completate</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.weeklyRate}%</span>
          <span className={styles.statLabel}>Ultima settimana</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>🔥 {stats.best}</span>
          <span className={styles.statLabel}>Streak record</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{habits.length}</span>
          <span className={styles.statLabel}>Abitudini attive</span>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Abitudini di oggi</h2>
          <Link to="/habits" className={styles.link}>
            Gestisci
          </Link>
        </div>

        {todaysHabits.length === 0 ? (
          <p className={styles.empty}>
            Nessuna abitudine in programma oggi. <Link to="/habits">Aggiungine una</Link>.
          </p>
        ) : (
          <div className={styles.habitList}>
            {todaysHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                completions={completions}
                done={isCompleted(habit.id, oggi)}
                onToggle={(id) => toggleCompletion(id, oggi)}
              />
            ))}
          </div>
        )}
      </section>

      <section className={styles.quickLinks}>
        <Link to="/diary" className={styles.quickCard}>
          <span className={styles.quickIcon}>📓</span>
          <span>Scrivi sul diario</span>
        </Link>
        <Link to="/goals" className={styles.quickCard}>
          <span className={styles.quickIcon}>🎯</span>
          <span>I tuoi obiettivi</span>
        </Link>
        <Link to="/coach" className={styles.quickCard}>
          <span className={styles.quickIcon}>🤖</span>
          <span>Chiedi al coach</span>
        </Link>
      </section>
    </div>
  );
}
