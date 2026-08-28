# CHANGELOG delle modifiche

Elenco per punto della specifica: file toccati e cosa e' cambiato. Nessuna nuova
dipendenza, `firestore.rules` e lo schema dei documenti Firestore invariati.

## Punto 1 — Commenti riscritti

- `src/components/UI/Input.jsx` — il commento sul campo controllato non cita piu' il corso.
- `src/components/UI/EmptyState.jsx` — due righe accorpate in "Gestione UI stato vuoto".
- `src/components/UI/Illustration.jsx` — via i riferimenti a licenze e hosting di terzi.
- `src/services/firebase.js` — forma sintetica: config pubblica, isolamento dalle Security Rules.
- `src/components/HabitCard/HabitCard.jsx` — il commento descrive l'anello `conic-gradient` pilotato da `--streak-pct`.
- `src/styles/global.css` — il commento descrive solo lo pseudo-elemento `::after` del titolo.
- `src/components/Heatmap/HeatmapCalendar.jsx` e `.module.css` — resta il motivo tecnico (spazio del tooltip sempre riservato, hover senza reflow), non la storia del bug.
- `src/pages/DevSeed.jsx` — riscritti i due commenti che raccontavano il "prima e dopo" del seed.

## Punto 2 — Guida "come si usa"

- `src/pages/Habits.jsx` — costante `GUIDE`, stato `guideOpen`, pulsante info accanto all'`<h1>` e `Modal` "Come funzionano le abitudini".
- `src/pages/Goals.jsx` — stessa struttura con "Come funzionano gli obiettivi".
- `src/pages/Habits.module.css`, `src/pages/Goals.module.css` — classi `.titleRow`, `.infoBtn`, `.guide`.

Nessun componente nuovo: si riusa la `Modal` esistente.

## Punto 3 — Report giornaliero che tiene conto di oggi

- `src/context/DataContext.jsx` — `loading` passa a `false` al **primo snapshot di `habits`** (flag `useRef`), non subito dopo aver registrato le `onSnapshot`; torna `true` al cambio utente.
- `src/components/DailyReport/DailyReportCard.jsx` — rimossa la guardia `habits.length === 0`; la generazione aspetta `loading === false` del `DataContext`.
- `src/services/gemini.js` — `buildUserSnapshot` aggiunge il blocco `oggi` (`data`, `abitudiniPreviste`, `completate`, `mancanti`, calcolati con `scheduleUtils`), i campi `scadenza` / `giorniRimanenti` / `manuale` su ogni obiettivo e la `streak` di ogni abitudine (serve al prompt, che la cita).
- `src/services/gemini.js` — `generateDailyReport` riscritto: testo coeso di 3-4 frasi in seconda persona, caso "utente appena iscritto" gestito dentro il prompt, incrocio storico + giornata di oggi + obiettivi vicini alla scadenza, almeno un numero e un elemento per nome.
- `src/pages/Dashboard.jsx` — nuovo ordine: hero (titolo, data, chip profilo, citazione) → statistiche → abitudini di oggi → report → collegamenti rapidi.

## Punto 4 — Profilo di personalita' operativo

- `src/services/gemini.js` — nuova funzione pura `toneDirectives(profile)`: dalla chiave del profilo produce direttive esplicite di tono (analitico/creativo, costante/esplosivo) e passa gli interessi come materiale per gli esempi. Inserita in `buildPrompt`, quindi vale per report, citazione e coach. Senza profilo torna stringa vuota e il prompt resta neutro. La chiave del profilo entra nello snapshot come `profilo.chiave`.
- `src/pages/Dashboard.jsx` + `Dashboard.module.css` — chip del profilo sotto la data: nome del profilo con link a `/profile`, oppure invito al test con link a `/onboarding`.

## Punto 6 — Obiettivi manuali senza "+1"

- `src/components/GoalCard/GoalCard.jsx` — badge `manuale` → `Avanzamento manuale`; pulsante `+1` → `Aggiorna progresso`; prop `onIncrement` → `onEditProgress(goal)`. Resta un componente di presentazione.
- `src/pages/Goals.jsx` — opzione `''` del select ora `Manuale`, `.hint` aggiornato; stato `editingGoal` + `Modal` "Aggiorna progresso" con `Input type="number"` precompilato e validazione (intero, `>= 0`, `<= target`); rimossa la funzione `increment`.
- `README.md` — le tre occorrenze del pulsante `+1` riscritte in termini di aggiornamento manuale del progresso.

