import { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';
import styles from './HabitForm.module.css';

const EMOJI_CHOICES = ['✅', '🧘', '📚', '🏃', '💧', '💻', '🎸', '🥗', '😴', '✍️', '🧠', '🚴'];
const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const emptyForm = () => ({
  name: '',
  emoji: '✅',
  frequency: 'daily',
  days: [0, 1, 2, 3, 4, 5, 6],
  measureValue: '',
  measureUnit: '',
});

// Dal documento Firestore al form: la misura e' opzionale, quindi puo' mancare.
const formFromHabit = (habit) => ({
  name: habit.name,
  emoji: habit.emoji,
  frequency: habit.frequency,
  days: habit.days || [0, 1, 2, 3, 4, 5, 6],
  measureValue: habit.measure ? String(habit.measure.value) : '',
  measureUnit: habit.measure ? habit.measure.unit : '',
});

// Form dell'abitudine, in modale. Serve sia la creazione sia la modifica:
// 'habit' null = nuova. Tiene stato e validazione, la scrittura la fa la pagina.
export function HabitForm({ open, habit, onSave, onClose }) {
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Riempio i campi quando la modale si apre, non a ogni render.
  useEffect(() => {
    if (!open) return;
    setForm(habit ? formFromHabit(habit) : emptyForm());
    setError('');
  }, [open, habit]);

  const toggleDay = (dayIndex) => {
    setForm((prev) => {
      const has = prev.days.includes(dayIndex);
      const days = has
        ? prev.days.filter((d) => d !== dayIndex)
        : [...prev.days, dayIndex].sort((a, b) => a - b);
      return { ...prev, days };
    });
  };

  const handleSave = async () => {
    if (saving) return;
    if (form.name.trim().length < 2) {
      setError('Dai un nome all\'abitudine');
      return;
    }
    if (form.frequency === 'custom' && form.days.length === 0) {
      setError('Seleziona almeno un giorno');
      return;
    }
    // La misura o e' completa (numero positivo + unita') o non c'e'.
    const measureValue = Number(form.measureValue);
    const hasMeasure = form.measureValue !== '' || form.measureUnit.trim() !== '';
    if (hasMeasure && (!Number.isFinite(measureValue) || measureValue <= 0 || !form.measureUnit.trim())) {
      setError('Per la misura servono un numero maggiore di zero e un\'unita\'');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        name: form.name.trim(),
        emoji: form.emoji,
        frequency: form.frequency,
        // Le daily coprono tutti i giorni; per le custom uso i giorni scelti.
        days: form.frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : form.days,
        measure: hasMeasure ? { value: measureValue, unit: form.measureUnit.trim() } : null,
      });
      onClose();
    } catch (err) {
      console.error('Salvataggio abitudine fallito:', err);
      setError('Non riesco a salvare l\'abitudine. Verifica Firestore e le Security Rules, poi riprova.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={habit ? 'Modifica abitudine' : 'Nuova abitudine'}>
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
            // Da zero selezioni: coi sette preselezionati il click toglie invece di scegliere.
            onClick={() => setForm((p) => ({ ...p, frequency: 'custom', days: [] }))}
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
                key={label}
                className={`${styles.dayBtn} ${form.days.includes(i) ? styles.dayActive : ''}`}
                onClick={() => toggleDay(i)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Misura facoltativa: e' cio' che rende sensato collegare un obiettivo. */}
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Quanto vale un completamento (facoltativo)</span>
        <div className={styles.measureRow}>
          <Input
            type="number"
            min="1"
            value={form.measureValue}
            onChange={(e) => setForm((p) => ({ ...p, measureValue: e.target.value }))}
            placeholder="10"
          />
          <Input
            value={form.measureUnit}
            onChange={(e) => setForm((p) => ({ ...p, measureUnit: e.target.value }))}
            placeholder="minuti, km, pagine..."
          />
        </div>
        <p className={styles.hint}>
          Serve agli obiettivi collegati: 30 volte da 10 minuti fanno 300 minuti.
        </p>
      </div>

      <Button full onClick={handleSave} disabled={saving}>
        {saving ? 'Salvo...' : habit ? 'Salva modifiche' : 'Crea abitudine'}
      </Button>
    </Modal>
  );
}
