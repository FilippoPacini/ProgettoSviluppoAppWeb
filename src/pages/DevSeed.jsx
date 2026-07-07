import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { setDocument, saveProfile } from '../services/firestore';
import { profileLabels } from '../utils/profileCalculator';
import { toISODate } from '../utils/dateUtils';

// Pagina di seed disponibile SOLO in sviluppo (import.meta.env.DEV): in produzione il
// componente e la rotta non entrano nel bundle. Popola l'account loggato con dati dal
// 1 gennaio 2026 a oggi, coerenti col profilo "Analitico-Costante".

// I giorni sono 0=lunedi ... 6=domenica, come nel resto dell'app (isoWeekday).
const SEED_HABITS = [
  { name: 'Leggere 20 minuti', emoji: '📚', frequency: 'daily', days: [0, 1, 2, 3, 4, 5, 6], color: '#4ecdc4' },
  { name: 'Camminata 30 minuti', emoji: '🏃', frequency: 'daily', days: [0, 1, 2, 3, 4, 5, 6], color: '#f39c12' },
  { name: 'Meditazione', emoji: '🧘', frequency: 'daily', days: [0, 1, 2, 3, 4, 5, 6], color: '#0f9b8e' },
  { name: 'Revisione lezioni SAW', emoji: '💻', frequency: 'custom', days: [0, 2, 4], color: '#0a7a6f' }, // lun, mer, ven
  { name: 'No social prima delle 10', emoji: '📵', frequency: 'daily', days: [0, 1, 2, 3, 4, 5, 6], color: '#5a7a74' },
];

// Obiettivi del seed: target misurabile + scadenza. Alcuni collegati a un'abitudine
// (progresso automatico dai completamenti), altri manuali con progress iniziale.
// createdAt = 2026-01-01 cosi i collegati contano i completamenti dall'inizio.
const SEED_GOALS = [
  {
    title: 'Leggere 10 libri nel 2026', description: 'Circa un libro al mese.',
    target: { value: 10, unit: 'libri' }, deadline: '2026-12-31',
    linkedHabitId: null, progress: 4, createdAt: '2026-01-01', status: 'active',
  },
  {
    title: 'Camminare 300 km', description: 'Un passo alla volta.',
    target: { value: 300, unit: 'km' }, deadline: '2026-09-30',
    linkedHabitId: null, progress: 128, createdAt: '2026-01-01', status: 'active',
  },
  {
    title: 'Meditare 40 volte', description: 'Costruire una pratica costante.',
    target: { value: 40, unit: 'sessioni' }, deadline: '2026-07-31',
    linkedHabitId: 'habit_2', progress: 0, createdAt: '2026-01-01', status: 'active',
  },
  {
    title: 'Revisionare SAW 24 volte', description: 'Preparazione all\'esame.',
    target: { value: 24, unit: 'sessioni' }, deadline: '2026-07-15',
    linkedHabitId: 'habit_3', progress: 0, createdAt: '2026-01-01', status: 'active',
  },
];

// Profilo demo: archetipo + interessi (i settori del test), usati per personalizzare
// coach e citazione del giorno.
const SEED_PROFILE = {
  ...profileLabels['analitico-costante'],
  interests: ['informatica', 'libri', 'benessere'],
};

const SEED_DIARY_TEMPLATES = [
  'Giornata produttiva, tenute tutte le abitudini.',
  'Un po\' stanco ma non ho saltato la camminata.',
  'Trovato un buon ritmo con la revisione delle slide SAW.',
  'Weekend fiacco, ho saltato la meditazione. Riparto domani.',
  'Ripreso il ritmo dopo il calo di ieri.',
  'Streak di camminata che continua, mi da\' soddisfazione.',
];

// Esegue le scritture a blocchi (invece di una alla volta): molte connessioni in
// parallelo dentro ogni blocco, cosi il seed passa da decine di secondi a pochi,
// e tra un blocco e l'altro aggiorno la percentuale mostrata all'utente.
async function runInChunks(items, size, worker, onProgress) {
  let done = 0;
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    await Promise.all(chunk.map(worker));
    done += chunk.length;
    onProgress(Math.round((done / items.length) * 100));
  }
}

