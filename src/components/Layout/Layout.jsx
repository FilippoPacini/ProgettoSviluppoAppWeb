import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { ReminderScheduler } from '../Reminder/ReminderScheduler';
import { useSidebarPref } from '../../hooks/useSidebarPref';
import styles from './Layout.module.css';

// Rotte del gruppo "Attivita'": sono le uniche che mostrano il bagliore di sfondo.
const ACTIVITY_ROUTES = ['/', '/habits', '/goals', '/diary'];

// Guscio dell’app autenticata: navbar, sidebar e Outlet della route.
// 'sidebarOpen' e' il pannello mobile, 'collapsed' il rail desktop da localStorage.
export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { collapsed, toggleCollapsed } = useSidebarPref();
  const { pathname } = useLocation();
  const showGlow = ACTIVITY_ROUTES.includes(pathname);

  return (
    <div className={styles.shell}>
      <ReminderScheduler />
      <Navbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className={styles.body}>
        <Sidebar
          open={sidebarOpen}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          onNavigate={() => setSidebarOpen(false)}
        />
        <main className={styles.main}>
          {/* Bagliore decorativo dietro al contenuto: solo sulle pagine Attivita'. */}
          {showGlow && <div className={styles.glow} aria-hidden="true" />}
          <Outlet />
          <Footer />
        </main>
      </div>
    </div>
  );
}
