import { useContext } from 'react';
import { DataContext } from '../context/DataContext';

// Fetta "diario" del DataContext.
export function useDiary() {
  const ctx = useContext(DataContext);
  if (ctx === null) {
    throw new Error('useDiary deve essere usato dentro <DataProvider>');
  }
  const { diary, loading, addEntry, deleteEntry } = ctx;
  return { diary, loading, addEntry, deleteEntry };
}
