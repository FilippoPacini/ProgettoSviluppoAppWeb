import { today, addDays, isoWeekday } from './dateUtils';

// La streak conta i giorni PROGRAMMATI consecutivi con l'abitudine completata (per le
// 'custom' contano solo i giorni in habit.days, 0=lun..6=dom). I giorni non programmati
// si saltano; un giorno programmato mancato la azzera.

function isScheduled(habit, iso) {
  if (!habit || habit.frequency === 'daily') return true;
  return (habit.days || []).includes(isoWeekday(iso));
}

// Primo giorno programmato <= iso (o < iso se dal giorno prima). Limite di sicurezza.
function prevScheduled(habit, iso) {
  let cursor = iso;
  for (let i = 0; i < 800; i++) {
    if (isScheduled(habit, cursor)) return cursor;
    cursor = addDays(cursor, -1);
  }
  return null;
}

// Primo giorno programmato > iso.
function nextScheduled(habit, iso) {
  let cursor = addDays(iso, 1);
  for (let i = 0; i < 800; i++) {
    if (isScheduled(habit, cursor)) return cursor;
    cursor = addDays(cursor, 1);
  }
  return null;
}

export function currentStreak(habit, completions) {
  if (!habit) return 0;
  const doneOn = (iso) => Array.isArray(completions[iso]) && completions[iso].includes(habit.id);

  // Se oggi e' programmato ma non ancora fatto, non azzero: comincio dal giorno
  // programmato precedente (non "perdo" la streak solo perche' e' mattina).
  let cursor = prevScheduled(habit, today());
  if (isScheduled(habit, today()) && !doneOn(today())) {
    cursor = prevScheduled(habit, addDays(today(), -1));
  }

  let streak = 0;
  while (cursor && doneOn(cursor)) {
    streak += 1;
    cursor = prevScheduled(habit, addDays(cursor, -1));
  }
  return streak;
}

// La streak piu' lunga di sempre, sempre sui soli giorni programmati.
export function longestStreak(habit, completions) {
  if (!habit) return 0;
  const dates = Object.keys(completions)
    .filter((iso) => Array.isArray(completions[iso]) && completions[iso].includes(habit.id))
    .filter((iso) => isScheduled(habit, iso))
    .sort();

  let best = 0;
  let run = 0;
  let prev = null;

  for (const iso of dates) {
    // Due completamenti sono consecutivi se tra loro non c'e' nessun giorno
    // programmato saltato.
    if (prev !== null && nextScheduled(habit, prev) === iso) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > best) best = run;
    prev = iso;
  }
  return best;
}

// Milestone visive: soglie a cui mostrare un badge di incoraggiamento.
const MILESTONES = [3, 7, 14, 30, 60, 100];

export function reachedMilestone(streak) {
  return MILESTONES.includes(streak);
}
