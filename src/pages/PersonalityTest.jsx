import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { sectors, pickQuestions } from '../data/personalityQuestions';
import { computeProfile } from '../utils/profileCalculator';
import { Button } from '../components/UI/Button';
import { Illustration } from '../components/UI/Illustration';
import styles from './PersonalityTest.module.css';

const MAX_SECTORS = 3;

export function PersonalityTest() {
  const { completeProfile } = useAuth();
  const navigate = useNavigate();

  // Due fasi: prima la scelta dei settori, poi le 9 domande.
  const [phase, setPhase] = useState('sectors');
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  /* ---- Fase 1: settori ---- */
  const toggleSector = (id) => {
    setSelectedSectors((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= MAX_SECTORS) return prev; // massimo 3
      return [...prev, id];
    });
  };

  const startQuestions = () => {
    if (selectedSectors.length === 0) return;
    // Le 9 domande dipendono dai settori scelti: sembrano "su misura".
    setQuestions(pickQuestions(selectedSectors));
    setPhase('questions');
    setStep(0);
  };

  /* ---- Fase 2: domande ---- */
  const question = questions[step];
  const isLast = step === questions.length - 1;
  const progress = questions.length > 0 ? Math.round(((step + 1) / questions.length) * 100) : 0;

  const choose = (optionIndex) => {
    const nextAnswers = { ...answers, [question.id]: optionIndex };
    setAnswers(nextAnswers);
    if (isLast) {
      // Tutte le risposte raccolte: calcolo il profilo (con i settori come interessi).
      setResult(computeProfile(nextAnswers, questions, selectedSectors));
    } else {
      setStep((s) => s + 1);
    }
  };

  // Aspetto il salvataggio: navigo solo se riesce, altrimenti mostro l'errore
  // (cosi il profilo non va perso in silenzio).
  const finish = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await completeProfile(result);
      navigate('/');
    } catch (err) {
      console.error('Salvataggio profilo fallito:', err);
      setError(
        'Non riesco a salvare il profilo. Verifica che Firestore sia creato e che ' +
        'le Security Rules siano pubblicate, poi riprova.'
      );
      setSaving(false);
    }
  };

  /* ---- Schermata di esito ---- */
  if (result) {
    const chosenLabels = sectors.filter((s) => result.interests?.includes(s.id));
    return (
      <div className={styles.screen}>
        <div className={styles.resultCard}>
          <Illustration name="celebrate" size={140} />
          <span className={styles.resultBadge}>Il tuo profilo</span>
          <h1 className={styles.resultName}>{result.name}</h1>
          <p className={styles.resultTagline}>{result.tagline}</p>
          <p className={styles.resultDesc}>{result.description}</p>
          {chosenLabels.length > 0 && (
            <div className={styles.interests}>
              {chosenLabels.map((s) => (
                <span key={s.id} className={styles.interestChip}>
                  {s.emoji} {s.label}
                </span>
              ))}
            </div>
          )}
          {error && (
            <p style={{ color: 'var(--color-danger, #c0392b)', marginTop: '0.75rem' }}>{error}</p>
          )}
          <Button full onClick={finish} disabled={saving}>
            {saving ? 'Salvo il profilo...' : 'Inizia con HabitForge'}
          </Button>
        </div>
      </div>
    );
  }

  /* ---- Fase 1: selezione settori ---- */
  if (phase === 'sectors') {
    return (
      <div className={styles.screen}>
        <div className={styles.card}>
          <span className={styles.counter}>Passo 1 di 10</span>
          <h2 className={styles.question}>Quali argomenti ti interessano di piu'?</h2>
          <p className={styles.hint}>Scegline fino a {MAX_SECTORS}: le domande successive si adatteranno.</p>

          <div className={styles.sectors}>
            {sectors.map((s) => {
              const active = selectedSectors.includes(s.id);
              const disabled = !active && selectedSectors.length >= MAX_SECTORS;
              return (
                <button
                  key={s.id}
                  className={`${styles.sectorBtn} ${active ? styles.sectorActive : ''}`}
                  onClick={() => toggleSector(s.id)}
                  disabled={disabled}
                >
                  <span className={styles.sectorEmoji}>{s.emoji}</span>
                  {s.label}
                </button>
              );
            })}
          </div>

          <Button full onClick={startQuestions} disabled={selectedSectors.length === 0}>
            {selectedSectors.length === 0
              ? 'Scegli almeno un argomento'
              : `Continua (${selectedSectors.length}/${MAX_SECTORS})`}
          </Button>
        </div>
      </div>
    );
  }

  /* ---- Fase 2: domande ---- */
  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.counter}>
          Domanda {step + 1} di {questions.length}
        </span>

        <h2 className={styles.question}>{question.text}</h2>

        <div className={styles.options}>
          {question.options.map((opt, i) => (
            <button key={i} className={styles.option} onClick={() => choose(i)}>
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
