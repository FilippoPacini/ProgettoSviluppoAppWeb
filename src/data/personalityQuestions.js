// Test di personalita' a due fasi: prima l'utente sceglie fino a 3 settori tra 15,
// poi riceve 9 domande pescate da quei settori (10 in tutto). Le 9 domande nascono
// da 9 template declinati sul tema del settore, con opzioni e pesi condivisi.
// Ogni opzione porta un 'weight' su un asse ('axis'): approccio (analitico -/creativo +)
// e ritmo (costante -/esplosivo +); i pesi si sommano in computeProfile.

// I 15 settori. 'tema' e' la frase iniettata nei template.
export const sectors = [
  { id: 'libri', label: 'Libri', emoji: '📚', tema: 'la lettura' },
  { id: 'matematica', label: 'Matematica', emoji: '➗', tema: 'lo studio della matematica' },
  { id: 'informatica', label: 'Informatica', emoji: '💻', tema: 'la programmazione' },
  { id: 'sport', label: 'Sport', emoji: '🏃', tema: 'l\'allenamento' },
  { id: 'musica', label: 'Musica', emoji: '🎵', tema: 'la musica' },
  { id: 'arte', label: 'Arte', emoji: '🎨', tema: 'il disegno e l\'arte' },
  { id: 'cucina', label: 'Cucina', emoji: '🍳', tema: 'la cucina' },
  { id: 'viaggi', label: 'Viaggi', emoji: '✈️', tema: 'i viaggi' },
  { id: 'natura', label: 'Natura', emoji: '🌿', tema: 'le attivita\' all\'aperto' },
  { id: 'cinema', label: 'Cinema', emoji: '🎬', tema: 'i film e le serie' },
  { id: 'scrittura', label: 'Scrittura', emoji: '✍️', tema: 'la scrittura' },
  { id: 'lingue', label: 'Lingue', emoji: '🗣️', tema: 'lo studio delle lingue' },
  { id: 'finanza', label: 'Finanza', emoji: '💰', tema: 'la gestione del denaro' },
  { id: 'benessere', label: 'Benessere', emoji: '🧘', tema: 'il benessere' },
  { id: 'volontariato', label: 'Volontariato', emoji: '🤝', tema: 'il volontariato' },
];

// I 9 template. text e' una funzione del tema del settore. Le opzioni sono
// condivise tra i settori: read-only, quindi la condivisione e' sicura.
const QUESTION_TEMPLATES = [
  {
    axis: 'ritmo',
    text: (t) => `Quando ti dedichi a ${t}, il tuo ritmo e'...`,
    options: [
      { text: 'Costante, un po\' ogni giorno', weight: -2 },
      { text: 'Regolare, con qualche picco', weight: -1 },
      { text: 'A sessioni intense quando sono in vena', weight: 1 },
      { text: 'A ondate: parto forte, poi mi fermo', weight: 2 },
    ],
  },
  {
    axis: 'approccio',
    text: (t) => `Come inizi di solito con ${t}?`,
    options: [
      { text: 'Preparo un piano prima di partire', weight: -2 },
      { text: 'Faccio una lista veloce e aggiusto strada facendo', weight: -1 },
      { text: 'Parto e vedo dove mi porta', weight: 1 },
      { text: 'Improvviso, e\' piu\' divertente', weight: 2 },
    ],
  },
  {
    axis: 'ritmo',
    text: (t) => `Come affronti un obiettivo grande in ${t}?`,
    options: [
      { text: 'Un po\' ogni giorno, senza fretta', weight: -2 },
      { text: 'Tappe regolari con scadenze morbide', weight: -1 },
      { text: 'Sessioni intense quando sono carico', weight: 1 },
      { text: 'Sprint totali in pochi giorni', weight: 2 },
    ],
  },
  {
    axis: 'approccio',
    text: (t) => `Cosa ti motiva di piu' in ${t}?`,
    options: [
      { text: 'Vedere progressi misurabili', weight: -2 },
      { text: 'Spuntare le cose fatte da una lista', weight: -1 },
      { text: 'Provare approcci sempre diversi', weight: 1 },
      { text: 'L\'entusiasmo del momento e le idee nuove', weight: 2 },
    ],
  },
  {
    axis: 'ritmo',
    text: (t) => `La routine legata a ${t} per te e'...`,
    options: [
      { text: 'Rassicurante, mi tiene in carreggiata', weight: -2 },
      { text: 'Utile, ma con un po\' di margine', weight: -1 },
      { text: 'A volte noiosa, mi serve varieta\'', weight: 1 },
      { text: 'Una gabbia, ho bisogno di liberta\'', weight: 2 },
    ],
  },
  {
    axis: 'approccio',
    text: (t) => `Se qualcosa non funziona in ${t}, tu...`,
    options: [
      { text: 'Analizzo cosa e\' andato storto e correggo', weight: -2 },
      { text: 'Rivedo il metodo con calma', weight: -1 },
      { text: 'Cambio approccio e ne provo un altro', weight: 1 },
      { text: 'Butto tutto e reinvento da zero', weight: 2 },
    ],
  },
  {
    axis: 'approccio',
    text: (t) => `Il tuo modo ideale di organizzarti per ${t} e'...`,
    options: [
      { text: 'Tutto ordinato, ogni cosa al suo posto', weight: -2 },
      { text: 'In ordine, ma vissuto', weight: -1 },
      { text: 'Un po\' caotico, pieno di stimoli', weight: 1 },
      { text: 'Creativamente disordinato', weight: 2 },
    ],
  },
  {
    axis: 'ritmo',
    text: (t) => `La tua energia con ${t} durante la settimana e'...`,
    options: [
      { text: 'Costante, piu\' o meno uguale ogni giorno', weight: -2 },
      { text: 'Abbastanza regolare, con qualche picco', weight: -1 },
      { text: 'Alternata: giorni pieni e giorni scarichi', weight: 1 },
      { text: 'A ondate: quando parto non mi fermo, poi crollo', weight: 2 },
    ],
  },
  {
    axis: 'approccio',
    text: (t) => `Come misuri i tuoi progressi in ${t}?`,
    options: [
      { text: 'Con numeri e dati precisi', weight: -2 },
      { text: 'Con una lista di traguardi', weight: -1 },
      { text: 'A sensazione, senza troppi conti', weight: 1 },
      { text: 'Non li misuro, seguo l\'ispirazione', weight: 2 },
    ],
  },
];

// 135 domande costruite dai template. sectorQuestions[settore] = 9 domande.
export const sectorQuestions = Object.fromEntries(
  sectors.map((s) => [
    s.id,
    QUESTION_TEMPLATES.map((tpl, i) => ({
      id: `${s.id}_${i + 1}`,
      axis: tpl.axis,
      text: tpl.text(s.tema),
      options: tpl.options,
    })),
  ])
);

// Restituisce 9 domande in base ai settori scelti (max 3): 3 per settore quando
// sono 3, altrimenti riempie fino a 9 pescando le domande successive dei pool.
export function pickQuestions(selectedSectorIds) {
  const chosen = selectedSectorIds.length > 0 ? selectedSectorIds : [sectors[0].id];
  const perSector = Math.floor(9 / chosen.length);
  const picked = chosen.flatMap((id) => (sectorQuestions[id] || []).slice(0, perSector));
  let i = 0;
  while (picked.length < 9 && i < 60) {
    const id = chosen[i % chosen.length];
    const extra = (sectorQuestions[id] || [])[perSector + Math.floor(i / chosen.length)];
    if (extra && !picked.includes(extra)) picked.push(extra);
    i++;
  }
  return picked.slice(0, 9);
}
