# HabitForge

App di crescita personale: tracciamento di **abitudini** con streak e calendario
heatmap, **obiettivi** misurabili, **diario**, **test di personalità** e un **coach AI**
che dà consigli su misura.

Progetto d'esame per il corso **Sviluppo Applicazioni Web (SAW)** — Laurea triennale
in Informatica, Università di Pisa.

## Applicazione online e credenziali di prova

L'app è pubblicata su Firebase Hosting:

- **https://habitforge-saw26.web.app**

È disponibile un **account demo pre-popolato** con circa 6 mesi di dati (dal 1° gennaio
2026), così heatmap, streak, obiettivi, diario, profilo e coach si vedono subito in
condizioni realistiche. Credenziali:

- **Email:** `filippo.pacini@habitforge.app`
- **Password:** `pacini30`

In alternativa si può creare un account nuovo dalla schermata di registrazione.

## Avviare l'app in locale

Serve **Node.js 18+** e npm.

1. Clona il repo, installa .env.local.
2. Installa le dipendenze:
   ```bash
   npm install
   ```

3. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```
   L'app si apre su http://localhost:5173.

## Come usare l'app

Al primo accesso, dopo la registrazione, l'app propone un **test di personalità** che
genera un profilo (es. *Analitico-Costante*) e raccoglie i tuoi interessi: servono a
personalizzare il tono del coach e la citazione del giorno. Dalla **Dashboard** spunti le
abitudini di oggi; le sezioni **Abitudini**, **Obiettivi**, **Diario**, **Coach** e
**Profilo** sono raggiungibili dalla barra laterale.

Di seguito tre percorsi di esempio per vedere le funzionalità.

### Caso d'uso 1 — Collega un'abitudine a un obiettivo e guarda il progresso avanzare da solo

1. Vai su **Abitudini → + Nuova abitudine** e crea *Leggere 20 minuti* (frequenza
   giornaliera).
2. Vai su **Obiettivi → + Nuovo obiettivo** e compila:
   - **Titolo:** `Costanza nella lettura`
   - **Target:** `30` — **Unità:** `sessioni`
   - **Scadenza:** una data fra circa un mese
   - **Collega a:** `📚 Leggere 20 minuti`
3. Torna in **Dashboard** e spunta *Leggere 20 minuti* per oggi.
4. Riapri **Obiettivi**: la barra di avanzamento dell'obiettivo si è mossa da sola. Il
   progresso di un obiettivo collegato conta i completamenti di quell'abitudine tra la
   creazione e la scadenza — non devi aggiornarlo a mano. (Gli obiettivi *manuali*, non
   collegati, si avanzano invece con il pulsante **+1**.)

### Caso d'uso 2 — Imposta 3 obiettivi e "senti" cosa dice il coach

1. In **Obiettivi** creane tre, per esempio:
   - `Leggere 10 libri` → Target `10` / `libri`, **Manuale** (avanzi tu con +1 a libro finito)
   - `30 giorni di camminata` → collegato all'abitudine *Camminata 30 minuti*
   - `Meditare 20 volte questo mese` → collegato all'abitudine *Meditazione*
2. Vai su **Coach** e tocca il suggerimento rapido **"I miei obiettivi sono realistici?"**
   (oppure scrivi una domanda libera).
3. Il coach incrocia i tuoi obiettivi con i completamenti reali degli ultimi 30 giorni e
   risponde su misura, chiamandoti per nome. Prova anche **"Come sto andando questa
   settimana?"** o **"Quali abitudini sto trascurando?"**.

### Caso d'uso 3 — Esegui il test di personalità e nota come cambia il coach

1. Da **Profilo → Fai il test** (o al primo accesso) completa il questionario: scegli i
   settori d'interesse e rispondi alle domande.
2. Viene generato un **profilo** (es. *Analitico-Costante*) con i tuoi interessi, visibile
   in Profilo.
3. Apri **Coach**: l'intestazione ora recita *"Consigli su misura per il tuo profilo
   Analitico-Costante"* e le risposte adattano il tono al profilo.
4. In più, la **citazione del giorno** in Dashboard viene personalizzata sui tuoi obiettivi
   attivi e interessi (quando non hai obiettivi attivi arriva invece da una lista locale di
   autori di pubblico dominio).

## PWA: installazione, offline, notifiche.

L'app è una Progressive Web App. Il service worker e il manifest vengono generati in fase
di build; la PWA è attiva sulla versione compilata (produzione o `npm run preview`), non
con `npm run dev`.

**Installazione.** Apri il sito in Chrome desktop: a destra nella barra degli indirizzi
compare l'icona *Installa*. Cliccala e l'app si apre in una finestra standalone con la sua
icona. Su Android, dal menu del browser scegli *Aggiungi a schermata Home*.

**Uso offline.** Con l'app aperta (o installata), da DevTools → *Network* attiva *Offline*
e ricarica: la pagina continua a caricarsi dalla cache del service worker e la navigazione
tra le sezioni funziona. Le modifiche ai dati fatte offline vengono messe in coda dall'SDK
Firestore e sincronizzate quando la rete torna disponibile.

**Notifiche.** Vai su **Profilo → Promemoria giornaliero**, attiva l'interruttore (il
browser chiede il permesso in quel momento) e scegli un orario; con **Invia una notifica di
prova** verifichi subito che funzionino. Il promemoria è una notifica locale: scatta
all'orario impostato mentre l'app è aperta o installata e si ripianifica per il giorno dopo.

## Deploy

Il progetto si ricostruisce e si pubblica con la CLI di Firebase (`firebase-tools`,
installabile globalmente con `npm install -g firebase-tools`):

```bash
npm run build      # genera la cartella dist/
firebase login     # solo la prima volta
firebase deploy    # pubblica hosting + Security Rules Firestore
```

Dopo il deploy l'app è raggiungibile su `https://habitforge-saw26.web.app` e
`https://habitforge-saw26.firebaseapp.com`.

