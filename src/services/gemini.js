// Chiamata REST all'API Google Gemini per il coach AI (POST, body e risposta JSON,
// check response.ok). La chiave sta nel client: la si protegge restringendola per HTTP
// referrer dalla Google Cloud Console (vedi README), non nascondendola.

import { goalProgress, goalStatus } from '../utils/goalUtils';
import { currentStreak } from '../utils/streakCalculator';
import { isScheduledOn, scheduledHabitsOn, completedScheduledOn } from '../utils/scheduleUtils';
import { today, addDays, daysBetween } from '../utils/dateUtils';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Sottoinsieme compatto dello stato utente: mandare tutto farebbe esplodere i token.
export function buildUserSnapshot({ displayName, profile, habits, completions, goals, diary }) {
  const oggi = today();
  const last30 = last30DaysCompletionRate(habits, completions);
  const previsteOggi = scheduledHabitsOn(habits, oggi);
  const fatteOggi = completions[oggi] || [];

  return {
    // Solo il nome proprio: col nome completo il modello scrive "Filippo Pacini" a
    // ogni riga e sembra una lettera formale.
    nome: displayName ? displayName.trim().split(/\s+/)[0] : null,
    profilo: profile
      ? {
          chiave: profile.key,
          etichetta: profile.name,
          descrizione: profile.description,
          interessi: profile.interests || [],
        }
      : null,
    // Solo le attive: le pause non sono previste e non devono entrare nei conteggi.
    abitudini: habits
      .filter((h) => h.active !== false)
      .map((h) => ({
        nome: h.name,
        frequenza: h.frequency,
        giorni: h.days || null,
        previstaOggi: isScheduledOn(h, oggi),
        streak: currentStreak(h, completions),
      })),
    abitudiniInPausa: habits.filter((h) => h.active === false).length,
    ultimi30Giorni: last30,
    // Fotografia di oggi: serve al report per non parlare solo di medie.
    oggi: {
      data: oggi,
      abitudiniPreviste: previsteOggi.length,
      completate: completedScheduledOn(habits, completions, oggi),
      mancanti: previsteOggi.filter((h) => !fatteOggi.includes(h.id)).map((h) => h.name),
    },
    obiettivi: goals.map((g) => ({
      titolo: g.title,
      target: g.target ? `${g.target.value} ${g.target.unit}` : null,
      progresso: goalProgress(g, completions),
      stato: goalStatus(g, completions),
      scadenza: g.deadline,
      giorniRimanenti: g.deadline ? daysBetween(oggi, g.deadline) : null,
      manuale: !g.linkedHabitId,
    })),
    ultimeVociDiario: diary.slice(0, 3).map((e) => ({
      data: e.date,
      estratto: (e.text || '').slice(0, 120),
    })),
  };
}

// Riassunto degli ultimi 30 giorni: completate su previste, giorno per giorno.
function last30DaysCompletionRate(habits, completions) {
  let expected = 0;
  let completed = 0;
  const oggi = today();
  for (let i = 0; i < 30; i++) {
    const iso = addDays(oggi, -i);
    expected += scheduledHabitsOn(habits, iso).length;
    completed += completedScheduledOn(habits, completions, iso);
  }
  return {
    tassoCompletamento: expected > 0 ? Math.round((completed / expected) * 100) : 0,
    giorniOsservati: 30,
  };
}

// Profilo -> istruzioni di tono: senza, il modello ignora la descrizione.
// Senza profilo torna stringa vuota e il prompt resta neutro.
export function toneDirectives(profile) {
  if (!profile || !profile.chiave) return '';
  const [approccio, ritmo] = profile.chiave.split('-');
  const parti = [];

  if (approccio === 'analitico') {
    parti.push('Parla per numeri, percentuali e confronti misurabili, senza enfasi vaga.');
  } else if (approccio === 'creativo') {
    parti.push('Parla per immagini concrete e proponi modi diversi di fare la stessa cosa.');
  }

  if (ritmo === 'costante') {
    parti.push('Insisti sulla continuita\' e sulla streak: poco ma tutti i giorni.');
  } else if (ritmo === 'esplosivo') {
    parti.push('Proponi micro-sfide brevi e obiettivi a sprint, senza insistere sulla regolarita\'.');
  }

  const interessi = profile.interessi || [];
  if (interessi.length > 0) {
    parti.push(
      `Puoi usare i miei interessi (${interessi.join(', ')}) per gli esempi che fai, ` +
      'mai per inventare dati che non ti ho dato.'
    );
  }

  return parti.length > 0 ? `${parti.join(' ')} ` : '';
}

// Pattern fisso: "Dati i miei dati {db} in questo momento, {question}".
// Il profilo resta fuori dai dati e passa solo come tono: se vede l'etichetta la cita.
function buildPrompt(userSnapshot, question) {
  const nome = userSnapshot.nome || 'utente';
  const { profilo, ...dati } = userSnapshot;
  const datiVisibili = { ...dati, interessi: profilo?.interessi || [] };
  return (
    `Sei un coach motivazionale per l'app HabitForge. Rispondi in italiano, in 2-4 frasi. ` +
    `Scrivi in testo semplice: niente Markdown, niente asterischi, niente grassetto o corsivo, ` +
    `niente titoli e niente elenchi puntati. ` +
    // Rispondere prima alla domanda: senza questo vincolo il modello parte sempre
    // dal suo ruolo e produce risposte intercambiabili.
    `Rispondi PRIMA alla domanda che ti faccio, in modo diretto e specifico; solo dopo, ` +
    `se serve, aggiungi la spinta motivazionale. ` +
    `Non presentarti e non dire mai chi sei o qual e' il tuo compito. ` +
    `Puoi chiamarmi "${nome}" al massimo una volta e mai come prima parola; non usare ` +
    `l'etichetta del mio profilo. ` +
    `Varia l'apertura rispetto a una risposta tipica e usa al massimo una metafora, ` +
    `solo se aggiunge qualcosa: preferisci un dato concreto preso dai miei dati. ` +
    toneDirectives(profilo) +
    `Dati i miei dati ${JSON.stringify(datiVisibili)} in questo momento, ${question}`
  );
}

