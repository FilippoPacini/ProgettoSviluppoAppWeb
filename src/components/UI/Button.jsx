import styles from './Button.module.css';

// Bottone generico con varianti. Uso className composta invece di stile inline
// cosi il tema resta gestito dal CSS (variabili verde marino).
export function Button({ children, variant = 'primary', type = 'button', onClick, disabled, full }) {
  const classes = [styles.btn, styles[variant], full ? styles.full : ''].join(' ');
  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
