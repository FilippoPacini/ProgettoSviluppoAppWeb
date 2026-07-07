// Il test misura due assi: approccio (analitico -/creativo +) e ritmo (costante -/
// esplosivo +). Ogni opzione porta un 'weight' su un 'axis'; computeProfile somma i
// pesi e sceglie l'etichetta del quadrante risultante.

const LABELS = {
  'analitico-costante': {
    key: 'analitico-costante',
    name: 'Analitico-Costante',
    tagline: 'Costruisci con metodo, un mattone alla volta.',
    description:
      'Ti muovi meglio con piani chiari e routine stabili. Preferisci il progresso ' +
      'misurabile alla motivazione improvvisa: le tue streak lunghe nascono dalla costanza.',
  },
  'analitico-esplosivo': {
    key: 'analitico-esplosivo',
    name: 'Analitico-Esplosivo',
    tagline: 'Studi il terreno, poi scatti.',
    description:
      'Analizzi prima di agire, ma quando parti vai a tutta. Funzioni bene con obiettivi ' +
      'a sprint e sfide misurabili di breve durata.',
  },
  'creativo-costante': {
    key: 'creativo-costante',
    name: 'Creativo-Costante',
    tagline: 'Segui l\'ispirazione, ma torni sempre.',
    description:
      'Ami variare e sperimentare, e allo stesso tempo tieni un ritmo di fondo affidabile. ' +
      'Le abitudini flessibili ti si adattano meglio di quelle rigide.',
  },
  'creativo-esplosivo': {
    key: 'creativo-esplosivo',
    name: 'Creativo-Esplosivo',
    tagline: 'Energia a ondate, idee a raffica.',
    description:
      'Ti accendi in fretta e produci molto quando sei nel flusso. La sfida è trasformare ' +
      'gli scatti in continuità: piccole abitudini-ancora ti tengono in carreggiata.',
  },
};

// computeProfile riceve le risposte, l'elenco delle domande effettivamente poste
// (dinamiche, dipendono dai settori scelti) e i settori scelti come 'interests'.
export function computeProfile(answers, questions, interests = []) {
  // answers: { [questionId]: optionIndex }
  let approccio = 0; // < 0 analitico, > 0 creativo
  let ritmo = 0;     // < 0 costante,  > 0 esplosivo

  for (const q of questions) {
    const chosen = answers[q.id];
    if (chosen === undefined) continue;
    const opt = q.options[chosen];
    if (!opt) continue;
    if (q.axis === 'approccio') approccio += opt.weight;
    else if (q.axis === 'ritmo') ritmo += opt.weight;
  }

  const primo = approccio < 0 ? 'analitico' : 'creativo';
  const secondo = ritmo < 0 ? 'costante' : 'esplosivo';
  // Gli interessi (settori scelti) restano sul profilo: personalizzano coach e citazione.
  return { ...LABELS[`${primo}-${secondo}`], interests };
}

export const profileLabels = LABELS;