## Punto 7 — Sidebar collassabile a rail di icone

- `src/hooks/useSidebarPref.js` (nuovo) — preferenza in `localStorage`, chiave `hf_sidebar_collapsed`, lettura difensiva in `try/catch` e scrittura in `useEffect`, sul modello di `useReminderPref`.
- `src/components/Layout/Layout.jsx` — usa l'hook e passa `collapsed` / `onToggleCollapse` alla `Sidebar`.
- `src/components/Layout/Sidebar.jsx` — pulsante chevron con `aria-label`, `title` sulle voci quando e' collassata, `.linkLabel` sulle etichette testuali.
- `src/components/Layout/Sidebar.module.css` — `240px` → `68px` con `transition: width .2s ease`; da collassata spariscono etichette, etichette di gruppo e nome/email; su `max-width: 860px` il comportamento mobile resta quello di prima e il pulsante e' nascosto.

## Punto 8 — Denominatore = abitudini previste quel giorno

- `src/utils/scheduleUtils.js` (nuovo) — `isScheduledOn`, `scheduledHabitsOn`, `completedScheduledOn`. `isScheduledOn` tiene conto della frequenza e di `createdAt`: prima della creazione l'abitudine non era prevista.
- `src/utils/streakCalculator.js` — la `isScheduled` locale e' sostituita dall'import di `isScheduledOn`; il resto del file non cambia.
- `src/utils/heatmapUtils.js` — `buildYearGrid(year, completions, habits)` riceve l'array; ogni cella calcola `total`, `completed` e `level` sul giorno specifico.
- `src/components/Heatmap/HeatmapCalendar.jsx` — prop `habits` al posto di `totalHabits`; con `total === 0` il tooltip dice "nessuna abitudine in programma".
- `src/pages/Habits.jsx` — passa `habits={habits}`.
- `src/pages/Dashboard.jsx` — `todaysHabits` e `weeklyRate` usano `scheduledHabitsOn` / `completedScheduledOn`.
- `src/services/gemini.js` — `last30DaysCompletionRate` usa le stesse funzioni.

Invariante verificato: in nessun punto dell'app il denominatore e' il numero totale di abitudini.

## Punto 9 — Restyling

- `src/styles/variables.css` — palette riscritta sulla scala verde `#28463e → #b8dcd8`, nomi delle variabili invariati; aggiunta `--color-primary-hover: #d4e8e3`; heatmap sulla nuova scala; colori semantici invariati.
- Sostituito `#d0f0ec` con `var(--color-primary-hover)` in `DailyQuoteCard.module.css`, `Button.module.css`, `HeatmapCalendar.module.css`, `GoalCard.module.css`, `Habits.module.css`, `Coach.module.css`.
- `src/pages/Habits.jsx` — colore di default delle nuove abitudini `#0f9b8e` → `#3a7267`; `src/pages/DevSeed.jsx` — colori del seed presi dalla nuova scala.
- `src/pages/Dashboard.jsx` + `Dashboard.module.css` — hero al posto della `page-header`: titolo "Time to improve, {nome}", data lunga, chip del profilo, citazione del giorno.
- `src/components/DailyQuote/DailyQuoteCard.jsx` + `.module.css` — la citazione non e' piu' una card con intestazione: testo in corsivo piu' grande, autore in piccolo quando c'e', refresh `↻` discreto. La logica (una generazione al giorno, ramo locale/AI, salvataggio su Firestore) e' invariata.
- `src/components/Layout/Sidebar.module.css` — tre livelli di contrasto (sfondo `--color-bg`, voci non attive su `--color-surface` con bordo, voce attiva pill piena con barra-accento e icona piena) e animazione in loop sull'icona attiva, disattivata sotto `prefers-reduced-motion`.

## Punto 10 — Ricerca degli obiettivi

- `src/pages/Goals.jsx` — campo di ricerca sopra i filtri, confronto case-insensitive con `trim`, combinato in `AND` col filtro di stato dentro il `useMemo`; `EmptyState` con testo dedicato quando la ricerca non produce risultati.
- `src/pages/Goals.module.css` — classi `.searchRow`, `.search`.

