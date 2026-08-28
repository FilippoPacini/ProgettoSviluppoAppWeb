import styles from './Input.module.css';

// Campo controllato: il valore vive nello stato del padre.
// min/step per i numerici, readOnly per i campi decisi altrove.
export function Input({
  label, type = 'text', value, onChange, placeholder, error, name,
  min, step, readOnly = false, disabled = false,
}) {
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
        min={min}
        step={step}
        readOnly={readOnly}
        disabled={disabled}
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
