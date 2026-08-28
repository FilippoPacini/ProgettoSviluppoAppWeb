import { useState, useMemo } from 'react';
import { useHabits } from '../hooks/useHabits';
import { HeatmapCalendar } from '../components/Heatmap/HeatmapCalendar';
import { HabitForm } from '../components/HabitForm/HabitForm';
import { EmptyState } from '../components/UI/EmptyState';
import { Modal } from '../components/UI/Modal';
import { Button } from '../components/UI/Button';
import { Spinner } from '../components/UI/Spinner';
import { currentStreak } from '../utils/streakCalculator';
import { isScheduledOn, isActive } from '../utils/scheduleUtils';
import { today } from '../utils/dateUtils';
import styles from './Habits.module.css';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const FILTERS = [
  { key: 'active', label: 'Attive' },
  { key: 'paused', label: 'In pausa' },
  { key: 'all', label: 'Tutte' },
];

// Guida rapida del pulsante info.
const GUIDE = [
  'Crei un\'abitudine scegliendo nome, icona e se e\' giornaliera o solo in certi giorni della settimana.',
  'Ogni giorno la spunti dalla Dashboard oppure da questa pagina.',
  'La streak conta solo i giorni in cui l\'abitudine era in programma: saltare una domenica in cui non era prevista non la interrompe.',
  'Se ti fermi per un periodo, mettila in pausa invece di cancellarla: i giorni di pausa non contano come mancati e lo storico resta intatto.',
  'Il campo "quanto vale un completamento" (per esempio 10 minuti) serve a collegare gli obiettivi: 30 volte da 10 minuti fanno 300 minuti.',
  'La heatmap in fondo mostra l\'anno intero: piu\' scura e\' la cella, piu\' abitudini previste hai completato quel giorno.',
];

export function Habits() {
  const {
    habits, completions, loading,
    addHabit, updateHabit, setHabitActive, deleteHabit, toggleCompletion, isCompleted,
  } = useHabits();

  const [formOpen, setFormOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  // null = sto creando, altrimenti sto modificando quell'abitudine.
  const [editingHabit, setEditingHabit] = useState(null);
  const [filter, setFilter] = useState('active');

  const oggi = today();

  // Le abitudini in pausa scendono in fondo alla lista.
  const visible = useMemo(() => {
    const filtered = habits.filter((h) => {
      if (filter === 'active') return isActive(h);
      if (filter === 'paused') return !isActive(h);
      return true;
    });
    return [...filtered].sort((a, b) => Number(isActive(b)) - Number(isActive(a)));
  }, [habits, filter]);

  const pausedCount = habits.filter((h) => !isActive(h)).length;

  const openForm = (habit = null) => {
    setEditingHabit(habit);
    setFormOpen(true);
  };

  // La pagina decide se creare o aggiornare; il form sa solo produrre il payload.
  const saveHabit = (payload) =>
    editingHabit
      ? updateHabit(editingHabit.id, payload)
      : addHabit({ ...payload, color: '#3a7267' });

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
          <div className={styles.titleRow}>
            <h1>Le tue abitudini</h1>
            <button
              className={styles.infoBtn}
              onClick={() => setGuideOpen(true)}
              aria-label="Come funzionano le abitudini"
              title="Come funzionano le abitudini"
            >
              i
            </button>
          </div>
          <p>Traccia i tuoi progressi giorno per giorno.</p>
        </div>
        <Button onClick={() => openForm()}>+ Nuova abitudine</Button>
      </div>

      {/* Sempre visibili: nascondendoli si resta bloccati sul filtro 'paused' vuoto. */}
      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key === 'paused' && pausedCount > 0 && (
              <span className={styles.filterCount}>{pausedCount}</span>
            )}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          illustration="habits"
          title={
            habits.length === 0
              ? 'Nessuna abitudine ancora'
              : filter === 'paused'
                ? 'Nessuna abitudine in pausa'
                : 'Nessuna abitudine attiva'
          }
          text={
            habits.length === 0
              ? 'Aggiungi la tua prima abitudine e inizia a costruire la tua streak.'
              : filter === 'paused'
                ? 'Le abitudini che metti in pausa finiscono qui: torna su "Attive" per vedere le altre.'
                : 'Le hai messe tutte in pausa. Riprendine una da "In pausa", oppure creane una nuova.'
          }
        />
      ) : (
        <div className={styles.habitGrid}>
          {visible.map((habit) => {
            const attiva = isActive(habit);
            const scheduledToday = isScheduledOn(habit, oggi);
            const done = isCompleted(habit.id, oggi);
            return (
              <div
                key={habit.id}
                className={`${styles.habitRow} ${attiva ? '' : styles.habitPaused}`}
              >
                <span className={styles.emoji}>{habit.emoji}</span>
                <div className={styles.habitInfo}>
                  <span className={styles.name}>
                    {habit.name}
                    {!attiva && <span className={styles.pausedBadge}>In pausa</span>}
                  </span>
                  <span className={styles.sub}>
                    {habit.frequency === 'daily'
                      ? 'Ogni giorno'
                      : [...(habit.days || [])].sort((a, b) => a - b).map((d) => WEEKDAYS[d]).join(', ')}
                    {habit.measure && ` · ${habit.measure.value} ${habit.measure.unit} a volta`}
                    {' · '}
                    🔥 {currentStreak(habit, completions)}
                  </span>
                </div>

                {/* Un'abitudine in pausa non e' spuntabile. */}
                {!attiva ? (
                  <span className={styles.notToday}>in pausa</span>
                ) : scheduledToday ? (
                  <button
                    className={`${styles.toggle} ${done ? styles.toggleOn : ''}`}
                    onClick={() => toggleCompletion(habit.id, oggi)}
                  >
                    {done ? 'Fatta ✓' : 'Segna'}
                  </button>
                ) : (
                  <span className={styles.notToday}>non oggi</span>
                )}

                <div className={styles.rowActions}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => openForm(habit)}
                    aria-label="Modifica abitudine"
                    title="Modifica"
                  >
                    ✎
                  </button>
                  <button
                    className={styles.iconBtn}
                    onClick={() => setHabitActive(habit.id, !attiva)}
                    aria-label={attiva ? 'Metti in pausa' : 'Riprendi abitudine'}
                    title={attiva ? 'Metti in pausa' : 'Riprendi'}
                  >
                    {attiva ? '⏸' : '▶'}
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => deleteHabit(habit.id)}
                    aria-label="Elimina abitudine"
                    title="Elimina"
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className={styles.heatmapSection}>
        <h2 className={styles.heatmapTitle}>Il tuo anno</h2>
        <p className={styles.heatmapSub}>Ogni cella è un giorno: più è scura, più abitudini hai completato.</p>
        <HeatmapCalendar completions={completions} habits={habits} />
      </section>

      <Modal open={guideOpen} onClose={() => setGuideOpen(false)} title="Come funzionano le abitudini">
        <ol className={styles.guide}>
          {GUIDE.map((riga, i) => (
            <li key={i}>{riga}</li>
          ))}
        </ol>
      </Modal>

      <HabitForm
        open={formOpen}
        habit={editingHabit}
        onSave={saveHabit}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}
