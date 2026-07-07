import { useContext } from 'react';
import { DataContext } from '../context/DataContext';

// Fetta "obiettivi" del DataContext.
export function useGoals() {
  const ctx = useContext(DataContext);
  if (ctx === null) {
    throw new Error('useGoals deve essere usato dentro <DataProvider>');
  }
  const { goals, loading, addGoal, updateGoal, deleteGoal } = ctx;
  return { goals, loading, addGoal, updateGoal, deleteGoal };
}
