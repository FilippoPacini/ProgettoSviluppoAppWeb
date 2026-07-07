import styles from './ProgressBar.module.css';

// Barra di avanzamento riusata dagli obiettivi e dalle statistiche.
// value/max determinano la percentuale; 'color' permette di variare l’accento.
export function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={styles.track}>
      <div
        className={styles.fill}
        style={{ width: `${pct}%`, backgroundColor: color || 'var(--color-primary)' }}
      />
    </div>
  );
}
