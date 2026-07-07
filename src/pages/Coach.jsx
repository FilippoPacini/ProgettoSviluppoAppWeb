import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCoach } from '../hooks/useCoach';
import { CoachMessage } from '../components/CoachMessage/CoachMessage';
import { Button } from '../components/UI/Button';
import styles from './Coach.module.css';

// Spunti rapidi: cliccandoli manda la domanda al coach.
const PROMPTS = [
  'Come sto andando questa settimana?',
  'Dammi un consiglio per restare costante',
  'Dammi una citazione motivazionale per oggi',
  'Quali abitudini sto trascurando?',
  'Che cosa potrei cambiare nella mia routine?',
  'Riassumi il mio ultimo mese',
  'Dammi una spinta motivazionale',
  'In che giorno della settimana faccio piu\' fatica?',
  'I miei obiettivi sono realistici?',
  'Suggeriscimi una nuova abitudine',
];

export function Coach() {
  const { user } = useAuth();
  const { messages, thinking, askCoach } = useCoach();

  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  // Nessun messaggio automatico all'ingresso: la conversazione parte vuota e il
  // primo messaggio (anche il primissimo) lo manda l'utente, cliccando uno spunto
  // o scrivendo. Gli spunti sono solo suggerimenti: NON partono da soli.

  // Auto-scroll in fondo a ogni nuovo messaggio.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  const send = (text) => {
    if (!text || text.trim().length === 0) return;
    askCoach(text.trim());
    setDraft('');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Coach AI 🤖</h1>
        <p>
          {user?.profile
            ? `Consigli su misura per il tuo profilo ${user.profile.name}.`
            : 'Completa il test di personalita\' per consigli piu\' mirati.'}
        </p>
      </div>

      <div className={styles.chat}>
        <div className={styles.messages} ref={scrollRef}>
          {messages.length === 0 && !thinking && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>💬</span>
              <p>Inizia tu la conversazione: scrivi una domanda o tocca uno degli spunti qui sotto.</p>
            </div>
          )}
          {messages.map((msg) => (
            <CoachMessage key={msg.id} message={msg} />
          ))}
          {thinking && (
            <div className={styles.typing}>
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        <div className={styles.prompts}>
          {PROMPTS.map((p) => (
            <button key={p} className={styles.promptChip} onClick={() => send(p)} disabled={thinking}>
              {p}
            </button>
          ))}
        </div>

        <div className={styles.inputRow}>
          <input
            className={styles.input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(draft)}
            placeholder="Scrivi al coach..."
            disabled={thinking}
          />
          <Button onClick={() => send(draft)} disabled={thinking || draft.trim().length === 0}>
            Invia
          </Button>
        </div>
      </div>
    </div>
  );
}
