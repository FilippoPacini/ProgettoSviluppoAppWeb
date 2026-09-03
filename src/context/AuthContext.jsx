import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as authService from '../services/auth';
import { saveProfile, subscribeUserDoc } from '../services/firestore';

// Context dell'autenticazione: stato condiviso a piu' alto livello dell'app.
// Navbar, route protette e pagine leggono lo stesso 'user' senza prop drilling.
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // observeAuth reagisce a login/logout/reload e ritorna la unsubscribe.
    // Il merge preserva il displayName gia' in stato.
    const unsub = authService.observeAuth((u) => {
      setUser((prev) => {
        if (!u) return null;    // logout
        if (!prev) return u;    // primo accesso: non c'e' nulla da preservare
        return { ...prev, ...u, displayName: u.displayName || prev.displayName };
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // profile, dailyReport e dailyQuote in tempo reale. Ri-sottoscrizione solo
  // al cambio di uid.
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeUserDoc(user.uid, (data) => {
      // createdAt gia' normalizzato in hydrateUser; displayName dal documento solo
      // come fallback.
      const { createdAt, displayName, ...rest } = data;
      setUser((prev) =>
        prev
          ? { ...prev, ...rest, displayName: prev.displayName || displayName || '' }
          : prev
      );
    });
    return () => unsub();
  }, [user?.uid]);

  // 'loading' copre solo l'attesa della prima risposta di Firebase sulla sessione,
  // quindi resta di competenza dell'effetto qui sopra. L'attesa delle singole
  // chiamate la gestiscono le pagine.
  const login = useCallback(async (email, password) => {
    const logged = await authService.login(email, password);
    setUser(logged);
    return logged;
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    const created = await authService.register(email, password, displayName);
    setUser(created);
    return created;
  }, []);

  const resetPassword = useCallback(async (email) => {
    return authService.resetPassword(email);
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    return authService.changePassword(currentPassword, newPassword);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const logged = await authService.loginWithGoogle();
    setUser(logged);
    return logged;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  // Se il salvataggio fallisce rilancio senza toccare lo stato.
  const completeProfile = useCallback(async (profile) => {
    if (!user) return;
    await saveProfile(user.uid, profile);
    setUser((prev) => (prev ? { ...prev, profile } : prev));
  }, [user]);

  // Identita' stabile fra un render e l'altro: i consumatori si aggiornano solo
  // quando cambia davvero uno dei valori.
  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      resetPassword,
      changePassword,
      loginWithGoogle,
      logout,
      completeProfile,
    }),
    [
      user,
      loading,
      login,
      register,
      resetPassword,
      changePassword,
      loginWithGoogle,
      logout,
      completeProfile,
    ]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