export function DevSeed() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  if (!import.meta.env.DEV) return <p className="page-container">Non disponibile in produzione.</p>;
  if (!user) return <p className="page-container">Loggati prima di eseguire il seed.</p>;

  const runSeed = async () => {
    setRunning(true);
    setDone(false);
    try {
      // 1) Dati "strutturali" (profilo, abitudini, obiettivi, diario): poche
      //    scritture, le mando in parallelo. Le scrivo PRIMA cosi compaiono subito.
      setStatus('Scrivo profilo, abitudini, obiettivi e diario...');
      const habitIds = SEED_HABITS.map((_, i) => `habit_${i}`);
      const diaryDates = [
        '2026-01-05', '2026-01-18', '2026-02-02', '2026-02-14', '2026-02-27',
        '2026-03-08', '2026-03-15', '2026-03-25', '2026-04-05', '2026-04-19',
        '2026-05-01', '2026-05-14', '2026-05-28', '2026-06-10', '2026-06-25',
      ];
      await Promise.all([
        saveProfile(user.uid, SEED_PROFILE),
        ...SEED_HABITS.map((h, i) => setDocument(user.uid, 'habits', habitIds[i], { ...h, createdAt: '2026-01-01' })),
        ...SEED_GOALS.map((g, i) => setDocument(user.uid, 'goals', `goal_${i}`, g)),
        ...diaryDates.map((date, i) => setDocument(user.uid, 'diary', `diary_${i}`, {
          date, text: SEED_DIARY_TEMPLATES[i % SEED_DIARY_TEMPLATES.length],
        })),
      ]);

      // 2) Completions dal 2026-01-01 a oggi. Prima le calcolo tutte, poi le scrivo
      //    a blocchi con barra di avanzamento. Pattern realistico: ~85% nei feriali,
      //    ~50% nel weekend, un calo tra il 10 e il 20 marzo.
      const start = new Date('2026-01-01T00:00:00');
      const end = new Date();
      const completionDocs = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dow = d.getDay();               // 0=domenica ... 6=sabato
        const wd = (dow + 6) % 7;             // 0=lunedi ... 6=domenica, come isoWeekday
        const month = d.getMonth();
        let baseRate = (wd >= 5) ? 0.5 : 0.85;
        if (month === 2 && d.getDate() >= 10 && d.getDate() <= 20) baseRate = 0.2;

        const doneToday = SEED_HABITS
          .map((h, idx) => {
            if (h.frequency === 'custom' && !h.days.includes(wd)) return null;
            return Math.random() < baseRate ? habitIds[idx] : null;
          })
          .filter(Boolean);

        if (doneToday.length > 0) completionDocs.push({ iso: toISODate(d), habits: doneToday });
      }

      setStatus(`Scrivo i completamenti (0%)...`);
      await runInChunks(
        completionDocs, 25,
        (c) => setDocument(user.uid, 'completions', c.iso, { habits: c.habits }),
        (pct) => setStatus(`Scrivo i completamenti (${pct}%)...`),
      );

      setStatus('');
      setDone(true);
    } catch (err) {
      setStatus('Errore: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="page-container">
      <h1>🌱 Dev Seed</h1>
      <p>Popola l'account loggato ({user.email}) con dati di esempio dal 1 gennaio 2026 a oggi.</p>
      <p><strong>Attenzione:</strong> sovrascrive habits/goals/diary/completions con id noti.</p>
      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={runSeed}
          disabled={running}
          style={{
            background: 'var(--color-primary)', color: '#fff', padding: '0.6rem 1.2rem',
            borderRadius: 'var(--radius-md)', fontWeight: 600, opacity: running ? 0.6 : 1,
          }}
        >
          {running ? 'Seed in corso...' : 'Esegui seed'}
        </button>
      </div>

      {status && <p style={{ marginTop: '1rem' }}>{status}</p>}

      {/* Notifica esplicita di fine seed: banner verde, non solo una riga di testo. */}
      {done && (
        <div
          style={{
            marginTop: '1rem', padding: '0.9rem 1.1rem',
            background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)',
            border: '1px solid var(--color-primary-light)', borderRadius: 'var(--radius-md)',
            fontWeight: 600,
          }}
        >
          ✅ Seed completato! Vai su Dashboard per vedere i dati.
        </div>
      )}
    </div>
  );
}
