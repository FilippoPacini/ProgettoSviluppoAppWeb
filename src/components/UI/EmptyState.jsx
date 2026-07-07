import { Illustration } from './Illustration';
import styles from './EmptyState.module.css';

// Stato vuoto riutilizzabile: illustrazione + titolo + testo (+ eventuale azione).
// Rende le pagine vuote piu' accoglienti e guida l'utente al primo passo.
export function EmptyState({ illustration = 'goals', title, text, children }) {
  return (
    <div className={styles.wrap}>
      <Illustration name={illustration} size={150} />
      {title && <h3 className={styles.title}>{title}</h3>}
      {text && <p className={styles.text}>{text}</p>}
      {children}
    </div>
  );
}