## Sicurezza

**Security Rules.** `firestore.rules` isola ogni utente al proprio sotto-albero
`users/{uid}` con la condizione `request.auth.uid == uid`: nessuno può leggere o scrivere
i dati di un altro utente. Una sola regola con wildcard copre il documento e tutte le
sottocollezioni.

**Chiave Gemini.** La `VITE_GEMINI_API_KEY` finisce nel bundle client (come la config
Firebase): la si mette in sicurezza restringendo l'origine, non nascondendola. Dalla Google
Cloud Console:

1. **APIs & Services → Credentials** → seleziona la chiave.
2. **Application restrictions → HTTP referrers**, aggiungi:
   - `https://habitforge-saw26.web.app/*`
   - `https://habitforge-saw26.firebaseapp.com/*`
   - `http://localhost:5173/*` (solo per lo sviluppo)
3. **API restrictions** → limita a **Generative Language API**.

Il modello usato è `gemini-2.5-flash` (endpoint in `src/services/gemini.js`).

## Modello dati (Firestore)

Tutto vive sotto il documento dell'utente `users/{uid}`: i campi "singoli" come attributi
del documento, i dati che crescono nel tempo come sottocollezioni. Non esistono collezioni
a livello root oltre `users`. Le letture sono realtime (`onSnapshot`).

```
users/{uid}
  ├── email, displayName, createdAt
  ├── profile      { key, name, tagline, description, interests[] }   // test di personalità
  ├── dailyReport  { text, date }                                     // report del giorno (AI)
  └── dailyQuote   { text, author|null, date, source: 'local'|'ai' }  // citazione del giorno
users/{uid}/habits/{habitId}          { name, emoji, frequency, days[], color, createdAt }
users/{uid}/completions/{YYYY-MM-DD}  { habits: string[] }            // doc-id = data
users/{uid}/goals/{goalId}            { title, description, target{value,unit}, deadline,
                                        linkedHabitId, progress, status, createdAt }
users/{uid}/diary/{entryId}           { text, date }
```

Note:
- **Streak** e **progresso/stato degli obiettivi** non sono salvati: sono derivati dai
  completamenti (`src/utils/streakCalculator.js`, `src/utils/goalUtils.js`), così non
  possono andare fuori sincrono.
- Un obiettivo con `linkedHabitId` avanza contando i completamenti dell'abitudine collegata;
  uno *manuale* usa il campo `progress` (pulsante +1).

## Struttura del progetto

```
src/
├── components/   Componenti UI e di feature (Heatmap, GoalCard, DailyReport, DailyQuote,
│                 Reminder, Layout, UI generici…)
├── pages/        Una pagina per route (Dashboard, Habits, Goals, Diary, Coach, Profile,
│                 PersonalityTest, Login, Register)
├── hooks/        Custom hooks (useAuth, useHabits, useGoals, useDiary, useCoach, useReminderPref)
├── context/      Provider (AuthContext, DataContext, ThemeContext)
├── services/     Backend: firebase, auth, firestore, gemini, notifications
├── data/         Dati statici (domande del test, citazioni locali)
├── utils/        Funzioni pure (streak, heatmap, profilo, obiettivi, date)
└── styles/       Stili globali e variabili del tema

firestore.rules   Security Rules
firebase.json     Config Hosting + Firestore
.firebaserc       Progetto di default (habitforge-saw26)
.env.example      Template delle variabili d'ambiente
```
