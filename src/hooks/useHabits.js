import { useContext, useCallback } from 'react';
import { DataContext } from '../context/DataContext';
import { today } from '../utils/dateUtils';

// Espone la fetta "abitudini" del DataContext. La logica di CRUD e i punti di
// integrazione Firestore vivono nel provider; qui offro l’API comoda alle pagine.
export function useHabits() {
  const ctx = useContext(DataContext);
  if (ctx === null) {
    throw new Error('useHabits deve essere usato dentro <DataProvider>');
  }
  const { habits, completions, loading, addHabit, updateHabit, deleteHabit, toggleCompletion } = ctx;

  const isCompleted = useCallback(
    (habitId, date = today()) =>
      Array.isArray(completions[date]) && completions[date].includes(habitId),
    [completions]
  );

  return { habits, completions, loading, addHabit, updateHabit, deleteHabit, toggleCompletion, isCompleted };
}
