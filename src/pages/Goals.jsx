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

const emptyForm = () => ({
  title: '',
  description: '',
  targetValue: 10,
  unit: '',
  deadline: addDays(today(), 30),
  linkedHabitId: '', // '' = obiettivo manuale
});

export function Goals() {
  const { goals, loading, addGoal, updateGoal, deleteGoal } = useGoals();
  const { habits, completions } = useHabits();

  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

  const visible = filter === 'all' ? decorated : decorated.filter((d) => d.status === filter);

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
    if (!form.unit.trim()) {
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
        target: { value, unit: form.unit.trim() },
        deadline: form.deadline,
        linkedHabitId: form.linkedHabitId || null,
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

  // +1 per gli obiettivi manuali, senza superare il target.
  const increment = (goal) => {
    const target = goal.target?.value ?? 0;
    const next = Math.min(target, (goal.progress || 0) + 1);
    updateGoal(goal.id, { progress: next });
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
          <h1>Obiettivi</h1>
          <p>Traguardi misurabili con una scadenza. Collegane uno a un'abitudine per farlo avanzare da solo.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nuovo obiettivo</Button>
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
          title={filter === 'all' ? 'Nessun obiettivo ancora' : 'Niente in questa categoria'}
          text={filter === 'all' ? 'Crea il tuo primo traguardo misurabile.' : ''}
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
              onIncrement={increment}
              onDelete={deleteGoal}
            />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuovo obiettivo">
        <Input
          label="Titolo"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="Es. Leggere di piu'"
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
            label="Target"
            type="number"
            min="1"
            step="1"
            value={form.targetValue}
            onChange={(e) => setForm((p) => ({ ...p, targetValue: e.target.value }))}
          />
          <Input
            label="Unita'"
            value={form.unit}
            onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
            placeholder="libri, km, sessioni..."
          />
        </div>

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
            <option value="">Manuale (avanzo io con +1)</option>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>
                Collega a: {h.emoji} {h.name}
              </option>
            ))}
          </select>
          <p className={styles.hint}>
            Se lo colleghi a un'abitudine, il progresso conta i completamenti di quell'abitudine
            fino alla scadenza.
          </p>
        </div>

        <Button full onClick={handleCreate} disabled={saving}>
          {saving ? 'Salvo...' : 'Crea obiettivo'}
        </Button>
      </Modal>
    </div>
  );
}