## Punto 20 — Bagliore verde agganciato alla rotta

- `src/styles/global.css` — rimosso l'effetto `aurora` da `body::before` e le sue `@keyframes`.
- `src/components/Layout/Layout.jsx` — `useLocation()` decide se la rotta e' del gruppo Attivita' (`/`, `/habits`, `/goals`, `/diary`) e in quel caso rende un `<div aria-hidden="true">` dedicato. Le pagine non sono state toccate.
- `src/components/Layout/Layout.module.css` — `.main` con `isolation: isolate`, `.glow` con `overflow: hidden` (cosi la pulsazione non puo' generare scrollbar), `pointer-events: none` e `z-index: -1`; la macchia e' lo pseudo-elemento `::before`, radiale sfocata in `rgba(58, 114, 103, .30)` che pulsa in 7,5s `ease-in-out infinite alternate`; animazione disattivata sotto `prefers-reduced-motion`.

## Verifica

- `npm run build` completa senza errori. L'unico avviso (`chunks are larger than 500 kB`) era gia' presente prima delle modifiche.
- `package.json` invariato.
- `firestore.rules` e la struttura dei documenti Firestore invariati.

---

# Correzioni dopo la prova in locale

Cinque problemi emersi provando l'app con `npm run dev`.

## Notifica di prova che non parte in sviluppo

`src/services/notifications.js` — `showNotification` usava `await navigator.serviceWorker.ready`.
Se nessun service worker e' registrato quella promise non si risolve **mai** (non fallisce:
resta appesa), quindi la funzione si bloccava prima del fallback `new Notification(...)`,
senza errore in console. In `npm run dev` il SW non viene generato, perche' `vite-plugin-pwa`
non ha `devOptions` attivo: da qui il sintomo "non posso inviare la notifica di prova".
Sostituito con `getRegistration()`, che torna subito `undefined` quando il SW non c'e'.
In produzione il comportamento non cambia: il SW esiste e la notifica passa da li'.

## Giorni della settimana selezionati al contrario

`src/pages/Habits.jsx` — il form partiva con `days: [0,1,2,3,4,5,6]` e quel preset restava
anche premendo "Giorni scelti". Cliccare "Ven" quindi **toglieva** il venerdi' invece di
sceglierlo, e l'abitudine veniva salvata su tutti gli altri giorni. Da qui i tre sintomi
osservati: abitudine spuntabile di giovedi', denominatore 2 invece di 1, comportamento
corretto solo sulle abitudini giornaliere. Ora il passaggio a "Giorni scelti" azzera la
selezione (`days: []`); la validazione che richiede almeno un giorno era gia' presente.

Nota: le abitudini gia' salvate con i giorni sbagliati vanno corrette o ricreate, il dato
sbagliato e' su Firestore.

## Giorni non visibili nell'elenco

`src/pages/Habits.jsx` — la riga dell'abitudine mostrava "3 giorni/sett.". Ora elenca i
giorni effettivi ("Lun, Mer, Ven"), cosi' l'impostazione e' verificabile a colpo d'occhio.
Nella stessa riga il controllo "e' prevista oggi?" usa `isScheduledOn` di `scheduleUtils`
invece di una condizione locale duplicata.

## Il coach citava l'etichetta del profilo

`src/services/gemini.js` — il prompt vieta di chiamare l'utente con l'etichetta del profilo,
ma l'etichetta veniva passata dentro il JSON dei dati, e infatti il coach rispondeva cose
come "per un Creativo-Costante come te". Ora `buildPrompt` estrae `profilo` dallo snapshot:
la personalita' entra solo come istruzioni di tono (`toneDirectives`), mentre nei dati
serializzati restano i soli interessi.

## Il coach rispondeva da coach anche fuori tema

`src/services/gemini.js` — aggiunta la costante `REGOLE_CHAT`, accodata alla domanda solo in
`askCoachAdvice` (report e citazione non hanno una domanda libera, quindi non la usano):
se la domanda non riguarda abitudini, obiettivi, diario o benessere, il coach lo dice in una
frase e riporta il discorso li'.

Le chiamate restano **indipendenti**: la cronologia della chat non viene inviata, per non far
crescere i token a ogni messaggio. Per questo la stessa costante dice al modello di non
comportarsi come se ricordasse i messaggi precedenti e di chiedere una riformulazione quando
la domanda non si capisce da sola.

