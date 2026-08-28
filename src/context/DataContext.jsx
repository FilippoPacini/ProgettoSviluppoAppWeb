import { createContext, useState, useEffect, useCallback, useMemo, use, useRef } from 'react';
import { AuthContext } from './AuthContext';
import {
  subscribeCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  addCompletion,
  removeCompletion,
  removeHabitFromCompletions,
} from '../services/firestore';
import { today } from '../utils/dateUtils';

// Stato dati dell'app in un unico posto, letto dalle pagine via useHabits/useGoals/
// useDiary. Realtime con onSnapshot: le CRUD scrivono su Firestore e non toccano lo
// stato locale, cosi due schede restano in sync.
export const DataContext = createContext(null);

export function DataProvider({ children }) {
  // use() legge il context; non e' un hook, quindi puo' stare dentro if e cicli.
  const { user } = use(AuthContext);
  const [habits, setHabits] = useState([]);
  const [completionsList, setCompletionsList] = useState([]);
  const [goals, setGoals] = useState([]);
  const [diary, setDiary] = useState([]);
  const [loading, setLoading] = useState(true);
  // Collezioni di cui aspetto il primo snapshot prima di chiudere loading: con le
  // sole abitudini, un array vuoto di obiettivi sarebbe ambiguo.
  const pending = useRef(new Set());

  useEffect(() => {
    if (!user?.uid) {
      setHabits([]); setCompletionsList([]); setGoals([]); setDiary([]);
      pending.current = new Set();
      setLoading(false);
      return;
    }
    const uid = user.uid;
    pending.current = new Set(['habits', 'completions', 'goals', 'diary']);
    setLoading(true);

    // Chiude loading quando tutte e quattro sono arrivate (partono in parallelo).
    const markArrived = (name) => {
      if (!pending.current.delete(name)) return;
      if (pending.current.size === 0) setLoading(false);
    };

    // Una subscribeCollection per collezione; le unsubscribe si chiamano nel cleanup.
    // Dipendo da user?.uid, non dall'intero user (che cambia a ogni update del documento).
    const subscribe = (name, setter) =>
      subscribeCollection(uid, name, (rows) => {
        setter(rows);
        markArrived(name);
      });

    const unsubs = [
      subscribe('habits', setHabits),
      subscribe('completions', setCompletionsList),
      subscribe('goals', setGoals),
      subscribe('diary', setDiary),
    ];
    return () => unsubs.forEach((u) => u());
  }, [user?.uid]);

  // Da [{ id, habits }] a mappa { 'YYYY-MM-DD': [...] }. useMemo obbligatorio:
  // altrimenti oggetto nuovo a ogni render, e tutte le memo che ne dipendono saltano.
  const completions = useMemo(
    () => Object.fromEntries(completionsList.map((c) => [c.id, c.habits || []])),
    [completionsList]
  );

  /* ---- Abitudini + completions ---- */

  const addHabit = useCallback(async (habit) => {
    if (!user) return null;
    const newHabit = { ...habit, createdAt: today(), active: true, pauses: [] };
    const id = await addDocument(user.uid, 'habits', newHabit);
    return { id, ...newHabit };
  }, [user]);

  // Pausa/ripresa. Alla ripresa chiudo la pausa aperta invece di cancellarla,
  // altrimenti i conteggi passati cambierebbero.
  const setHabitActive = useCallback(async (habitId, nextActive) => {
    if (!user) return;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const pauses = [...(habit.pauses || [])];
    if (nextActive) {
      const last = pauses[pauses.length - 1];
      if (last && last.to == null) pauses[pauses.length - 1] = { ...last, to: today() };
    } else {
      pauses.push({ from: today(), to: null });
    }
    await updateDocument(user.uid, 'habits', habitId, { active: nextActive, pauses });
  }, [user, habits]);

  const updateHabit = useCallback(async (habitId, patch) => {
    if (!user) return;
    await updateDocument(user.uid, 'habits', habitId, patch);
  }, [user]);

  const deleteHabit = useCallback(async (habitId) => {
    if (!user) return;
    await deleteDocument(user.uid, 'habits', habitId);
    // Ripulisco le completions solo nei giorni in cui compare, in batch.
    const dates = completionsList
      .filter((c) => (c.habits || []).includes(habitId))
      .map((c) => c.id);
    if (dates.length > 0) await removeHabitFromCompletions(user.uid, habitId, dates);
  }, [user, completionsList]);

  // Doc-id = data ISO. Operatori atomici, non riscrittura dell'array.
  // Un documento con array vuoto resta: cancellarlo sarebbe un caso speciale inutile.
  const toggleCompletion = useCallback(async (habitId, date = today()) => {
    if (!user) return;
    const done = (completions[date] || []).includes(habitId);
    if (done) await removeCompletion(user.uid, date, habitId);
    else await addCompletion(user.uid, date, habitId);
  }, [user, completions]);

  /* ---- Obiettivi ---- */

  const addGoal = useCallback(async (goal) => {
    if (!user) return null;
    // createdAt: da qui contano i completamenti dei collegati. progress solo per i
    // manuali. Lo stato non si salva, e' derivato con goalStatus(): una verita' sola.
    const newGoal = { ...goal, progress: 0, createdAt: today() };
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
    setHabitActive,
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

  // Da React 19 il context stesso fa da provider: niente piu' <DataContext.Provider>.
  return <DataContext value={value}>{children}</DataContext>;
}
