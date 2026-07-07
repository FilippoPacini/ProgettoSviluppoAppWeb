import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from './AuthContext';
import {
  subscribeCollection,
  addDocument,
  setDocument,
  updateDocument,
  deleteDocument,
} from '../services/firestore';
import { today } from '../utils/dateUtils';

// Stato dati dell'app in un unico posto, letto dalle pagine via useHabits/useGoals/
// useDiary. Realtime con onSnapshot: le CRUD scrivono su Firestore e non toccano lo
// stato locale, cosi due schede restano in sync.
export const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [habits, setHabits] = useState([]);
  const [completionsList, setCompletionsList] = useState([]);
  const [goals, setGoals] = useState([]);
  const [diary, setDiary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setHabits([]); setCompletionsList([]); setGoals([]); setDiary([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Una subscribeCollection per collezione; le unsubscribe si chiamano nel cleanup.
    // Dipendo da user?.uid, non dall'intero user (che cambia a ogni update del documento).
    const uid = user.uid;
    const unsubs = [
      subscribeCollection(uid, 'habits', setHabits),
      subscribeCollection(uid, 'completions', setCompletionsList),
      subscribeCollection(uid, 'goals', setGoals),
      subscribeCollection(uid, 'diary', setDiary),
    ];
    setLoading(false);
    return () => unsubs.forEach((u) => u());
  }, [user?.uid]);

  // Le completions arrivano da Firestore come [{ id: 'YYYY-MM-DD', habits: [...] }].
  // Il resto dell'app le vuole come mappa { 'YYYY-MM-DD': [...] }: la ricostruisco qui.
  const completions = Object.fromEntries(
    completionsList.map((c) => [c.id, c.habits || []])
  );

  /* ---- Abitudini + completions ---- */

  const addHabit = useCallback(async (habit) => {
    if (!user) return null;
    const newHabit = { ...habit, createdAt: today() };
    const id = await addDocument(user.uid, 'habits', newHabit);
    return { id, ...newHabit };
  }, [user]);

  const updateHabit = useCallback(async (habitId, patch) => {
    if (!user) return;
    await updateDocument(user.uid, 'habits', habitId, patch);
  }, [user]);

  const deleteHabit = useCallback(async (habitId) => {
    if (!user) return;
    await deleteDocument(user.uid, 'habits', habitId);
    // Pulisco i riferimenti all'abitudine anche nelle completions.
    for (const c of completionsList) {
      const filtered = (c.habits || []).filter((id) => id !== habitId);
      if (filtered.length === 0) await deleteDocument(user.uid, 'completions', c.id);
      else await updateDocument(user.uid, 'completions', c.id, { habits: filtered });
    }
  }, [user, completionsList]);

  const toggleCompletion = useCallback(async (habitId, date = today()) => {
    if (!user) return;
    const current = completions[date] || [];
    const next = current.includes(habitId)
      ? current.filter((id) => id !== habitId)
      : [...current, habitId];
    // Doc-id = data ISO. Se il giorno resta senza completate, cancello il documento.
    if (next.length === 0) await deleteDocument(user.uid, 'completions', date);
    else await setDocument(user.uid, 'completions', date, { habits: next });
  }, [user, completions]);

  /* ---- Obiettivi ---- */

  const addGoal = useCallback(async (goal) => {
    if (!user) return null;
    // createdAt serve a contare i completamenti degli obiettivi collegati a
    // un'abitudine dall'inizio dell'obiettivo. progress e' usato solo dagli
    // obiettivi manuali. Lo stato mostrato e' comunque derivato dai dati.
    const newGoal = { ...goal, progress: 0, createdAt: today(), status: 'active' };
    const id = await addDocument(user.uid, 'goals', newGoal);
    return { id, ...newGoal };
  }, [user]);

  const updateGoal = useCallback(async (goalId, patch) => {
    if (!user) return;
    await updateDocument(user.uid, 'goals', goalId, patch);
  }, [user]);

  const deleteGoal = useCallback(async (goalId) => {
    if (!user) return;
    await deleteDocument(user.uid, 'goals', goalId);
  }, [user]);

  /* ---- Diario ---- */

  const addEntry = useCallback(async (entry) => {
    if (!user) return null;
    const id = await addDocument(user.uid, 'diary', entry);
    return { id, ...entry };
  }, [user]);

  const deleteEntry = useCallback(async (entryId) => {
    if (!user) return;
    await deleteDocument(user.uid, 'diary', entryId);
  }, [user]);

  const value = {
    loading,
    habits,
    completions,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleCompletion,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    diary,
    addEntry,
    deleteEntry,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