## Colori del manifest

`vite.config.js` — `theme_color` e `background_color` erano rimasti sulla palette turchese
precedente: allineati a `#3a7267` e `#f5f8f7`.

---

# Secondo giro di revisione

Applicazione della skill `habitforge-revisione-2`. Ordine di lavoro: prima i punti che
toccano le fondamenta (React 19 e correzioni tecniche), poi le funzionalita'.

## React 19 (slide SAW26_08)

- `package.json` — `react` e `react-dom` da `^18.3.1` a `^19.2.0`. Non e' una dipendenza
  nuova: e' l'aggiornamento di due gia' presenti. `react-router-dom` 6.30 risolve su
  React 19 senza conflitti di peer dependency.
- `src/context/DataContext.jsx`, `src/context/AuthContext.jsx` — il provider e' il context
  stesso: `<DataContext value={...}>` al posto di `<DataContext.Provider value={...}>`,
  come nella slide 27.
- `src/hooks/useAuth.js`, `useHabits.js`, `useGoals.js`, `useDiary.js` e il
  `DataProvider` — `use(X)` al posto di `useContext(X)`. `use` non e' un hook: puo' stare
  dentro condizioni e cicli, ed e' il motivo per cui l'API esiste.
- `src/components/UI/ErrorBoundary.jsx` (nuovo) + `.module.css` — componente a classe
  (`getDerivedStateFromError` e `componentDidCatch` non hanno equivalenti negli hook).
  Avvolge anche i provider in `main.jsx`, non solo le pagine: un errore dentro un provider
  deve essere intercettato lo stesso. Le slide suggeriscono `react-error-boundary`: non
  installato, per non aggiungere una dipendenza a fronte di quindici righe.
- `src/components/HabitCard/HabitCard.jsx` — `useOptimistic` con `startTransition` sulla
  sola spunta dell'abitudine. Firestore fa gia' latency compensation: l'hook serve a
  mostrare il rollback quando la scrittura viene rifiutata, non a velocizzare il caso
  normale. Applicarlo ovunque sarebbe stato cargo cult.

## Correzioni tecniche

- **Persistenza offline** (`src/services/firebase.js`) — `initializeFirestore` con
  `persistentLocalCache` e `persistentMultipleTabManager`. La slide SAW26_15 pag. 16 dice
  che va abilitata e che di default e' disattiva; il README prometteva un comportamento
  offline che senza IndexedDB non esisteva. Delle due forme mostrate nella slide si usa
  quella moderna: `enableIndexedDbPersistence` e' deprecata nell'SDK v11.
- **Scritture atomiche** (`src/services/firestore.js`, `DataContext`) — `toggleCompletion`
  usa `arrayUnion`/`arrayRemove` invece di riscrivere l'array intero. Prima due spunte
  ravvicinate partivano dallo stesso array e la prima si perdeva.
- **Cancellazione in batch** — `deleteHabit` tocca solo i giorni in cui l'abitudine compare
  davvero e scrive con `writeBatch` a blocchi di 500: atomico, e non piu' centinaia di
  round trip in serie.
- **Stato dell'obiettivo** — `addGoal` non salva piu' `status`, che nessuno aggiornava e
  che restava `'active'` per sempre; `DailyQuoteCard` filtra con `goalStatus(g, completions)`.
  Prima un obiettivo completato o scaduto faceva partire una chiamata a Gemini che spettava
  alla lista locale. Gli obiettivi gia' salvati si portano dietro un `status` orfano: e'
  inerte, nessuno lo legge.
- **`loading` coerente** (`DataContext`) — si chiude quando sono arrivati i primi snapshot
  di tutte e quattro le collezioni, non solo delle abitudini. Le sottoscrizioni partono
  insieme, quindi si aspetta la piu' lenta e non la somma.
- **`completions` memoizzato** — era ricostruito a ogni render e invalidava ogni
  `useCallback` e `useMemo` che dipendeva da lui: la memoizzazione delle statistiche non
  memoizzava niente.
- **`prevScheduled`** (`streakCalculator`) — esce dal ciclo appena supera `createdAt`.
  Per un'abitudine appena creata faceva 800 giri per restituire `null`, per ogni abitudine
  e a ogni render.
