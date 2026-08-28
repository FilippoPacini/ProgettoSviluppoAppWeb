import { useState, useEffect, useCallback } from 'react';

// Preferenza di dispositivo, non dato applicativo: localStorage e non Firestore.
const KEY = 'hf_reminder';
const DEFAULT = { enabled: false, time: '20:00' };

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const p = JSON.parse(raw);
    return { enabled: !!p.enabled, time: p.time || DEFAULT.time };
  } catch {
    return DEFAULT;
  }
}

export function useReminderPref() {
  const [pref, setPref] = useState(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(pref));
    } catch {
      // Quota piena o storage disabilitato: la preferenza resta solo in memoria.
    }
  }, [pref]);

  const setEnabled = useCallback((enabled) => setPref((p) => ({ ...p, enabled })), []);
  const setTime = useCallback((time) => setPref((p) => ({ ...p, time })), []);

  return { pref, setEnabled, setTime };
}
