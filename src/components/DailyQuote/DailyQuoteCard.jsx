import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useHabits } from '../../hooks/useHabits';
import { useGoals } from '../../hooks/useGoals';
import { useDiary } from '../../hooks/useDiary';
import { requestPersonalQuote, buildUserSnapshot } from '../../services/gemini';
import { setDailyQuote } from '../../services/firestore';
import { quotes } from '../../data/quotes';
import { today } from '../../utils/dateUtils';
import styles from './DailyQuoteCard.module.css';

// Citazione del giorno: senza obiettivi attivi la pesco dalla lista locale di filosofi
// (nessuna chiamata AI); con obiettivi attivi chiedo a Gemini una frase originale su
// misura. Generata una volta al giorno e salvata su Firestore.
export function DailyQuoteCard() {
  const { user } = useAuth();
  const { habits, completions } = useHabits();
  const { goals, loading: goalsLoading } = useGoals();
  const { diary } = useDiary();
  const [busy, setBusy] = useState(false);
  // Guardia sincrona via ref: evita la doppia generazione (e doppia chiamata AI)
  // quando l'effect parte due volte in StrictMode.
  const genRef = useRef(false);

  const oggi = today();
  const cached = user?.dailyQuote;
  const isFresh = cached?.date === oggi;

  // Genera e salva la citazione. force=true ignora la cache (usato dal refresh).
  const generate = async (force = false) => {
    if (!user || genRef.current) return;
    if (!force && isFresh) return;
    genRef.current = true;
    setBusy(true);
    try {
      const activeGoals = goals.filter((g) => g.status === 'active');
      let quoteToSave = null;

      // Con obiettivi attivi provo la frase AI personalizzata; se l'AI non risponde
      // (es. chiave Gemini assente) NON lascio la card vuota: ripiego sul locale.
      if (activeGoals.length > 0) {
        try {
          const snap = buildUserSnapshot({
            displayName: user.displayName,
            profile: user.profile,
            habits,
            completions,
            goals,
            diary,
          });
          const raw = await requestPersonalQuote(snap);
          const parsed = safeParseQuote(raw);
          if (parsed) quoteToSave = { text: parsed.text, author: null, source: 'ai' };
        } catch (err) {
          console.error('Citazione AI non riuscita, uso quella locale:', err);
        }
      }

      // Ramo locale (nessun obiettivo attivo, oppure fallback dopo un errore AI).
      if (!quoteToSave) {
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        quoteToSave = { text: q.text, author: q.author, source: 'local' };
      }

      await setDailyQuote(user.uid, quoteToSave, oggi);
    } catch (err) {
      console.error('Errore citazione del giorno:', err);
    } finally {
      setBusy(false);
      genRef.current = false;
    }
  };

  // Generazione automatica una volta al giorno, ma solo dopo che gli obiettivi
  // sono stati caricati: cosi la scelta locale/AI usa i dati veri, non lo stato
  // iniziale vuoto.
  useEffect(() => {
    if (!user || isFresh || goalsLoading) return;
    generate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, oggi, isFresh, goalsLoading]);

  if (busy && !cached?.text) {
    return <div className={styles.card}>Cerco la citazione giusta per oggi...</div>;
  }
  if (!cached?.text) return null;

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h3>Citazione del giorno</h3>
        <button
          className={styles.refresh}
          onClick={() => generate(true)}
          disabled={busy}
          aria-label="Aggiorna citazione"
          title="Nuova citazione"
        >
          {busy ? '...' : '↻'}
        </button>
      </div>
      <blockquote className={styles.quote}>"{cached.text}"</blockquote>
      {cached.author && <span className={styles.author}>— {cached.author}</span>}
    </div>
  );
}

// Il prompt chiede JSON {text:"..."}, ma parso in modo tollerante: a volte Gemini
// aggiunge fence ```json o vira leggermente sul formato.
function safeParseQuote(raw) {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const obj = JSON.parse(cleaned);
    if (obj.text) return { text: String(obj.text).trim() };
  } catch {
    const m = raw.match(/"?text"?\s*:\s*"([^"]+)"/i);
    if (m) return { text: m[1].trim() };
  }
  // Ultima spiaggia: se non e' JSON, uso il testo grezzo ripulito.
  const fallback = raw.replace(/```json|```/g, '').trim();
  return fallback ? { text: fallback } : null;
}
