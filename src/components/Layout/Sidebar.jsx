import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Sidebar.module.css';

// Voci di navigazione raggruppate: aggiungere una pagina significa aggiungere una
// riga qui, non toccare il markup.
const GROUPS = [
  {
    label: 'Attivita\'',
    items: [
      { to: '/', label: 'Dashboard', icon: '🏠', end: true },
      { to: '/habits', label: 'Abitudini', icon: '✅' },
      { to: '/goals', label: 'Obiettivi', icon: '🎯' },
      { to: '/diary', label: 'Diario', icon: '📓' },
    ],
  },
  {
    label: 'Tu',
    items: [
      { to: '/coach', label: 'Coach AI', icon: '🤖' },
      { to: '/profile', label: 'Profilo', icon: '👤' },
    ],
  },
];

function initials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

export function Sidebar({ open, onNavigate }) {
  const { user } = useAuth();

  return (
    <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
      <nav className={styles.nav}>
        {GROUPS.map((group) => (
          <div key={group.label} className={styles.group}>
            <span className={styles.groupLabel}>{group.label}</span>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {user && (
        <Link to="/profile" className={styles.userBlock} onClick={onNavigate}>
          <span className={styles.avatar}>{initials(user.displayName)}</span>
          <span className={styles.userMeta}>
            <span className={styles.userName}>{user.displayName}</span>
            <span className={styles.userEmail}>{user.email}</span>
          </span>
        </Link>
      )}
    </aside>
  );
}