- **Test di personalita'** — i commenti dicevano 9 template e 135 domande: sono 10 e 150.
  Allineati alla realta'; il taglio a 9 domande resta, ed e' voluto.
- **`firestore.rules`** — validazione di contenuto su `habits` (nome non vuoto, max 80
  caratteri, `frequency` fra 'daily' e 'custom') e `completions` (`habits` e' una lista).
  Via la wildcard `{document=**}`: le regole si combinano in OR, quindi accanto a una
  regola severa una permissiva vince sempre. Si usa `hasAll()` e non `hasOnly()`, che si
  romperebbe al primo campo nuovo.

## Obiettivi coerenti con le abitudini

- `src/pages/Habits.jsx` — campo facoltativo "Quanto vale un completamento" salvato in
  `measure: { value, unit }`.
- `src/pages/Goals.jsx` — con un'abitudine collegata l'unita' diventa di sola lettura ed e'
  quella dell'abitudine (o `completamenti`), il target si chiama "Quante volte" e sotto
  compare l'equivalenza dal vivo (`30 volte × 10 minuti = 300 minuti`). Il multiplo non e'
  validato: e' reso impossibile da violare dal form. Si salva `unitPerCompletion` come
  fotografia della misura al momento della creazione.
- `src/components/UI/Input.jsx` — accetta `min`, `step`, `readOnly` e `disabled`, che prima
  venivano passati e silenziosamente ignorati.
- `src/components/GoalCard/GoalCard.jsx` — seconda lettura in unita' fisiche sotto la barra.

## Modifica e pausa delle abitudini

- `src/utils/scheduleUtils.js` — `isPaused` e `isActive`. Un giorno dentro una pausa non e'
  previsto, quindi non pesa su nessun denominatore: heatmap, streak e percentuali si
  adeguano da sole.
- `src/context/DataContext.jsx` — `setHabitActive` chiude la pausa aperta invece di
  cancellarla. E' la storia (`pauses: [{from, to}]`) che impedisce ai dati passati di
  cambiare quando l'abitudine viene ripresa.
- `src/pages/Habits.jsx` — la stessa modale serve creazione e modifica; nella riga ci sono
  modifica, pausa/ripresa ed elimina; le abitudini in pausa restano visibili ma smorzate,
  con badge, non spuntabili e in fondo alla lista; filtro Attive / In pausa / Tutte, che
  compare solo se esiste almeno una pausa.

## Report del giorno

- `src/components/DailyReport/DailyReportCard.jsx` — pulsante di rigenerazione, riga
  "Aggiornato alle HH:MM", e invalidazione automatica quando cambia il numero di abitudini
  previste oggi. Il report resta una fotografia: adesso lo dichiara.
- `src/services/firestore.js` — `setDailyReport` salva anche ora e `scheduledCount`.
- `src/services/gemini.js` — il campo `abitudiniAttive` conteneva tutte le abitudini,
  comprese quelle non previste oggi: ora e' `abitudini`, esclude quelle in pausa e ogni
  voce porta `previstaOggi`. Aggiunto `abitudiniInPausa`.

## Statistiche della Dashboard

- `src/utils/statsUtils.js` (nuovo) — `completionRate` su finestra arbitraria,
  `weeklyRateWithDelta`, `bestActiveStreak`, `nearestDeadline`.
- `src/pages/Dashboard.jsx` — quattro schede riviste:
  1. *Oggi* diventa la principale, con anello di progresso in `conic-gradient`.
  2. *Ultimi 7 giorni (fino a ieri)*: oggi e' escluso dalla finestra, perche' al mattino le
     abitudini non ancora fatte contavano come mancate e facevano scendere la percentuale
     per un motivo che non riguardava la settimana. Aggiunto il delta sui 7 giorni
     precedenti: un numero senza riferimento non e' informazione.
  3. *Streak attiva* col nome dell'abitudine, e il record storico relegato a nota. Il
     record cambiava due volte l'anno e poteva appartenere a un'abitudine abbandonata: non
     suggeriva niente da fare oggi.
  4. *Prossima scadenza* al posto di "Abitudini attive", che era il conteggio delle righe
     di una lista scritta dall'utente. Vira all'ambra quando il progresso e' rimasto
     indietro rispetto al tempo trascorso.
- Pulsante info sulla riga delle schede, con la spiegazione di ogni calcolo e della regola
  del denominatore.

## Testi e restyling

- `src/pages/Goals.jsx` — guida riscritta a blocchi con titolo: i due modi di avanzare sono
  separati, non voci di un elenco. Via "non lo imposti tu".
- `src/components/GoalCard/GoalCard.jsx` — il modo di avanzare e' sempre dichiarato sulla
  card (`⟳ Avanza da solo · nome abitudine` oppure `✎ Lo aggiorni tu`). Se serve aprire una
  guida per capire l'interfaccia, il problema e' dell'interfaccia.
- `src/styles/variables.css` — guscio scuro (`--color-shell: #1e3a34` e derivati), sfondo
  di pagina tinto `#f2f7f5`. `--color-text-secondary` da `#5c7a73` a `#527069`: sul nuovo
  sfondo il vecchio dava 4.32:1, sotto la soglia AA di 4.5:1.
- `Navbar.module.css`, `Sidebar.module.css` — navbar e sidebar sul guscio scuro; i tre
  livelli di contrasto della sidebar ribaltati (sfondo, voce sollevata, pill chiara piena
  sulla voce attiva). Riportato in tinta il bottone "Esci", che era grigio su verde.
- `Layout.module.css` — bagliore a due macchie sfalsate con durate diverse (7,5s e 11s),
  alpha da 0.30 a 0.45: prima era quasi invisibile su fondo bianco.
- `vite.config.js` — `theme_color` e `background_color` allineati al guscio.

## Verifica

- `npm run build` senza errori. L'unico avviso (chunk oltre 500 kB) era gia' presente.
- Regola delle pause provata su casi costruiti: un'abitudine in pausa sparisce dai giorni
  di pausa, resta nei giorni precedenti, e il giorno di ripresa torna subito a contare.
- Percentuale settimanale provata su dati costruiti: 70% (7 completate su 10 previste dal
  13 al 19 agosto), ignorando il completamento di oggi.

## Correzioni dopo la prova in locale (secondo giro)

- **Asterischi nei testi generati** (`src/services/gemini.js`) — il modello rispondeva in
  Markdown (`**cosi'**`) mentre i testi finiscono in `<p>` semplici, quindi gli asterischi
  si vedevano. Due difese: il prompt ora chiede esplicitamente testo semplice senza
  Markdown, e `stripMarkdown` ripulisce comunque la risposta prima di restituirla. Vale per
  tutti e tre i punti di chiamata, perche' agisce dentro `callGemini`. Un'istruzione al
  modello non e' una garanzia: per questo c'e' anche la ripulitura.
- **Filtri delle abitudini sempre visibili** (`src/pages/Habits.jsx`) — comparivano solo in
  presenza di almeno un'abitudine in pausa. Riprendendo l'ultima abitudine dalla vista
  "In pausa", i filtri sparivano mentre il filtro attivo restava `paused`: la pagina
  restava su un elenco vuoto senza alcun modo di tornare indietro. Ora i tre filtri ci sono
  sempre e il numero di abitudini in pausa e' un contatore accanto alla voce.
- **Stati vuoti piu' utili** — "Niente in questa categoria" non diceva cosa fare. Ora il
  testo cambia in base al filtro e indica l'uscita.

## Pulizia dei commenti ed estrazione del form

- **Commenti**: da 445 a 316 righe. Accorciati tutti i blocchi lunghi di motivazione
  tecnica (restano una o due righe, con il solo perche'); rimossi i riferimenti espliciti
  alle slide del corso; sfoltite le note sui bug corretti, tenendo solo quelle che
  impedirebbero di reintrodurre lo stesso errore; tolti i toni valutativi dai commenti di
  dominio. Le intestazioni di file e le note brevi restano.
- **`src/components/HabitForm/HabitForm.jsx`** (nuovo) + `.module.css` — il form
  dell'abitudine esce da `Habits.jsx`, che passa da 391 a 226 righe. Il form tiene stato e
  validazione ed espone `onSave(payload)`; la pagina decide se creare o aggiornare. Le
  classi del form si spostano nel suo module CSS. Il totale delle righe non cala (405 fra i
  due file contro 391): l'estrazione serve alla leggibilita', non alla brevita'.
