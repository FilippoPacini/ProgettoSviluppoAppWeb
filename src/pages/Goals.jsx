import { useState, useMemo } from 'react';
import { useGoals } from '../hooks/useGoals';
import { useHabits } from '../hooks/useHabits';
import { GoalCard } from '../components/GoalCard/GoalCard';
import { EmptyState } from '../components/UI/EmptyState';
import { Modal } from '../components/UI/Modal';
import { Input, TextArea } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { Spinner } from '../components/UI/Spinner';
import { today, addDays } from '../utils/dateUtils';
import { goalProgress, goalPercent, goalStatus } from '../utils/goalUtils';
import styles from './Goals.module.css';

const FILTERS = [
  { key: 'all', label: 'Tutti' },
  { key: 'active', label: 'In corso' },
  { key: 'completed', label: 'Completati' },
  { key: 'failed', label: 'Scaduti' },
];

// Guida rapida del pulsante info: i due modi di avanzare sono blocchi separati.
const GUIDE = [
  {
    titolo: 'Un obiettivo e\' un traguardo con una scadenza',
    testo: 'Scegli quante volte vuoi fare qualcosa entro una data.',
  },
  {
    titolo: 'Collegato a un\'abitudine: avanza da solo',
    testo: 'Ogni volta che spunti "Correre 10 minuti", l\'obiettivo sale di uno. Il totale e\' sempre un multiplo di quell\'abitudine: 30 volte da 10 minuti sono 300 minuti. Non devi aggiornare niente.',
  },
  {
    titolo: 'Non collegato: lo aggiorni tu',
    testo: 'Sulla card compare "Aggiorna progresso": scrivi a che punto sei, quando vuoi.',
  },
  {
    titolo: 'In corso, completato o scaduto',
    testo: 'Cambia da solo quando raggiungi il target o quando passa la scadenza.',
  },
  {
    titolo: 'Un esempio completo',
    testo: 'L\'abitudine "Camminata 30 minuti" collegata all\'obiettivo "30 camminate entro il 30 giugno". Spunti la camminata sulla Dashboard e la barra si muove.',
  },
];

const emptyForm = () => ({
  title: '',
  description: '',
  targetValue: 10,
  unit: '',
  deadline: addDays(today(), 30),
  linkedHabitId: '', // '' = obiettivo manuale
});

// Con abitudine collegata l'unita' non e' testo libero: il progresso conta
// completamenti, quindi l'unita' e' quella dell'abitudine (o "completamenti").
function unitForHabit(habit) {
  if (!habit) return null;
  return habit.measure ? habit.measure.unit : 'completamenti';
}

