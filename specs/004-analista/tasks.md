# Task: L'analista

**Input**: `specs/004-analista/` — `spec.md`, `plan.md`, `contracts/`.

**Test**: richiesti dalla spec (P2). Il cancello è una funzione pura con test su fixture; il
ruolo è prosa e si verifica leggendolo e con i controlli elencati task per task.

**Organizzazione**: un task = una issue = una PR, lavorata dall'agente sviluppatore e
revisionata dal PM. Ordine sequenziale.

**Stato** (3/9/2026): T001–T004 realizzati direttamente sul branch
`claude/github-spec-agent-u44d3h` da una sessione Claude Code, **non** dal loop dev-agent →
PM (il loop era fermo per l'installazione della spec 003), e revisionati prima della fusione
su `main`: 188 test verdi, cancello verde su questa spec. È un'eccezione dichiarata, non il
modo normale. Resta T005, a cura di Alessio.

## Formato: `[ID] [Scenario] Descrizione`

- **[US1..US5]**: scenario d'uso della spec (1 idea → coda, 2 si ferma sui buchi,
  3 il cancello, 4 riprendere, 5 tracce)

## Fase 1: il cancello

- [x] T001 [US3] Il cancello `template/scripts/analista-cancello.js`, con i suoi test e le
      fixture accanto, in `template/scripts/`. Funzione pura `verifica({documenti,
      configurazione, fileEsistenti})` più `estraiRequisiti`, `estraiTask`,
      `requisitiCitati`, `percorsiCitati`, `puntiAperti`, `haSezione`,
      `leggiConfigurazione`, `combacia`, `riferisci`; riga di comando che stampa i problemi
      ed esce 0, 1 o 2 come dal contratto. Nessuna dipendenza. Copre REQ-320, 321, 322, 324.
      Verifica: un test verde su una fixture sana e un test negativo per ciascuno dei
      quindici problemi del contratto; `node scripts/analista-cancello.js` su una cartella
      difettosa stampa i problemi ed esce 1, su una sana esce 0, senza argomenti esce 2.

## Fase 2: il ruolo

- [x] T002 [US1][US2][US5] Il ruolo `plugin/skills/analista/SKILL.md`, prima parte: i
      controlli preliminari sul repo, l'ordine di lettura, i giri di domande chiuse con
      opzioni e conseguenze e il loro tetto, la trascrizione delle coppie D/R in
      «Chiarimenti», le due mosse quando Alessio non sa (rinviare o restringere), il confine
      fra ciò che decide l'analista e ciò che chiede, gli ADR con `decision-makers:
      [analista]`, e l'ordine di invocazione dei comandi di Spec Kit con le convenzioni che
      quei comandi non impongono. Copre REQ-301, 302, 303, 304, 305, 306, 307, 310, 311,
      312, 313, 314, 315, 316.
      Verifica: il file nomina ciascuno dei sei comandi di Spec Kit e non contiene un
      template di spec, piano o task proprio; dice esplicitamente che non si scrive alcun
      file prima del primo giro di domande.

- [x] T003 [US1][US3] Il ruolo, seconda parte: l'esecuzione del cancello e il divieto di
      aggirarlo, il riepilogo e l'attesa della conferma, la consegna con le issue `in-coda`
      dai task, il rifiuto se la spec non è su `main`, l'idempotenza, il messaggio finale
      con il comando che resta ad Alessio, la ripresa di un'analisi lasciata a metà, e la
      sezione «Cosa non fai, mai». Copre REQ-323, 330, 331, 332, 333, 334, 350, 351, 352,
      353.
      Verifica: il file non contiene `gh workflow enable`, `gh workflow run`, `gh pr merge`
      né `ready-for-dev` se non nella sezione dei divieti; sta in meno di 250 righe.

## Fase 3: installazione e configurazione

- [x] T004 [US1] Installazione: `init.sh` copia il cancello e il ruolo nel repo di
      destinazione con la funzione `copia` esistente e aggiunge ai passi manuali che
      l'analista non ha nulla da accendere; `template/.fucina.yml` riceve la chiave
      `analista` con modello, tetti, numero massimo di domande per giro e strumenti
      permessi, commentata riga per riga; `template/CLAUDE.md` e `README.md` ricevono una
      sezione breve sull'analista e sul cancello. Copre REQ-340, 341, 342.
      Verifica: `bash -n init.sh` esce 0; `yq '.analista.max_domande_per_giro'` su
      `template/.fucina.yml` stampa 5; una seconda esecuzione di `init.sh` non sovrascrive
      nulla.

## Fase 4: collaudo (a cura di Alessio — non è una issue per l'agente)

- [ ] T005 Provare l'analista su un'idea vera, dall'inizio alla coda: verificare che si
      fermi a chiedere, che il cancello blocchi almeno una volta, e che nessuna issue esista
      prima della conferma. Riportare gli esiti in una tabella di stato di verifica in
      `spec.md`.

## Fase 5: il cancello e i task già fatti

- [ ] T006 [US3] Il cancello smette di segnalare i task già fatti. Oggi `estraiTask` accetta
      sia `- [ ]` sia `- [x]` ma **non cattura quale dei due**, e l'oggetto che produce espone
      `manuale` e non `fatto`: per il cancello un task finito e uno da fare sono
      indistinguibili. I due controlli che predicono un blocco futuro del guard —
      `task-su-percorso-protetto` e `task-su-workflow` — girano quindi anche sui task già
      fusi, e siccome decidono guardando se il file esiste **adesso**, ogni task fuso lascia
      dietro di sé un rilievo permanente: il file di test che quel task ha creato ora esiste,
      quindi «lo modificherebbe». È un avviso su un evento che non può accadere, perché un
      task `[x]` non verrà mai più lavorato e non aprirà mai più una PR. La correzione:
      `estraiTask` cattura la casella ed espone `fatto`; i due controlli sui percorsi saltano
      i task `fatto`; **la copertura dei requisiti continua a contarli**, altrimenti un
      requisito realizzato da un task fuso risulterebbe scoperto e si scambierebbe un falso
      positivo con un altro; la consegna usa `fatto` invece di rileggere la casella per conto
      proprio. Da correggere in `template/scripts/analista-cancello.js` e nella copia
      installata `scripts/analista-cancello.js`, che restano identici. Test in un file nuovo
      `template/scripts/cancello-task-fatti.test.js`: quello del cancello è protetto e non si
      tocca. Copre REQ-321, 324.
      Verifica: un task `- [x]` che tocca un file protetto esistente non produce alcun
      rilievo, e lo stesso task scritto `- [ ]` lo produce; un requisito citato solo da un
      task `- [x]` risulta ancora coperto; `node scripts/analista-cancello.js
      specs/006-registro-leggibile` esce 0 con T001 già fuso, mentre oggi esce 1; i due file
      del cancello sono identici (`git diff --no-index` vuoto); la suite di `.fucina.yml` è
      verde.

## Dipendenze e ordine

- T001 → T002 → T003: il cancello prima del ruolo che lo nomina; la prima parte del ruolo
  prima della seconda (stesso file).
- T004 dopo T001, T002 e T003: deve esistere ciò che copia.
- T005 dopo tutto.
- T006 è indipendente e successivo: corregge il cancello di T001 dopo che l'uso reale ne ha
  mostrato il difetto (spec 006, settembre 2026). Non dipende da T005.

Ordine per il PM (una issue alla volta): **T001, T002, T003, T004, T006**.
