import { toISODate, isoWeekday } from './dateUtils';
import { scheduledHabitsOn, completedScheduledOn } from './scheduleUtils';

// Traduce il rapporto (completate / totali) in uno dei 5 livelli di colore della heatmap.
// 0 = nessuna, 4 = tutte. Le fasce intermedie seguono la scala GitHub-like.
export function intensityLevel(completed, total) {
  if (total === 0 || completed === 0) return 0;
  const ratio = completed / total;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

// Griglia annuale a colonne di settimane, 7 celle per colonna (lun -> dom).
// Denominatore di ogni cella = abitudini previste QUEL giorno, non il totale.
export function buildYearGrid(year, completions, habits) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  const cells = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const iso = toISODate(cursor);
    const total = scheduledHabitsOn(habits, iso).length;
    const done = completedScheduledOn(habits, completions, iso);
    cells.push({
      date: iso,
      completed: done,
      total,
      level: intensityLevel(done, total),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Padding iniziale: se il 1 gennaio non è lunedi riempio con celle vuote
  // per allineare la prima colonna al giorno della settimana corretto.
  const firstWeekday = isoWeekday(cells[0].date);
  const padded = [...Array(firstWeekday).fill(null), ...cells];

  const weeks = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  return weeks;
}

// Etichette dei mesi da posizionare sopra le colonne giuste
export function monthPositions(weeks) {
  const positions = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstReal = week.find((cell) => cell !== null);
    if (!firstReal) return;
    const month = new Date(firstReal.date + 'T00:00:00').getMonth();
    if (month !== lastMonth) {
      positions.push({ month, weekIndex });
      lastMonth = month;
    }
  });
  return positions;
}
