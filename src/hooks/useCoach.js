import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useHabits } from './useHabits';
import { useGoals } from './useGoals';
import { useDiary } from './useDiary';
import { askCoachAdvice, buildUserSnapshot } from '../services/gemini';

// Gestisce la conversazione col coach. Costruisce lo snapshot dei dati utente
// (buildUserSnapshot) e lo manda a Gemini via askCoachAdvice: una sola chiamata
// AI per messaggio.
export function useCoach() {
  const { user } = useAuth();
  const { habits, completions } = useHabits();
  const { goals } = useGoals();
  const { diary } = useDiary();

  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);

  const askCoach = useCallback(async (userText) => {
    if (userText) {
      setMessages((prev) => [...prev, { role: 'user', text: userText, id: crypto.randomUUID() }]);
    }
    setThinking(true);
    try {
      const snapshot = buildUserSnapshot({ displayName: user?.displayName, profile: user?.profile, habits, completions, goals, diary });
      const question = userText || 'come sto andando in generale? dammi un incoraggiamento.';
      const text = await askCoachAdvice(snapshot, question);
      setMessages((prev) => [...prev, { role: 'coach', text, id: crypto.randomUUID() }]);
    } catch (err) {
      console.error('Errore coach:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'coach',
          text: 'Non riesco a contattare il coach in questo momento. Controlla la connessione e riprova tra poco.',
          id: crypto.randomUUID(),
        },
      ]);
    } finally {
      setThinking(false);
    }
  }, [user?.profile, habits, completions, goals, diary]);

  return { messages, thinking, askCoach };
}
