# Specifica 003 — Il PM a cicli

**Cartella**: `specs/003-pm-a-cicli` · **Creata**: 3 settembre 2026 · **Stato**: pronta per il piano

**Input**: «Includere il PM nella fucina: deve essere avviabile e fermabile per non consumare
token restando sempre in ascolto. Va sviluppato tramite la fucina, con il PM in corso, in modo
semi-automatico, usando GitHub Spec Kit per le specifiche.» — Alessio, 3 settembre 2026.

## Chiarimenti

### Sessione 2026-09-03

- D: Come si accende e si spegne il PM? → R: Comando `gh` (abilita/disabilita il workflow)
  incapsulato in uno script `avvia | ferma | stato`. Il pulsante nel Registro è una spec
  successiva.
- D: Quando ci lavora il PM attuale? → R: La spec 002 è completa (T3–T12 fusi, dashboard
  funzionante): la 003 è la prossima in coda, senza sovrapposizioni.
- D: Il nuovo workflow non può essere scritto dall'agente sviluppatore in
  `.github/workflows/` (vincolo dell'action e percorso protetto): va in `template/` e lo
  installa Alessio? → R: Sì. Il PM nuovo va in produzione solo con un gesto esplicito di
  Alessio.

## Scenari d'uso *(obbligatorio)*

### Scenario 1 — Il PM lavora solo quando c'è lavoro (Priorità: P1)

Alessio avvia il PM con un comando e se ne dimentica. Quando l'agente sviluppatore apre una
PR, il PM la revisiona e la fonde o la rimanda; quando l'agente si ferma con una domanda, il
PM risponde se la risposta è nella spec o negli ADR, altrimenti lascia la domanda ad Alessio;
quando un task è fuso, il PM avvia il successivo. Tra un evento e l'altro il PM **non esiste**:
nessuna sessione aperta, nessun token consumato.

**Perché P1**: è l'intera ragione della spec. Oggi il PM è una sessione desktop che interroga
GitHub ogni 60 secondi e consuma token anche a lavoro fermo.

**Verifica indipendente**: con il PM avviato e nessun evento per un'ora, il consumo di token
del PM è zero e nessuna esecuzione del PM compare tra le esecuzioni del repo. Al primo evento
(una PR etichettata `needs-review`) compare una esecuzione del PM che finisce con la PR fusa o
rimandata.

**Scenari di accettazione**:

1. **Dato** il PM avviato e nessuna PR o domanda aperta, **quando** passa un'ora, **allora** non
   c'è alcuna esecuzione del PM e nessun token è stato consumato.
2. **Dato** il PM avviato, **quando** l'agente sviluppatore apre una PR con `needs-review` e
   check verdi, **allora** entro dieci minuti la PR è fusa oppure chiusa con un commento che
   elenca, criterio per criterio, cosa non va, e l'issue del task è di nuovo `ready-for-dev`.
3. **Dato** il PM avviato, **quando** una PR viene fusa, **allora** il task successivo in coda
   riceve `ready-for-dev` senza consumare token.
4. **Dato** il PM avviato, **quando** l'agente sviluppatore si ferma con una domanda coperta
   dalla spec, **allora** il PM risponde nella issue citando dove sta la risposta e riavvia
   l'agente; se la risposta non c'è e la decisione non gli spetta, la domanda per Alessio
   resta sulla issue del task, che compare nel Registro in "Aspettano te".

---

### Scenario 2 — Avviare, fermare, sapere (Priorità: P1)

Alessio, dal terminale del repo, dà tre comandi: *avvia*, *ferma*, *stato*. Fermare vuol dire
che da quel momento non parte più nessuna esecuzione del PM, qualunque cosa accada nel repo;
l'esecuzione eventualmente in corso finisce il ciclo che stava facendo. Avviare vuol dire che il
PM torna a reagire agli eventi **e** fa subito un giro di recupero su tutto ciò che è successo
mentre era fermo. Stato dice se il PM è acceso, cosa sta aspettando e quando ha lavorato
l'ultima volta.

**Perché P1**: senza l'interruttore la spec non risponde alla richiesta; senza il giro di
recupero, fermare il PM farebbe perdere gli eventi accaduti nel frattempo.

**Verifica indipendente**: fermare il PM, etichettare a mano una PR con `needs-review`,
attendere: nessuna esecuzione parte. Avviare il PM: parte un'esecuzione che trova la PR e la
lavora.

**Scenari di accettazione**:

1. **Dato** il PM avviato, **quando** Alessio lo ferma e poi una PR riceve `needs-review`,
   **allora** nessuna esecuzione del PM parte.
2. **Dato** il PM fermo con una PR `needs-review` e un task in coda, **quando** Alessio lo
   avvia, **allora** parte un'esecuzione che revisiona la PR e, se la fonde, avvia il task.
3. **Dato** qualunque stato, **quando** Alessio chiede lo stato, **allora** legge in una
   schermata: acceso/spento, numero di PR da revisionare, domande in attesa, task in coda,
   task in lavorazione, ultima esecuzione con esito e link.
4. **Dato** un'esecuzione del PM in corso, **quando** Alessio lo ferma, **allora**
   l'esecuzione finisce il suo ciclo (non lascia una PR mezza fusa o una issue senza label)
   e non ne parte un'altra.

---

### Scenario 3 — Il rapporto resta l'unico posto da leggere (Priorità: P2)

Ogni cosa che il PM fa o decide finisce, come una riga, nell'issue di rapporto del repo; ogni
decisione presa al posto di Alessio finisce in un ADR su `main`. Alessio torna dopo tre
giorni, legge il rapporto in dieci minuti e sa cosa è stato fuso, cosa rimandato e perché,
cosa lo aspetta.

**Perché P2**: è la promessa fatta con la spec 002 (P5 della costituzione); senza, il PM
automatico diventa una scatola nera.

**Verifica indipendente**: dopo un ciclo di fusione e uno di rimando, il rapporto contiene una
riga per ciascuno con il link alla PR.

**Scenari di accettazione**:

1. **Dato** un repo senza issue di rapporto, **quando** il PM esegue il primo ciclo,
   **allora** crea l'issue di rapporto e ci scrive cosa ha fatto.
2. **Dato** il PM che fonde, rimanda, risponde o avvia un task, **quando** l'azione è
   compiuta, **allora** il rapporto ha un nuovo commento con: azione, oggetto (link), una riga
   di motivo.
3. **Dato** il PM che decide qualcosa non coperto dalla spec, **quando** decide, **allora** su
   `main` compare un ADR in `docs/decisions/` con `decision-makers: [pm-agent]`, e il rapporto
   lo cita.

---

### Scenario 4 — Ciò che non richiede giudizio non costa token (Priorità: P2)

Una PR con i check rossi, o senza le sezioni "Non fatto" e "Fatto in più" nel corpo, viene
rimandata senza chiamare il modello. L'avvio del task successivo, i commenti di stato, il
conteggio dei tentativi, la fusione e la chiusura sono atti del workflow. Il modello viene
chiamato solo per leggere un diff o rispondere a una domanda.

**Perché P2**: è il principio P9 applicato al PM, ed è ciò che rende il costo proporzionale
al lavoro di giudizio e non al numero di eventi.

**Verifica indipendente**: una PR `needs-review` con `guard-tests` rosso viene chiusa e
commentata da un'esecuzione che non contiene alcuna chiamata al modello.

**Scenari di accettazione**:

1. **Dato** una PR `needs-review` con almeno un check rosso, **quando** il PM la incontra,
   **allora** la chiude con un commento che elenca i check falliti, rimette `ready-for-dev`
   all'issue, e non chiama il modello.
2. **Dato** una PR `needs-review` con check verdi ma senza una delle due sezioni obbligatorie
   nel corpo, **quando** il PM la incontra, **allora** la rimanda senza chiamare il modello,
   dicendo quale sezione manca.
3. **Dato** una PR `needs-review` con check ancora in corso, **quando** il PM la incontra,
   **allora** aspetta che finiscano (entro un tetto di tempo) prima di decidere, e non chiama
   il modello nel frattempo.

---

### Casi limite

- Il modello, chiamato per una revisione, termina senza lasciare un verdetto leggibile
  (limite di turni, errore): la PR resta aperta, riceve `needs-human` con un commento che
  spiega, il rapporto lo segnala; il PM non la riprende finché `needs-human` non viene tolto.
- Il verdetto dice "fondi" ma la fusione fallisce (check diventati rossi, conflitto): la PR
  riceve `needs-human` con l'errore; nessun tentativo di forzare.
- Due eventi arrivano insieme (una PR e una domanda): le esecuzioni si accodano, una alla
  volta; ogni esecuzione rilegge lo stato da GitHub e non si fida dell'evento che l'ha
  svegliata.
- Un evento arriva mentre il PM è fermo: viene perso, per costruzione; il giro di recupero
  all'avvio lo ritrova.
- L'issue di rapporto viene chiusa da Alessio: il ciclo successivo ne apre una nuova.
- L'agente sviluppatore esaurisce i tre tentativi su un task: il PM (con giudizio) chiude la
  issue con una spiegazione e ne crea due o tre più piccole in coda, nell'ordine giusto.
- Un'esecuzione del PM fallisce prima di aver fatto qualsiasi cosa (configurazione mancante):
  il rapporto lo dice, con il link al log, e il PM non si riavvia da solo.
- L'esecuzione dell'agente sviluppatore fallisce (turni, errore transitorio) prima di aprire
  una PR: la issue torna `ready-for-dev` da sola finché restano tentativi; esauriti i
  tentativi, `needs-human`. Nessun giudizio necessario.

## Requisiti *(obbligatorio)*

Numerazione: REQ-2xx. Ogni requisito ha una verifica che una macchina o Alessio può eseguire
in meno di dieci minuti.

### Il ciclo

- **REQ-201** — Il PM è un'esecuzione che parte da un evento del repo e termina da sola:
  non esiste alcun processo del PM in attesa tra un evento e l'altro.
  *Verifica:* con il PM avviato e nessun evento, l'elenco delle esecuzioni del repo non
  contiene esecuzioni del PM per un'ora.

- **REQ-202** — Gli eventi che svegliano il PM sono, almeno: una PR che riceve
  `needs-review`; una issue che riceve `needs-human`; una PR chiusa (fusa o no); una issue
  chiusa; una issue che entra in coda; una PR o issue a cui viene tolto `needs-human`; una
  richiesta esplicita (giro di recupero).
  *Verifica:* ciascun evento, provocato a mano, produce un'esecuzione del PM.

- **REQ-203** — Ogni esecuzione rilegge lo stato completo del repo da GitHub e decide cosa
  fare da quello, non dall'evento che l'ha svegliata. Due esecuzioni consecutive senza
  cambiamenti nel mezzo non producono effetti diversi (idempotenza).
  *Verifica:* lanciare due giri di recupero di seguito: il secondo non fa nulla e lo dice.

- **REQ-204** — Le esecuzioni del PM su uno stesso repo sono serializzate: mai due in
  parallelo; la seconda attende la prima.
  *Verifica:* provocare due eventi a distanza di pochi secondi: la seconda esecuzione risulta
  in coda finché la prima non termina.

- **REQ-205** — Un'esecuzione lavora **un oggetto alla volta** (una PR o una issue) e, se
  dopo resta altro lavoro, ne chiede un'altra invece di continuare.
  *Verifica:* con due PR `needs-review`, si osservano due esecuzioni, ciascuna con una sola
  PR nel proprio riepilogo.

### La scelta di cosa fare (senza modello)

- **REQ-210** — L'ordine di priorità è: PR da revisionare, poi domande in attesa, poi avvio
  del task successivo. A parità, l'oggetto con il numero più basso.
  *Verifica:* con una PR `needs-review` (#40), una issue `needs-human` (#30) e un task in
  coda, l'esecuzione lavora la #40.

- **REQ-211** — Il task successivo viene avviato (`ready-for-dev`, tolta la label di coda)
  **solo se** non c'è nessun task `ready-for-dev` o `in-progress`, nessuna PR `needs-review`
  e nessuna issue `needs-human` (esclusa l'issue di rapporto). Si sceglie il task in coda con
  l'identificativo più basso nel titolo (`T001`, `T002`, …).
  *Verifica:* con `T002` e `T003` in coda e nulla di attivo, `T002` diventa `ready-for-dev`;
  con `T001` `in-progress`, nessun task viene avviato.

- **REQ-212** — La label di coda è `in-coda`; la crea `init` se manca. Una issue senza
  `in-coda` non viene mai avviata dal PM.
  *Verifica:* una issue aperta senza label non viene toccata da un giro di recupero.

- **REQ-213** — Una PR `needs-review` con almeno un check concluso in errore viene rimandata
  senza chiamare il modello: commento sulla PR con i check falliti, chiusura della PR,
  stesso commento sull'issue del task, `ready-for-dev` sull'issue. Conta come tentativo.
  *Verifica:* PR con `guard-tests` rosso → chiusa, commentata, issue `ready-for-dev`; nel
  log dell'esecuzione non c'è alcun passo di chiamata al modello.

- **REQ-214** — Una PR `needs-review` con check verdi ma senza la sezione "Non fatto" o
  "Fatto in più" nel corpo viene rimandata senza chiamare il modello, con un commento che
  nomina la sezione mancante.
  *Verifica:* come sopra, con una PR dal corpo minimo.

- **REQ-215** — Una PR `needs-review` con check ancora in corso non viene giudicata: il PM
  attende la loro conclusione fino a un tetto di tempo configurato (default 15 minuti); oltre
  il tetto, la PR riceve `needs-human` e il rapporto lo segnala.
  *Verifica:* etichettare `needs-review` una PR appena aperta: il PM revisiona solo dopo i
  check.

- **REQ-216** — Le PR e le issue con `needs-human` **e** un ultimo commento del PM che
  chiede ad Alessio sono ignorate dal PM finché `needs-human` non viene tolto.
  *Verifica:* dopo una domanda ad Alessio, due giri di recupero non producono un secondo
  commento.

### La revisione (con modello)

- **REQ-220** — Il modello viene chiamato per una PR solo quando: check verdi, entrambe le
  sezioni presenti, nessun `needs-human`. Riceve il numero della PR e il ruolo `pm-agent`.
  *Verifica:* il passo di chiamata al modello compare nel log solo in quelle condizioni.

- **REQ-221** — La revisione segue i criteri del ruolo `pm-agent` (corpo, criteri di
  accettazione contro il diff, "Non fatto", "Fatto in più" contro i file toccati, test, codice,
  regole di `CLAUDE.md`). Il ruolo non fonde, non chiude, non etichetta e non commenta: produce
  un **verdetto** in un file, e il workflow lo esegue.
  *Verifica:* il ruolo non dispone di alcuno strumento che modifichi il repo o GitHub, e il
  file di verdetto è presente al termine di ogni esecuzione con modello.

- **REQ-222** — Il verdetto per una PR è uno tra: `fondi`, `rimanda` (con il testo del
  commento, criterio per criterio), `umano` (con la domanda chiusa per Alessio). Un verdetto
  assente o non leggibile equivale a `umano` con un commento che dice che il PM non ha
  concluso.
  *Verifica:* eseguire il PM con un ruolo che non scrive il verdetto → PR con `needs-human`
  e commento esplicativo.

- **REQ-223** — `fondi` esegue una fusione squash con cancellazione del branch, senza alcun
  bypass delle protezioni. Se la fusione fallisce, la PR riceve `needs-human` con l'errore.
  *Verifica:* PR fusa con il commit squash; simulare un fallimento (rendere rosso un check
  dopo il verdetto) → `needs-human`.

- **REQ-224** — `rimanda` pubblica il commento sulla PR, chiude la PR cancellando il branch,
  copia il commento sull'issue del task, rimette `ready-for-dev`. Conta come tentativo.
  *Verifica:* stato finale come descritto; il contatore dei tentativi sull'issue è aumentato
  al riavvio successivo.

### Le domande (con modello)

- **REQ-230** — Per una issue con `needs-human` (non di rapporto), il modello viene chiamato
  con il numero della issue e produce un verdetto tra: `rispondi` (con la risposta e la
  citazione della fonte), `umano` (con la domanda chiusa per Alessio), `riscrivi` (con
  l'elenco delle nuove issue: titolo e corpo).
  *Verifica:* ciascun verdetto, forzato con una issue di prova, produce lo stato descritto nei
  requisiti seguenti.

- **REQ-231** — `rispondi` commenta la issue, toglie `needs-human`, mette `ready-for-dev`.
  *Verifica:* stato finale come descritto; l'esecuzione dell'agente sviluppatore parte.

- **REQ-232** — `umano` commenta la issue con la domanda chiusa (opzioni) e la lascia
  `needs-human`: Alessio la vede nel Registro e risponde con "Rispondi e riavvia".
  *Verifica:* la issue compare in "Aspettano te" con il commento del PM come ultimo commento.

- **REQ-233** — `riscrivi` crea le nuove issue con `in-coda`, con titoli che mantengono
  l'ordine (`T00Na`, `T00Nb`, …), chiude la issue originale con un commento che spiega, e
  aggiorna nulla in `specs/` (i file di spec restano di competenza umana: il PM lo annota
  nel rapporto).
  *Verifica:* stato finale come descritto; le nuove issue vengono avviate in ordine.

- **REQ-234** — Il PM decide da solo **solo se** la decisione non cambia un requisito, non
  tocca sicurezza, token, permessi o costi. Ogni decisione presa lascia un ADR in
  `docs/decisions/` con `decision-makers: [pm-agent]`, pubblicato su `main` dal workflow,
  mai dal modello.
  *Verifica:* dopo un `rispondi` con decisione, su `main` esiste l'ADR e il modello non ha
  avuto strumenti per fare commit o push.

### Il rapporto

- **REQ-240** — Esiste al più una issue di rapporto aperta per repo, riconoscibile dalla
  label `rapporto-pm`; se manca, il PM la crea al primo ciclo con titolo "Rapporto del PM".
  Non porta `needs-human`: le cose che aspettano Alessio stanno sulle issue e PR
  interessate.
  *Verifica:* chiudere l'issue di rapporto e lanciare un giro: ne compare una nuova.

- **REQ-241** — Ogni azione compiuta (avvio task, fusione, rimando, risposta, domanda ad
  Alessio, riscrittura, errore) aggiunge un commento al rapporto con: azione, link
  all'oggetto, una riga di motivo, link all'esecuzione.
  *Verifica:* dopo una fusione e un rimando, due commenti con i campi elencati.

- **REQ-242** — Un giro che non trova lavoro non scrive nulla sul rapporto.
  *Verifica:* due giri di recupero a stato fermo → nessun commento nuovo.

### L'interruttore

- **REQ-250** — Un comando `avvia` abilita il PM e lancia subito un giro di recupero; un
  comando `ferma` lo disabilita: da quel momento nessun evento produce esecuzioni; un
  comando `stato` mostra acceso/spento, i conteggi elencati nello Scenario 2 (punto 3) e
  l'ultima esecuzione.
  *Verifica:* i tre scenari di accettazione dello Scenario 2.

- **REQ-251** — I tre comandi funzionano da Windows PowerShell 5.1 e usano solo l'autenticazione
  già presente in `gh` (nessun token nello script, nessun token stampato).
  *Verifica:* eseguire i tre comandi da PowerShell 5.1; cercare `token` nell'output.

- **REQ-252** — Fermare il PM non interrompe un'esecuzione in corso: essa completa il ciclo
  (verdetto eseguito, label coerenti) e nessuna nuova esecuzione parte.
  *Verifica:* fermare durante una revisione: la PR finisce fusa o rimandata, non a metà.

### Installazione e configurazione

- **REQ-260** — `init` installa il workflow del PM, il suo script di decisione, lo script
  dei tre comandi e il ruolo `pm-agent` nel repo di destinazione; crea le label `in-coda`
  e `rapporto-pm`; è idempotente (P8).
  *Verifica:* eseguire `init` due volte su un repo pulito: la seconda non crea né sovrascrive
  nulla.

- **REQ-261** — La configurazione del PM sta in `.fucina.yml` sotto la chiave `pm`: modello,
  tetto di turni, tetto di spesa, strumenti permessi (sola lettura più la scrittura del
  verdetto e degli ADR), attesa massima dei check. Ha default sensati se assente.
  *Verifica:* rimuovere la chiave `pm`: il PM funziona con i default; impostare un modello
  diverso: compare nel log.

- **REQ-262** — Le modifiche alla spec 001 necessarie al PM automatico sono due e minime:
  l'esecuzione dell'agente sviluppatore fallita dopo aver contato il tentativo rimette
  `ready-for-dev` da sola finché restano tentativi; l'agente sviluppatore non lavora mai
  una issue con `rapporto-pm`.
  *Verifica:* run fallito con 1 tentativo → issue `ready-for-dev`; run fallito con 3 →
  `needs-human` al riavvio; etichettare `ready-for-dev` l'issue di rapporto → nessun
  tentativo.

### Vincoli

- **REQ-270** — Il modello non ha, in nessuna configurazione, strumenti per fondere, chiudere,
  etichettare, commentare, fare commit o push. Tutti gli effetti passano dal workflow (P9).
  *Verifica:* il passo di configurazione di `pm-agent.yml` esce con errore se
  `pm.strumenti_permessi` contiene `gh pr merge`, `gh pr close`, `gh issue edit`,
  `git push` o `Bash` senza restrizione; nel log del passo «Esegui il PM» l'elenco
  `--allowedTools` contiene solo strumenti di lettura più `Write`.
- **REQ-271** — Nessun `--admin`, nessun bypass delle protezioni, nessun token in chiaro.
  *Verifica:* la stringa `--admin` non compare in `pm-agent.yml` né in `pm.ps1`; il log di
  un'esecuzione, cercato per `token` e `ghp_`/`github_pat_`, mostra solo `***`.
- **REQ-272** — Il PM non tocca `ui/`, `template/`, `plugin/`, `init.sh`, `.fucina.yml`,
  `specs/`, `.specify/`. Questi restano umani (spec) o dell'agente sviluppatore (codice).
  *Verifica:* ogni commit su `main` firmato `pm-agent` tocca solo `docs/decisions/`
  (`git log --author=pm-agent --stat`).

### Entità

- **Verdetto**: l'esito di un ciclo con modello. Oggetto (PR o issue, numero), esito
  (`fondi`, `rimanda`, `rispondi`, `umano`, `riscrivi`), motivo (una riga), commento
  (markdown da pubblicare), nuove issue (solo `riscrivi`), ADR prodotti (nomi file).
- **Coda**: le issue aperte con `in-coda`, ordinate per identificativo nel titolo.
- **Stato del repo**: PR `needs-review` con stato dei check e corpo; issue `needs-human`
  con ultimo commento; issue `ready-for-dev` / `in-progress`; coda; issue di rapporto.
- **Rapporto**: l'issue con `rapporto-pm`, e i suoi commenti.

## Criteri di successo *(obbligatorio)*

- **SC-201** — A lavoro fermo il costo del PM è zero: nessuna esecuzione, nessun token, per
  un tempo arbitrario.
- **SC-202** — Il modello è chiamato al più **una volta per PR revisionata** e **una volta per
  domanda**; mai per avviare task, contare tentativi, commentare, fondere o chiudere.
- **SC-203** — Fermare e riavviare il PM non perde lavoro: tutto ciò che è accaduto durante
  la pausa viene lavorato al riavvio, nell'ordine di REQ-210.
- **SC-204** — Alessio capisce in dieci minuti, dal solo rapporto, cosa ha fatto il PM in
  tre giorni.
- **SC-205** — Una spec di dodici task (come la 002) va da `T001` in coda a `T012` fuso
  senza che Alessio tocchi niente, salvo le domande che il ruolo gli riserva.
- **SC-206** — Il ruolo `pm-agent` non può, per costruzione, fare un'azione irreversibile
  (fusione, chiusura) direttamente.

## Assunzioni

- L'infrastruttura resta quella della spec 001: GitHub Actions, l'action ufficiale di
  Claude Code con token della sottoscrizione, `FUCINA_PAT` per gli atti che devono
  svegliare altri workflow, protezione di `main` con check obbligatori (P6).
- Il modello non ha accesso a `git push`: gli ADR li scrive in una cartella di lavoro e il
  workflow li pubblica su `main` con il PAT. Questo è coerente con P9 e rende l'ADR un
  effetto del workflow, verificabile.
- Il Registro (spec 002) non cambia in questa spec: mostra già le issue `needs-human` con
  l'ultimo commento, che è il canale scelto per le domande ad Alessio. Un pulsante
  Avvia/Ferma nel Registro e la visualizzazione dello stato del PM sono una spec
  successiva.
- La sessione desktop `pm-agent` attuale porta avanti **questa** spec con il ruolo
  vecchio; una volta installato il PM a cicli, il ruolo vecchio viene ritirato e la
  sessione desktop chiusa.
- Gli eventi persi mentre il PM è fermo sono accettati per costruzione (REQ-250: il giro di
  recupero li ritrova).
- Una PR di revisione richiede al modello di leggere un diff di al più qualche centinaio di
  righe: il tetto di turni del PM può essere più basso di quello dell'agente sviluppatore.

## Fuori ambito

- Pulsante Avvia/Ferma e stato del PM nel Registro.
- Più PM in parallelo sullo stesso repo, o un PM che lavora più repo.
- La modifica automatica di `specs/` o `tasks.md` da parte del PM (REQ-233: resta umana).
- Sostituire il modello del PM con uno locale o un fornitore alternativo (resta la
  configurazione `endpoint` della spec 001).
