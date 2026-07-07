import { formatLong } from '../../utils/dateUtils';
import styles from './GoalCard.module.css';

const STATUS = {
  active: { label: 'In corso', color: 'var(--color-primary)' },
  completed: { label: 'Completato', color: 'var(--color-success)' },
  failed: { label: 'Scaduto', color: 'var(--color-danger)' },
};

// Un obiettivo ha un target misurabile (valore + unita') e una scadenza. Il
// progresso puo' essere manuale (pulsante +1) oppure automatico, se l'obiettivo
// e' collegato a un'abitudine: in quel caso avanza da solo con i completamenti.
export function GoalCard({ goal, progress, percent, status, linkedHabitName, onIncrement, onDelete }) {
  const s = STATUS[status] || STATUS.active;
  const target = goal.target?.value ?? 0;
  const unit = goal.target?.unit || '';
  const canIncrement = !goal.linkedHabitId && status === 'active';

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div>
          <h3 className={styles.title}>{goal.title}</h3>
          {goal.linkedHabitId ? (
            <span className={styles.linkBadge}>🔗 {linkedHabitName || 'abitudine'}</span>
          ) : (
            <span className={styles.type}>manuale</span>
          )}
        </div>
        <span className={styles.status} style={{ color: s.color }}>{s.label}</span>
      </div>

      {goal.description && <p className={styles.desc}>{goal.description}</p>}

      <div className={styles.progressRow}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${percent}%`, backgroundColor: s.color }}
          />
        </div>
        <span className={styles.count}>{progress}/{target} {unit}</span>
      </div>

      <div className={styles.footer}>
        <span className={styles.deadline}>Scadenza: {formatLong(goal.deadline)}</span>
        <div className={styles.actions}>
          {canIncrement && (
            <button className={styles.completeBtn} onClick={() => onIncrement(goal)}>
              +1
            </button>
          )}
          <button className={styles.deleteBtn} onClick={() => onDelete(goal.id)} aria-label="Elimina">
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}
