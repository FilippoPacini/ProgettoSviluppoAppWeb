import styles from './Input.module.css';

// Campo di input controllato con etichetta e messaggio d’errore opzionale.
// Lo tengo controllato (value + onChange) come da pattern React del corso.
export function Input({ label, type = 'text', value, onChange, placeholder, error, name }) {
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <input
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}

// Variante multilinea per il diario
export function TextArea({ label, value, onChange, placeholder, rows = 4, name }) {
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <textarea
        className={styles.input}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
      />
    </label>
  );
}
