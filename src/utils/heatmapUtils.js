import { toISODate, isoWeekday } from './dateUtils';

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

// Costruisce la griglia di un anno come colonne di settimane (stile contribution graph).
// Ogni colonna ha 7 celle (lun -> dom). Le celle prima del 1 gennaio o dopo oggi sono null.
export function buildYearGrid(year, completions, totalHabits) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  const cells = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const iso = toISODate(cursor);
    const done = completions[iso] ? completions[iso].length : 0;
    cells.push({
      date: iso,
      completed: done,
      total: totalHabits,
      level: intensityLevel(done, totalHabits),
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
