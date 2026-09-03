# HabitForge

App di crescita personale. Si creano abitudini ricorrenti e si spuntano ogni giorno, con
streak e calendario heatmap; si definiscono obiettivi misurabili, collegabili a un'abitudine
o aggiornati a mano; si tiene un diario. Un test di personalità profila l'utente e un coach
AI dà consigli sui dati reali dell'account. Ogni giorno l'app genera un report della giornata
e una citazione.

Progetto d'esame per il corso di Sviluppo di Applicazioni Web, Università di Pisa.

## Applicazione online

**https://habitforge-saw26.web.app**

Account di prova, con circa sei mesi di dati già inseriti:

- **Email:** `filippo.pacini@habitforge.app`
- **Password:** `pacini30`

In alternativa ci si può registrare o entrare con Google.

## Avvio in locale

Serve Node.js 18 o superiore.

```
npm install
npm run dev
```

Il file `.env.local` con le chiavi Firebase e Gemini è allegato alla consegna: va copiato
nella cartella del progetto prima di avviare. L'app parte su `http://localhost:5173`.

## Tecnologie

React con Vite e react-router-dom, stili con CSS Modules. Firebase per autenticazione,
database (Firestore) e hosting. Coach, report e citazione usano l'API di Google Gemini.
L'app è una PWA costruita con `vite-plugin-pwa`.

## Come è organizzato il codice

```
src/pages/        una pagina per ogni rotta
src/components/   componenti riusabili, ognuno con il suo CSS Module
src/context/      stato condiviso: utente (AuthContext) e dati (DataContext)
src/hooks/        accesso ai context e alle preferenze locali
src/services/     dialogo con l'esterno: Firebase, Firestore, Gemini, notifiche
src/utils/        calcoli puri: date, streak, heatmap, statistiche, obiettivi, profilo
src/data/         domande del test di personalità e citazioni
```

Una mappa più dettagliata, cartella per cartella, è in `presentazioneStructure.html`, da
aprire nel browser.

## Modello dati

Ogni utente ha un documento sotto `users/{uid}`: i dati singoli come campi del documento,
quelli che crescono nel tempo come sottocollezioni.

```
users/{uid}
  ├── email, displayName, createdAt
  ├── profile      { key, name, tagline, description, interests[] }
  ├── dailyReport  { text, date, updatedAt, scheduledCount }
  └── dailyQuote   { text, author|null, date, source: 'local'|'ai' }
users/{uid}/habits/{habitId}          { name, emoji, frequency, days[], color, active,
                                        pauses[{from,to}], measure{value,unit}|null, createdAt }
users/{uid}/completions/{YYYY-MM-DD}  { habits: string[] }
users/{uid}/goals/{goalId}            { title, description, target{value,unit}, deadline,
                                        linkedHabitId, unitPerCompletion|null, progress }
users/{uid}/diary/{entryId}           { text, date }
```

## Scelte di progetto

I completamenti sono indicizzati per data e aggiornati con `arrayUnion` e `arrayRemove`, così
due schede aperte insieme non si sovrascrivono. Streak, progresso e stato degli obiettivi non
vengono salvati ma calcolati dai completamenti, per non tenere valori che possano andare fuori
sincrono. Il denominatore delle percentuali è il numero di abitudini previste in quel giorno,
quindi saltare un giorno non programmato non interrompe la streak.

Lo stato dell'app arriva in tempo reale da Firestore tramite `onSnapshot`; le operazioni di
scrittura si limitano a scrivere. Le preferenze del singolo dispositivo stanno in
`localStorage`, i dati dell'utente su Firestore.

Le Security Rules danno a ciascun utente accesso solo ai propri dati, dichiarando ogni
collezione singolarmente. Al coach viene passato il profilo di personalità come indicazione
di tono, mai il contenuto del diario.
