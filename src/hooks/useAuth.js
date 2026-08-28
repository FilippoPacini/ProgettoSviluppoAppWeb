import { use } from 'react';
import { AuthContext } from '../context/AuthContext';

// Scorciatoia per consumare l’AuthContext. Lancio un errore esplicito se qualcuno
// usa il hook fuori dal provider: è un bug da intercettare subito in sviluppo.
export function useAuth() {
  const ctx = use(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth deve essere usato dentro <AuthProvider>');
  }
  return ctx;
}
