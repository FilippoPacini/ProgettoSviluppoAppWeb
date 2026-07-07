import { useAuth } from '../../hooks/useAuth';
import { Button } from '../UI/Button';
import styles from './Navbar.module.css';

// Barra superiore: brand a sinistra, utente e logout a destra.
// Legge l’utente dal context via useAuth, niente prop drilling.
export function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <button className={styles.burger} onClick={onToggleSidebar} aria-label="Menu">
          &#9776;
        </button>
        <span className={styles.brand}>
          <span className={styles.brandMark}>HF</span> HabitForge
        </span>
      </div>

      <div className={styles.right}>
        {user && <span className={styles.userName}>{user.displayName}</span>}
        <Button variant="ghost" onClick={logout}>
          Esci
        </Button>
      </div>
    </header>
  );
}
