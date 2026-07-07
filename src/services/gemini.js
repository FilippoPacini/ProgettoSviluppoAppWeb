// Chiamata REST all'API Google Gemini per il coach AI (POST, body e risposta JSON,
// check response.ok). La chiave sta nel client: la si protegge restringendola per HTTP
// referrer dalla Google Cloud Console (vedi README), non nascondendola.

import { goalProgress, goalStatus } from '../utils/goalUtils';
import { today, addDays, isoWeekday } from '../utils/dateUtils';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Estrae un sottoinsieme compatto dello stato utente da mandare al modello.
// Mandare tutto Firestore farebbe esplodere i token: questo e' il minimo utile.
export function buildUserSnapshot({ displayName, profile, habits, completions, goals, diary }) {
  const last30 = last30DaysCompletionRate(habits, completions);
  return {
    nome: displayName || null,
    profilo: profile
      ? { etichetta: profile.name, descrizione: profile.description, interessi: profile.interests || [] }
      : null,
    abitudiniAttive: habits.map((h) => ({
      nome: h.name,
      frequenza: h.frequency,
      giorni: h.days || null,
    })),
    ultimi30Giorni: last30,
    obiettivi: goals.map((g) => ({
      titolo: g.title,
      target: g.target ? `${g.target.value} ${g.target.unit}` : null,
      progresso: goalProgress(g, completions),
      stato: goalStatus(g, completions),
    })),
    ultimeVociDiario: diary.slice(0, 3).map((e) => ({
      data: e.date,
      estratto: (e.text || '').slice(0, 120),
    })),
  };
}

// Riassunto degli ultimi 30 giorni: completate su attese.
function last30DaysCompletionRate(habits, completions) {
  let expected = 0;
  let completed = 0;
  const oggi = today();
  for (let i = 0; i < 30; i++) {
    const iso = addDays(oggi, -i);
    const wd = isoWeekday(iso);
    const scheduled = habits.filter((h) => h.frequency === 'daily' || (h.days || []).includes(wd));
    expected += scheduled.length;
    completed += (completions[iso] || []).length;
  }
  return {
    tassoCompletamento: expected > 0 ? Math.round((completed / expected) * 100) : 0,
    giorniOsservati: 30,
  };
}

// Il pattern del prompt e' fisso: "Dati i miei dati {db} in questo momento, {question}".
function buildPrompt(userSnapshot, question) {
  const nome = userSnapshot.nome || 'utente';
  return (
    `Sei un coach motivazionale per l'app HabitForge. Rispondi in italiano, in 2-4 frasi. ` +
    `Rivolgiti sempre all'utente col suo nome proprio ("${nome}"), mai con l'etichetta del profilo. ` +
    `Usa profilo.descrizione solo per calibrare il tono, senza mai nominarla. ` +
    `Dati i miei dati ${JSON.stringify(userSnapshot)} in questo momento, ${question}`
  );
}

export async function callGemini(userSnapshot, question) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY mancante nel .env.local');

  const prompt = buildPrompt(userSnapshot, question);
  const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });

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
  return text.trim();
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
export async function askCoachAdvice(userSnapshot, freeText) {
  return callGemini(userSnapshot, freeText);
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

export async function generateDailyReport(userSnapshot) {
  return callGemini(
    userSnapshot,
    'scrivimi un breve report motivazionale per la giornata di oggi (2-3 frasi). ' +
    'Cita 1 dato concreto dalle mie abitudini.'
  );
}
