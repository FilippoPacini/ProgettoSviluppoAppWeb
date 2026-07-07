import { formatLong, formatWeekday } from '../../utils/dateUtils';
import styles from './DiaryEntry.module.css';

// Singola voce del diario nella lista cronologica.
export function DiaryEntry({ entry, onDelete }) {
  return (
    <article className={styles.entry}>
      <div className={styles.meta}>
        <span className={styles.date}>{formatLong(entry.date)}</span>
        <span className={styles.weekday}>{formatWeekday(entry.date)}</span>
      </div>
      <p className={styles.text}>{entry.text}</p>
      <button className={styles.delete} onClick={() => onDelete(entry.id)} aria-label="Elimina voce">
        Elimina
      </button>
    </article>
  );
}
