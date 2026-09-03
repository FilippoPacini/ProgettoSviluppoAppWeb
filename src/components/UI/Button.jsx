import styles from './Button.module.css';

// Bottone generico con varianti. Il tema e' gestito dal CSS.
export function Button({ children, variant = 'primary', type = 'button', onClick, disabled, full }) {
  const classes = [styles.btn, styles[variant], full ? styles.full : ''].join(' ');
  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
