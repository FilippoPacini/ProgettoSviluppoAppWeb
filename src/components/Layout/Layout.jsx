import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { ReminderScheduler } from '../Reminder/ReminderScheduler';
import styles from './Layout.module.css';

// Guscio dell’app autenticata: navbar fissa in alto, sidebar a sinistra, contenuto
// della route (Outlet) al centro. Lo stato 'sidebarOpen' serve solo su mobile per
// aprire/chiudere il pannello di navigazione.
export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <ReminderScheduler />
      <Navbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className={styles.body}>
        <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        <main className={styles.main}>
          <Outlet />
          <Footer />
        </main>
      </div>
    </div>
  );
}
