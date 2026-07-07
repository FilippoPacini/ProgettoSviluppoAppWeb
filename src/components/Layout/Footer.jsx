import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span>HabitForge · progetto SAW · Universita di Pisa</span>
      <span>Forgia le tue abitudini, un giorno alla volta.</span>
    </footer>
  );
}
