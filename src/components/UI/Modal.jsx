import { useEffect } from 'react';
import styles from './Modal.module.css';

// Modale generica. Chiude su Esc e sul click nell’overlay. Uso useEffect per
// registrare/rimuovere il listener della tastiera con cleanup, come da regola
// degli effetti (aggiungi e togli event handler nel side effect).
export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      {/* stopPropagation: un click dentro il pannello non deve chiudere la modale */}
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{title}</h3>
          <button className={styles.close} onClick={onClose} aria-label="Chiudi">
            &times;
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
