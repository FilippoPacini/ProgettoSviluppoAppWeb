import styles from './Spinner.module.css';

// Indicatore di caricamento mostrato mentre Firestore risponde. Il testo è opzionale.
export function Spinner({ label }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.spinner} />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
