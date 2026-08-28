import { isoWeekday } from './dateUtils';

// Regola unica di "prevista quel giorno": la usano streak, heatmap, statistiche e
// snapshot AI. In un posto solo per non avere denominatori diversi.

// Pausa: 'from' incluso, 'to' escluso, quindi il giorno di ripresa conta subito.
// Serve lo storico e non un flag: altrimenti i dati passati cambierebbero.
function isPaused(habit, iso) {
  return (habit.pauses || []).some((p) => iso >= p.from && (p.to == null || iso < p.to));
}

// Una 'daily' e' prevista tutti i giorni, una 'custom' solo nei giorni scelti
// (0 = lunedi ... 6 = domenica). Prima della data di creazione l'abitudine non
// esisteva, quindi non era prevista: senza createdAt la considero da sempre attiva.
// Nei giorni di pausa non e' prevista, quindi non pesa su nessun denominatore.
export function isScheduledOn(habit, iso) {
  if (!habit) return false;
  if (habit.createdAt && iso < habit.createdAt) return false;
  if (isPaused(habit, iso)) return false;
  if (habit.frequency === 'daily') return true;
  return (habit.days || []).includes(isoWeekday(iso));
}

// 'active' e' comodo per filtrare senza scorrere le pause. Le abitudini vecchie
// non ce l'hanno: sono attive.
export function isActive(habit) {
  return habit?.active !== false;
}

// Le abitudini in programma per quel giorno: e' il denominatore corretto di ogni
// percentuale di completamento.
export function scheduledHabitsOn(habits, iso) {
  return (habits || []).filter((habit) => isScheduledOn(habit, iso));
}

// Quante delle abitudini previste quel giorno risultano spuntate. I completamenti di
// abitudini non previste (o cancellate) non entrano nel conteggio.
export function completedScheduledOn(habits, completions, iso) {
  const done = completions[iso] || [];
  return scheduledHabitsOn(habits, iso).filter((habit) => done.includes(habit.id)).length;
}