export async function callGemini(userSnapshot, question) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY mancante nel .env.local');

  const prompt = buildPrompt(userSnapshot, question);
  // temperature alta e topP largo: con prompt quasi identici a ogni messaggio, i
  // valori bassi producono risposte intercambiabili.
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 1.3, topP: 0.95 },
  });

  // Un solo tentativo di retry: se l'API risponde 429 (troppe richieste, limite
  // del free tier) aspetto il ritardo suggerito da Google e riprovo una volta.
  let response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (response.status === 429) {
    const wait = await retryDelayMs(response);
    await sleep(wait);
    response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  }

  if (!response.ok) {
    throw new Error(`Gemini API ha risposto con status ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Risposta Gemini vuota');
  return stripMarkdown(text);
}

// I testi vanno in <p>, non in un renderer Markdown: senza questo si vedono gli
// asterischi. Il prompt lo chiede gia', ma un'istruzione non e' una garanzia.
function stripMarkdown(text) {
  return text
    .replace(/```[a-z]*\n?/gi, '')      // recinti di codice
    .replace(/\*\*(.+?)\*\*/gs, '$1')   // **grassetto**
    .replace(/__(.+?)__/gs, '$1')       // __grassetto__
    .replace(/\*(.+?)\*/gs, '$1')       // *corsivo*
    .replace(/`(.+?)`/gs, '$1')         // `codice`
    .replace(/^#{1,6}\s+/gm, '')        // titoli
    .replace(/^\s*[-*\u2022]\s+/gm, '')  // elenchi puntati
    .trim();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Google indica nel corpo del 429 un retryDelay del tipo "5s": lo leggo e lo uso,
// con un tetto di sicurezza a 8 secondi (default 2s se non c'e').
async function retryDelayMs(response) {
  try {
    const data = await response.clone().json();
    const detail = data.error?.details?.find((d) => d.retryDelay)?.retryDelay;
    const seconds = detail ? parseFloat(detail) : 2;
    return Math.min(Math.max(seconds, 1), 8) * 1000;
  } catch {
    return 2000;
  }
}

// Tre punti d'ingresso all'AI, uno per ciascun caso d'uso.

// Regole della sola chat: report e citazione non hanno una domanda libera.
// Nessuna cronologia inviata, quindi token costanti per messaggio: al modello va
// detto di non fingere di ricordare.
const REGOLE_CHAT =
  '\n\nIstruzioni: se ti faccio una domanda personale o di cortesia, rispondi in modo breve ' +
  'e naturale, come farebbe una persona, e poi vai avanti; se ti chiedo qualcosa che non ' +
  'riguarda abitudini, obiettivi, diario o benessere, dimmi in una frase che non e\' il tuo ' +
  'campo senza rispondere nel merito. In entrambi i casi niente discorsi motivazionali fuori ' +
  'luogo. Considera questa domanda indipendente dalle precedenti: non fare finta di ricordare ' +
  'messaggi che non vedi e, se non si capisce da sola, chiedimi di riformularla.';

export async function askCoachAdvice(userSnapshot, freeText) {
  return callGemini(userSnapshot, `${freeText}${REGOLE_CHAT}`);
}

// Citazione motivazionale personalizzata: chiedo una frase originale e non attribuita,
// cosi il modello non mette frasi inventate in bocca a persone reali. Si usa quando ci
// sono obiettivi attivi; altrimenti la citazione arriva dalla lista locale (data/quotes.js).
export async function requestPersonalQuote(userSnapshot) {
  return callGemini(
    userSnapshot,
    'scrivimi UNA frase motivazionale originale (non citare autori reali ne\' virgolettare frasi ' +
    'altrui), tarata sui miei obiettivi attivi e sui miei interessi. Rispondi SOLO in JSON valido ' +
    'nel formato: {"text": "..."}'
  );
}

// Report del giorno: un testo unico, discorsivo, che incrocia lo storico con la
// giornata in corso. Il caso "utente appena iscritto" (zero abitudini e zero
// obiettivi) e' gestito dentro il prompt, non da una stringa fissa nel codice.
export async function generateDailyReport(userSnapshot) {
  return callGemini(
    userSnapshot,
    'scrivimi il report di oggi: 3-4 frasi in seconda persona, in un testo unico e coeso, ' +
    'senza elenchi, senza titoli e senza formule a incastro. ' +
    'Se non ho nessuna abitudine e nessun obiettivo, dammi il benvenuto, invitami a creare ' +
    'la prima abitudine e dimmi esplicitamente che appena inizio ricevero\' un feedback sui ' +
    'miei progressi: in quel caso non citare numeri o dati, perche\' non esistono ancora. ' +
    'Altrimenti incrocia lo storico (tasso degli ultimi 30 giorni, streak, progresso degli ' +
    'obiettivi) con la giornata di oggi (abitudini previste, completate, mancanti) e con gli ' +
    'obiettivi vicini alla scadenza e indietro col progresso. Se sono in difficolta\' su ' +
    'qualcosa riconoscilo e dammi una spinta; se sto andando bene fammelo notare con il dato ' +
    'preciso. Cita almeno un numero concreto e almeno un elemento per nome (un\'abitudine o ' +
    'un obiettivo).'
  );
}
