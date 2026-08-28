import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useHabits } from '../hooks/useHabits';
import { useGoals } from '../hooks/useGoals';
import { HabitCard } from '../components/HabitCard/HabitCard';
import { DailyReportCard } from '../components/DailyReport/DailyReportCard';
import { DailyQuoteCard } from '../components/DailyQuote/DailyQuoteCard';
import { Modal } from '../components/UI/Modal';
import { Spinner } from '../components/UI/Spinner';
import { longestStreak } from '../utils/streakCalculator';
import { scheduledHabitsOn } from '../utils/scheduleUtils';
import { weeklyRateWithDelta, bestActiveStreak, nearestDeadline } from '../utils/statsUtils';
import { today, formatLong } from '../utils/dateUtils';
import styles from './Dashboard.module.css';

// Testo del pulsante info: come sono calcolate le quattro schede.
const STATS_GUIDE = [
  {
    titolo: 'Oggi',
    testo: 'Quante delle abitudini previste per oggi hai gia\' spuntato. Le abitudini non in programma oggi e quelle in pausa non contano.',
  },
  {
    titolo: 'Ultimi 7 giorni (fino a ieri)',
    testo: 'Completate su previste, giorno per giorno. Oggi resta fuori di proposito: al mattino le abitudini non sono ancora fatte e farebbero scendere la percentuale senza motivo. La freccia confronta con i 7 giorni precedenti.',
  },
  {
    titolo: 'Streak attiva',
    testo: 'La serie in corso piu\' lunga, con l\'abitudine a cui appartiene. Conta solo i giorni in cui l\'abitudine era prevista: saltare un giorno non previsto non la interrompe. Sotto trovi il tuo record storico.',
  },
  {
    titolo: 'Prossima scadenza',
    testo: 'L\'obiettivo in corso con meno giorni rimanenti, col suo progresso. Diventa ambra se il progresso e\' rimasto indietro rispetto al tempo gia\' trascorso.',
  },
];

