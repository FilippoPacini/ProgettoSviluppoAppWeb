import { formatLong } from '../../utils/dateUtils';
import styles from './GoalCard.module.css';

const STATUS = {
  active: { label: 'In corso', color: 'var(--color-primary)' },
  completed: { label: 'Completato', color: 'var(--color-success)' },
  failed: { label: 'Scaduto', color: 'var(--color-danger)' },
};

// Un obiettivo ha un target misurabile (valore + unita') e una scadenza. Il
// progresso puo' essere manuale (lo aggiorna l'utente) oppure automatico, se
// l'obiettivo e' collegato a un'abitudine: in quel caso avanza con i completamenti.
// Componente di presentazione: la modale di modifica la gestisce la pagina.
export function GoalCard({ goal, progress, percent, status, linkedHabitName, onEditProgress, onDelete }) {
  const s = STATUS[status] || STATUS.active;
  const target = goal.target?.value ?? 0;
  const unit = goal.target?.unit || '';
  const canEditProgress = !goal.linkedHabitId && status === 'active';

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div>
          <h3 className={styles.title}>{goal.title}</h3>
          {/* Il modo di avanzare e' sempre dichiarato, non solo dentro la guida:
              se serve aprire una guida per capire l'interfaccia, il problema e'
              dell'interfaccia. */}
          {goal.linkedHabitId ? (
            <span className={styles.linkBadge}>
              ⟳ Avanza da solo · {linkedHabitName || 'abitudine collegata'}
            </span>
          ) : (
            <span className={styles.type}>✎ Lo aggiorni tu</span>
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

      {/* Seconda lettura in unita' fisiche, quando l'abitudine collegata ha una
          misura: il totale e' per costruzione un multiplo di quella misura. */}
      {goal.unitPerCompletion && (
        <p className={styles.equivalence}>
          {progress * goal.unitPerCompletion.value} di {target * goal.unitPerCompletion.value}{' '}
          {goal.unitPerCompletion.unit}
        </p>
      )}

      <div className={styles.footer}>
        <span className={styles.deadline}>Scadenza: {formatLong(goal.deadline)}</span>
        <div className={styles.actions}>
          {canEditProgress && (
            <button className={styles.completeBtn} onClick={() => onEditProgress(goal)}>
              Aggiorna progresso
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