export function Goals() {
  const { goals, loading, addGoal, updateGoal, deleteGoal } = useGoals();
  const { habits, completions } = useHabits();

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  // Obiettivo di cui sto aggiornando il progresso a mano (null = modale chiusa).
  const [editingGoal, setEditingGoal] = useState(null);
  const [progressValue, setProgressValue] = useState('0');
  const [progressError, setProgressError] = useState('');

  // Calcolo progresso/stato una volta sola per ogni obiettivo (derivati dai dati).
  const decorated = useMemo(
    () =>
      goals.map((g) => ({
        goal: g,
        progress: goalProgress(g, completions),
        percent: goalPercent(g, completions),
        status: goalStatus(g, completions),
        linkedHabitName: g.linkedHabitId
          ? habits.find((h) => h.id === g.linkedHabitId)?.name
          : null,
      })),
    [goals, completions, habits]
  );

  // Ricerca e filtro di stato si sommano: passano solo gli obiettivi che
  // soddisfano entrambi i criteri.
  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      decorated
        .filter((d) => filter === 'all' || d.status === filter)
        .filter((d) => query === '' || d.goal.title.toLowerCase().includes(query)),
    [decorated, filter, query]
  );

  // Abitudine collegata scelta nel form, se c'e'.
  const linkedHabit = habits.find((h) => h.id === form.linkedHabitId) || null;
  const linkedUnit = unitForHabit(linkedHabit);
  const targetNumber = Math.trunc(Number(form.targetValue)) || 0;

  const resetForm = () => {
    setForm(emptyForm());
    setError('');
  };

  const handleCreate = async () => {
    if (saving) return;
    if (form.title.trim().length < 2) {
      setError('Dai un titolo all\'obiettivo');
      return;
    }
    const value = Math.trunc(Number(form.targetValue));
    if (!Number.isInteger(value) || value <= 0) {
      setError('Il target deve essere un numero intero maggiore di zero');
      return;
    }
    // Con abitudine collegata l'unita' e' imposta, non c'e' niente da validare.
    if (!linkedHabit && !form.unit.trim()) {
      setError('Specifica l\'unita\' (es. libri, km, sessioni)');
      return;
    }
    if (!form.deadline) {
      setError('Scegli una data di scadenza');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await addGoal({
        title: form.title.trim(),
        description: form.description.trim(),
        target: { value, unit: linkedHabit ? 'volte' : form.unit.trim() },
        deadline: form.deadline,
        linkedHabitId: form.linkedHabitId || null,
        // Fotografia della misura: se l'abitudine cambia, l'obiettivo vecchio resta
        // quello di prima.
        unitPerCompletion: linkedHabit?.measure ? { ...linkedHabit.measure } : null,
      });
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Creazione obiettivo fallita:', err);
      setError('Non riesco a salvare l\'obiettivo. Verifica Firestore e le Security Rules, poi riprova.');
    } finally {
      setSaving(false);
    }
  };

  // Apertura della modale di aggiornamento manuale: precompilo col progresso attuale.
  const openProgressEditor = (goal) => {
    setEditingGoal(goal);
    setProgressValue(String(goal.progress || 0));
    setProgressError('');
  };

  const saveProgress = async () => {
    if (!editingGoal) return;
    const target = editingGoal.target?.value ?? 0;
    const value = Number(progressValue);
    if (!Number.isInteger(value) || value < 0) {
      setProgressError('Scrivi un numero intero maggiore o uguale a zero');
      return;
    }
    if (value > target) {
      setProgressError(`Il progresso non puo' superare il target (${target})`);
      return;
    }
    await updateGoal(editingGoal.id, { progress: value });
    setEditingGoal(null);
  };

  if (loading) {
    return (
      <div className="page-container">
        <Spinner label="Carico gli obiettivi..." />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className={styles.headerRow}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className={styles.titleRow}>
            <h1>Obiettivi</h1>
            <button
              className={styles.infoBtn}
              onClick={() => setGuideOpen(true)}
              aria-label="Come funzionano gli obiettivi"
              title="Come funzionano gli obiettivi"
            >
              i
            </button>
          </div>
          <p>Traguardi misurabili con una scadenza. Collegane uno a un'abitudine per farlo avanzare da solo.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nuovo obiettivo</Button>
      </div>

      <div className={styles.searchRow}>
        <input
          className={styles.search}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca un obiettivo..."
          aria-label="Cerca un obiettivo"
        />
      </div>

      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          illustration="goals"
          title={
            query !== ''
              ? 'Nessun obiettivo corrisponde alla ricerca'
              : filter === 'all'
                ? 'Nessun obiettivo ancora'
                : 'Niente in questa categoria'
          }
          text={
            query !== ''
              ? 'Prova con un altro nome, o svuota il campo di ricerca.'
              : filter === 'all'
                ? 'Crea il tuo primo traguardo misurabile.'
                : ''
          }
        />
      ) : (
        <div className={styles.grid}>
          {visible.map((d) => (
            <GoalCard
              key={d.goal.id}
              goal={d.goal}
              progress={d.progress}
              percent={d.percent}
              status={d.status}
              linkedHabitName={d.linkedHabitName}
              onEditProgress={openProgressEditor}
              onDelete={deleteGoal}
            />
          ))}
        </div>
      )}

      <Modal open={guideOpen} onClose={() => setGuideOpen(false)} title="Come funzionano gli obiettivi">
        <div className={styles.guide}>
          {GUIDE.map((blocco) => (
            <section key={blocco.titolo} className={styles.guideBlock}>
              <h3 className={styles.guideTitle}>{blocco.titolo}</h3>
              <p className={styles.guideText}>{blocco.testo}</p>
            </section>
          ))}
        </div>
      </Modal>

      <Modal open={!!editingGoal} onClose={() => setEditingGoal(null)} title="Aggiorna progresso">
        {editingGoal && (
          <>
            <p className={styles.editTitle}>{editingGoal.title}</p>
            <Input
              label={`Progresso (su ${editingGoal.target?.value ?? 0} ${editingGoal.target?.unit || ''})`}
              type="number"
              value={progressValue}
              onChange={(e) => setProgressValue(e.target.value)}
              error={progressError}
            />
            <Button full onClick={saveProgress}>
              Salva
            </Button>
          </>
        )}
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuovo obiettivo">
        <Input
          label="Titolo"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="Es. Leggere di più"
          error={error}
        />
        <TextArea
          label="Descrizione"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Dettagli o motivazione (opzionale)"
          rows={2}
        />

        <div className={styles.targetRow}>
          <Input
            label={linkedHabit ? 'Quante volte' : 'Target'}
            type="number"
            min="1"
            step="1"
            value={form.targetValue}
            onChange={(e) => setForm((p) => ({ ...p, targetValue: e.target.value }))}
          />
          {/* Con un'abitudine collegata il campo diventa di sola lettura: l'unita' la
              decide l'abitudine, non l'utente. */}
          <Input
            label="Unita'"
            value={linkedHabit ? linkedUnit : form.unit}
            onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
            placeholder="libri, km, sessioni..."
            readOnly={Boolean(linkedHabit)}
            disabled={Boolean(linkedHabit)}
          />
        </div>

        {/* Equivalenza calcolata dal vivo: rende evidente che il totale e' sempre un
            multiplo della misura dell'abitudine. */}
        {linkedHabit && (
          <p className={styles.equivalence}>
            {linkedHabit.measure
              ? `${targetNumber} volte × ${linkedHabit.measure.value} ${linkedHabit.measure.unit} = ${targetNumber * linkedHabit.measure.value} ${linkedHabit.measure.unit}`
              : `${targetNumber} completamenti di "${linkedHabit.name}"`}
          </p>
        )}

        <Input
          label="Scadenza"
          type="date"
          value={form.deadline}
          onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
        />

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Avanzamento</span>
          <select
            className={styles.select}
            value={form.linkedHabitId}
            onChange={(e) => setForm((p) => ({ ...p, linkedHabitId: e.target.value }))}
          >
            <option value="">Manuale</option>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>
                Collega a: {h.emoji} {h.name}
              </option>
            ))}
          </select>
          <p className={styles.hint}>
            Collegandolo a un'abitudine il progresso conta i completamenti di quell'abitudine
            fino alla scadenza, e l'unita' la eredita da lei. Lasciandolo manuale, il progresso
            lo aggiorni tu dalla card dell'obiettivo.
          </p>
        </div>

        <Button full onClick={handleCreate} disabled={saving}>
          {saving ? 'Salvo...' : 'Crea obiettivo'}
        </Button>
      </Modal>
    </div>
  );
}
