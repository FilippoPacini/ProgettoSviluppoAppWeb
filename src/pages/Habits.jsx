import { useState } from 'react';
import { useHabits } from '../hooks/useHabits';
import { HeatmapCalendar } from '../components/Heatmap/HeatmapCalendar';
import { EmptyState } from '../components/UI/EmptyState';
import { Modal } from '../components/UI/Modal';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { Spinner } from '../components/UI/Spinner';
import { currentStreak } from '../utils/streakCalculator';
import { today, isoWeekday } from '../utils/dateUtils';
import styles from './Habits.module.css';

const EMOJI_CHOICES = ['✅', '🧘', '📚', '🏃', '💧', '💻', '🎸', '🥗', '😴', '✍️', '🧠', '🚴'];
const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export function Habits() {
  const { habits, completions, loading, addHabit, deleteHabit, toggleCompletion, isCompleted } =
    useHabits();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', emoji: '✅', frequency: 'daily', days: [0, 1, 2, 3, 4, 5, 6] });
  const [error, setError] = useState('');

  const oggi = today();
  const weekday = isoWeekday(oggi);

  const resetForm = () => {
    setForm({ name: '', emoji: '✅', frequency: 'daily', days: [0, 1, 2, 3, 4, 5, 6] });
    setError('');
  };

  const toggleDay = (dayIndex) => {
    setForm((prev) => {
      const has = prev.days.includes(dayIndex);
      const days = has ? prev.days.filter((d) => d !== dayIndex) : [...prev.days, dayIndex].sort();
      return { ...prev, days };
    });
  };

  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (saving) return;
    if (form.name.trim().length < 2) {
      setError('Dai un nome all\'abitudine');
      return;
    }
    if (form.frequency === 'custom' && form.days.length === 0) {
      setError('Seleziona almeno un giorno');
      return;
    }
    // Le daily coprono tutti i giorni; per le custom uso i giorni scelti
    const days = form.frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : form.days;
    setSaving(true);
    setError('');
    try {
      await addHabit({ ...form, days, color: '#0f9b8e' });
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Creazione abitudine fallita:', err);
      setError('Non riesco a salvare l\'abitudine. Verifica Firestore e le Security Rules, poi riprova.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Spinner label="Carico le abitudini..." />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className={styles.headerRow}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Le tue abitudini</h1>
          <p>Traccia i tuoi progressi giorno per giorno.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nuova abitudine</Button>
      </div>

      {habits.length === 0 ? (
        <EmptyState
          illustration="habits"
          title="Nessuna abitudine ancora"
          text="Aggiungi la tua prima abitudine e inizia a costruire la tua streak."
        />
      ) : (
        <div className={styles.habitGrid}>
          {habits.map((habit) => {
          const scheduledToday = habit.frequency === 'daily' || habit.days.includes(weekday);
          const done = isCompleted(habit.id, oggi);
          return (
            <div key={habit.id} className={styles.habitRow}>
              <span className={styles.emoji}>{habit.emoji}</span>
              <div className={styles.habitInfo}>
                <span className={styles.name}>{habit.name}</span>
                <span className={styles.sub}>
                  {habit.frequency === 'daily' ? 'Ogni giorno' : `${habit.days.length} giorni/sett.`}
                  {' · '}
                  🔥 {currentStreak(habit, completions)}
                </span>
              </div>

              {scheduledToday ? (
                <button
                  className={`${styles.toggle} ${done ? styles.toggleOn : ''}`}
                  onClick={() => toggleCompletion(habit.id, oggi)}
                >
                  {done ? 'Fatta ✓' : 'Segna'}
                </button>
              ) : (
                <span className={styles.notToday}>non oggi</span>
              )}

              <button
                className={styles.deleteBtn}
                onClick={() => deleteHabit(habit.id)}
                aria-label="Elimina abitudine"
              >
                🗑
              </button>
            </div>
          );
        })}
        </div>
      )}

      <section className={styles.heatmapSection}>
        <h2 className={styles.heatmapTitle}>Il tuo anno</h2>
        <p className={styles.heatmapSub}>Ogni cella è un giorno: più è scura, più abitudini hai completato.</p>
        <HeatmapCalendar completions={completions} totalHabits={habits.length} />
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuova abitudine">
        <Input
          label="Nome"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Es. Leggere 20 minuti"
          error={error}
        />

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Icona</span>
          <div className={styles.emojiPicker}>
            {EMOJI_CHOICES.map((emoji) => (
              <button
                key={emoji}
                className={`${styles.emojiBtn} ${form.emoji === emoji ? styles.emojiActive : ''}`}
                onClick={() => setForm((p) => ({ ...p, emoji }))}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Frequenza</span>
          <div className={styles.freqRow}>
            <button
              className={`${styles.freqBtn} ${form.frequency === 'daily' ? styles.freqActive : ''}`}
              onClick={() => setForm((p) => ({ ...p, frequency: 'daily' }))}
            >
              Ogni giorno
            </button>
            <button
              className={`${styles.freqBtn} ${form.frequency === 'custom' ? styles.freqActive : ''}`}
              onClick={() => setForm((p) => ({ ...p, frequency: 'custom' }))}
            >
              Giorni scelti
            </button>
          </div>
        </div>

        {form.frequency === 'custom' && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Quali giorni</span>
            <div className={styles.daysRow}>
              {WEEKDAYS.map((label, i) => (
                <button
                  key={i}
                  className={`${styles.dayBtn} ${form.days.includes(i) ? styles.dayActive : ''}`}
                  onClick={() => toggleDay(i)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button full onClick={handleCreate} disabled={saving}>
          {saving ? 'Salvo...' : 'Crea abitudine'}
        </Button>
      </Modal>
    </div>
  );
}
