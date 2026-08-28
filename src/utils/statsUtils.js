import { addDays, daysBetween } from './dateUtils';
import { scheduledHabitsOn, completedScheduledOn } from './scheduleUtils';
import { currentStreak } from './streakCalculator';
import { goalPercent, goalStatus } from './goalUtils';

// Statistiche derivate della Dashboard: logica pura, fuori dal componente.

// Tasso su una finestra che finisce a endISO. Denominatore = previste quel giorno.
// null se non era previsto niente (diverso da 0%).
export function completionRate(habits, completions, endISO, days) {
  let expected = 0;
  let completed = 0;
  for (let i = 0; i < days; i++) {
    const iso = addDays(endISO, -i);
    expected += scheduledHabitsOn(habits, iso).length;
    completed += completedScheduledOn(habits, completions, iso);
  }
  if (expected === 0) return null;
  return Math.round((completed / expected) * 100);
}

// 7 giorni chiusi (da ieri) + confronto coi 7 precedenti. Oggi escluso: al mattino
// le abitudini non ancora fatte abbasserebbero il dato senza motivo.
export function weeklyRateWithDelta(habits, completions, todayISO) {
  const rate = completionRate(habits, completions, addDays(todayISO, -1), 7);
  const previous = completionRate(habits, completions, addDays(todayISO, -8), 7);
  const delta = rate !== null && previous !== null ? rate - previous : null;
  return { rate, previous, delta };
}

// Streak attiva piu' lunga, con la sua abitudine. Le pause non partecipano.
export function bestActiveStreak(habits, completions) {
  let best = { streak: 0, habit: null };
  for (const habit of habits) {
    if (habit.active === false) continue;
    const streak = currentStreak(habit, completions);
    if (streak > best.streak) best = { streak, habit };
  }
  return best;
}

// Obiettivo attivo con meno giorni. inRitardo = progresso sotto il tempo trascorso.
export function nearestDeadline(goals, completions, todayISO) {
  const attivi = goals
    .filter((g) => g.deadline && goalStatus(g, completions) === 'active')
    .map((g) => {
      const giorniRimanenti = daysBetween(todayISO, g.deadline);
      const percent = goalPercent(g, completions);
      const durata = g.createdAt ? daysBetween(g.createdAt, g.deadline) : null;
      const tempoTrascorso =
        durata && durata > 0 ? Math.round(((durata - giorniRimanenti) / durata) * 100) : null;
      return {
        goal: g,
        giorniRimanenti,
        percent,
        inRitardo: tempoTrascorso !== null && percent < tempoTrascorso - 15,
      };
    })
    .sort((a, b) => a.giorniRimanenti - b.giorniRimanenti);

  return attivi[0] || null;
}
