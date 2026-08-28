import { useState, useEffect, useCallback } from 'react';

// Preferenza di interfaccia del dispositivo: localStorage, come i promemoria.
const KEY = 'hf_sidebar_collapsed';

function read() {
  try {
    return localStorage.getItem(KEY) === 'true';
  } catch {
    // Storage non disponibile (modalita' privata, permessi): parto da espansa.
    return false;
  }
}

export function useSidebarPref() {
  const [collapsed, setCollapsed] = useState(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, String(collapsed));
    } catch {
      // Quota piena o storage disabilitato: la preferenza resta solo in memoria.
    }
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => setCollapsed((v) => !v), []);

  return { collapsed, toggleCollapsed };
}
