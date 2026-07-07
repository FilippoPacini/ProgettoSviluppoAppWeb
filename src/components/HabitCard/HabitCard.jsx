import { currentStreak, reachedMilestone } from '../../utils/streakCalculator';
import styles from './HabitCard.module.css';

// Card di una singola abitudine sulla dashboard: emoji, nome, streak e checkbox
// di completamento per oggi. La streak la calcolo qui dai completions passati come prop.
export function HabitCard({ habit, completions, done, onToggle }) {
  const streak = currentStreak(habit, completions);
  const milestone = reachedMilestone(streak);
  // Percentuale verso il traguardo dei 30 giorni: alimenta l'anello (--streak-pct).
  const pct = Math.min(100, Math.round((streak / 30) * 100));

  return (
    <div className={`${styles.card} ${done ? styles.done : ''}`}>
      <button
        className={`${styles.checkbox} ${done ? styles.checked : ''}`}
        onClick={() => onToggle(habit.id)}
        aria-label={done ? 'Segna come non fatta' : 'Segna come fatta'}
        style={done ? { backgroundColor: habit.color, borderColor: habit.color } : undefined}
      >
        {done && <span className={styles.tick}>✓</span>}
      </button>

      {/* Arricchimento grafico: anello che si riempie con la streak (conic-gradient,
          solo CSS). L'emoji resta al centro su un cerchio interno. */}
      <div className={styles.streakRing} style={{ '--streak-pct': pct }}>
        <span className={styles.streakRingInner}>
          <span className={styles.emoji}>{habit.emoji}</span>
        </span>
      </div>

      <div className={styles.info}>
        <span className={styles.name}>{habit.name}</span>
        <span className={styles.streak}>
          {streak > 0 ? `🔥 ${streak} ${streak === 1 ? 'giorno' : 'giorni'}` : 'Inizia oggi'}
          {milestone && <span className={styles.badge}>traguardo!</span>}
        </span>
      </div>
    </div>
  );
}