export function Dashboard() {
  const { user } = useAuth();
  const { habits, completions, loading, toggleCompletion, isCompleted } = useHabits();
  const { goals } = useGoals();
  const [statsGuideOpen, setStatsGuideOpen] = useState(false);

  const oggi = today();

  // Abitudini in programma oggi: le daily sempre, le custom solo nei loro giorni,
  // quelle in pausa mai.
  const todaysHabits = useMemo(() => scheduledHabitsOn(habits, oggi), [habits, oggi]);

  // Statistiche derivate. useMemo perché scorrono tutte le completions e non
  // devono ricalcolarsi a ogni render, solo quando cambiano i dati sottostanti.
  const stats = useMemo(() => {
    const doneToday = todaysHabits.filter((h) => isCompleted(h.id, oggi)).length;
    const settimana = weeklyRateWithDelta(habits, completions, oggi);
    const streak = bestActiveStreak(habits, completions);
    const record = habits.reduce((max, h) => Math.max(max, longestStreak(h, completions)), 0);
    const scadenza = nearestDeadline(goals, completions, oggi);

    return { doneToday, totalToday: todaysHabits.length, settimana, streak, record, scadenza };
  }, [habits, todaysHabits, completions, goals, isCompleted, oggi]);

  if (loading) {
    return (
      <div className="page-container">
        <Spinner label="Carico le tue abitudini..." />
      </div>
    );
  }

  const firstName = user ? user.displayName.split(' ')[0] : '';
  const { settimana, streak, scadenza } = stats;
  const percentOggi = stats.totalToday > 0 ? (stats.doneToday / stats.totalToday) * 100 : 0;

  return (
    <div className="page-container">
      {/* Hero: saluto, data, profilo e citazione del giorno. */}
      <header className={styles.hero}>
        <h1 className={styles.heroTitle}>Time to improve, {firstName}</h1>
        <div className={styles.heroMeta}>
          <span className={styles.heroDate}>{formatLong(oggi)}</span>
          {user?.profile?.name ? (
            <Link to="/profile" className={styles.profileChip}>
              {user.profile.name}
            </Link>
          ) : (
            <Link to="/onboarding" className={`${styles.profileChip} ${styles.profileChipEmpty}`}>
              Scopri il tuo profilo
            </Link>
          )}
        </div>
        <DailyQuoteCard />
      </header>

      <div className={styles.statsHead}>
        <h2 className={styles.statsTitle}>A colpo d'occhio</h2>
        <button
          className={styles.infoBtn}
          onClick={() => setStatsGuideOpen(true)}
          aria-label="Come sono calcolate queste statistiche"
          title="Come sono calcolate queste statistiche"
        >
          i
        </button>
      </div>

      <section className={styles.statsGrid}>
        {/* Scheda principale: e' l'unica che dice cosa fare adesso, quindi e' la piu'
            grande e porta l'anello di progresso. */}
        <div className={`${styles.statCard} ${styles.statMain}`}>
          <div
            className={styles.ring}
            style={{ '--pct': `${percentOggi}%` }}
            role="img"
            aria-label={`${stats.doneToday} di ${stats.totalToday} completate`}
          >
            <span className={styles.ringValue}>
              {stats.doneToday}/{stats.totalToday}
            </span>
          </div>
          <div>
            <span className={styles.statLabel}>Oggi</span>
            <p className={styles.statNote}>
              {stats.totalToday === 0
                ? 'Nessuna abitudine in programma'
                : stats.doneToday === stats.totalToday
                  ? 'Giornata completata'
                  : `Ne mancano ${stats.totalToday - stats.doneToday}`}
            </p>
          </div>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {settimana.rate === null ? '—' : `${settimana.rate}%`}
            {settimana.delta !== null && settimana.delta !== 0 && (
              <span
                className={settimana.delta > 0 ? styles.deltaUp : styles.deltaDown}
                title="Rispetto ai 7 giorni precedenti"
              >
                {settimana.delta > 0 ? '▲' : '▼'} {Math.abs(settimana.delta)} pt
              </span>
            )}
          </span>
          <span className={styles.statLabel}>Ultimi 7 giorni (fino a ieri)</span>
        </div>

        <div className={styles.statCard}>
          {streak.streak > 0 ? (
            <>
              <span className={styles.statValue}>🔥 {streak.streak}</span>
              <span className={styles.statLabel}>Streak attiva · {streak.habit.name}</span>
              <p className={styles.statNote}>record {stats.record}</p>
            </>
          ) : (
            <>
              <span className={styles.statValue}>🔥 0</span>
              <span className={styles.statLabel}>Nessuna streak attiva</span>
              <Link to="/habits" className={styles.statLink}>
                Riparti da una
              </Link>
            </>
          )}
        </div>

        <div className={`${styles.statCard} ${scadenza?.inRitardo ? styles.statWarn : ''}`}>
          {scadenza ? (
            <>
              <span className={styles.statValue}>
                {scadenza.giorniRimanenti === 0 ? 'oggi' : `${scadenza.giorniRimanenti} gg`}
              </span>
              <span className={styles.statLabel}>Scadenza · {scadenza.goal.title}</span>
              <p className={styles.statNote}>
                {scadenza.percent}% completato{scadenza.inRitardo ? ' · sei indietro' : ''}
              </p>
            </>
          ) : (
            <>
              <span className={styles.statValue}>—</span>
              <span className={styles.statLabel}>Nessun obiettivo in corso</span>
              <Link to="/goals" className={styles.statLink}>
                Creane uno
              </Link>
            </>
          )}
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

      <DailyReportCard />

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

      <Modal
        open={statsGuideOpen}
        onClose={() => setStatsGuideOpen(false)}
        title="Come leggere queste statistiche"
      >
        <div className={styles.guide}>
          {STATS_GUIDE.map((blocco) => (
            <section key={blocco.titolo} className={styles.guideBlock}>
              <h3 className={styles.guideTitle}>{blocco.titolo}</h3>
              <p className={styles.guideText}>{blocco.testo}</p>
            </section>
          ))}
          <p className={styles.guideText}>
            In tutte le percentuali il denominatore sono le abitudini <strong>previste</strong>{' '}
            quel giorno, non il totale delle tue abitudini.
          </p>
        </div>
      </Modal>
    </div>
  );
}
