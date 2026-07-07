// Le date qui viaggiano sempre come stringhe 'YYYY-MM-DD': sono ordinabili
// alfabeticamente e coincidono con la chiave dei documenti Firestore delle completions.

export function toISODate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function today() {
  return toISODate(new Date());
}

// Sposto una data ISO di n giorni (n negativo = indietro nel tempo)
export function addDays(isoDate, n) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysBetween(isoA, isoB) {
  const a = new Date(isoA + 'T00:00:00');
  const b = new Date(isoB + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

const MESI = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
];

const GIORNI = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];

export function formatLong(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatWeekday(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return GIORNI[d.getDay()];
}

export function monthLabel(monthIndex) {
  return MESI[monthIndex];
}

// getDay() mette la domenica a 0; in Italia la settimana parte da lunedi
export function isoWeekday(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return (d.getDay() + 6) % 7; // 0 = lunedi ... 6 = domenica
}
