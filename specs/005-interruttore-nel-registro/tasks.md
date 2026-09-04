# Task: L'interruttore nel Registro

**Input**: `specs/005-interruttore-nel-registro/` — `spec.md`, `plan.md`,
`contracts/comandi-pm.md`.

**Test**: richiesti (P2, P3). Ogni task porta con sé il proprio file di test, **nuovo**:
i file `ui/*.test.js` esistenti sono percorsi protetti e il guard blocca le modifiche,
mentre lascia passare le aggiunte. Le fixture stanno in `ui/fixtures/` come file.

**Organizzazione**: un task = una issue = una PR, lavorata dall'agente sviluppatore e
revisionata dal PM. Ordine sequenziale.

## Formato: `[ID] [Scenario] Descrizione`

- **[US1..US3]**: scenario d'uso della spec (1 spegnere subito, 2 riaccendere senza perdere
  lavoro, 3 sapere cosa costa tenerlo spento)

## Fase 1: leggere lo stato

- [ ] T001 [US1] Leggere se il PM di un repo è acceso, spento o non installato. In
      `ui/lib.js` la costruzione dell'URL della chiamata `L1` del contratto e la funzione
      pura che riduce il campo `state` ai tre soli valori `acceso`, `spento`,
      `non-installato`; in `ui/github.js` la lettura che la usa, trattando il 404 come stato
      e non come errore. Test in `ui/stato-pm.test.js`, fixture
      `ui/fixtures/workflow-pm-attivo.json` e `ui/fixtures/workflow-pm-disabilitato.json`.
      Copre REQ-401, 403, 404, 441.
      Verifica: `state: "active"` dà `acceso`; `disabled_manually` e `disabled_inactivity`
      danno `spento`; una risposta 404 dà `non-installato` senza sollevare errore; ogni
      altro codice diverso da 200 solleva l'errore già usato dalla pagina; le funzioni si
      importano senza browser e non fanno richieste di rete; la suite di `.fucina.yml` è
      verde.

- [ ] T002 [US3] Contare i task in coda e leggere l'ultima esecuzione del PM. In `ui/lib.js`
      la funzione pura che conta le issue `in-coda` **dai dati già scaricati** per la tabella
      della tabella dell'avanzamento (spec 002), senza alcuna chiamata nuova, e la funzione pura che estrae esito, data e
      link dall'ultima esecuzione; in `ui/github.js` la lettura `L2` del contratto. Test in
      `ui/ultima-esecuzione.test.js`, fixture `ui/fixtures/run-pm-ultima.json`.
      Copre REQ-402, 441.
      Verifica: con le fixture il conteggio `in-coda` coincide con le issue etichettate; un
      run concluso espone la propria conclusione, uno ancora in corso espone il proprio
      stato; l'assenza di run dà «nessuna» e non un errore; nessuna funzione pura fa
      richieste di rete.

- [ ] T003 [US1] Mostrare la riga del PM nella sezione che il Registro già costruisce per
      ogni repo, in `ui/index.html`, con i testi in `ui/lib.js`: stato del PM, task
      `in-coda`, ultima esecuzione con link, e un solo pulsante — «Ferma» se acceso, «Avvia»
      se spento, nessuno se non installato. La lettura si aggancia al ciclo di aggiornamento
      di sessanta secondi già presente nella pagina (spec 002) e segnala il dato non aggiornato invece di mostrarlo come nuovo.
      Test in `ui/riga-pm.test.js`.
      Copre REQ-401, 402, 403, 404, 410, 440.
      Verifica: nessuno dei sei conteggi della tabella dell'avanzamento della spec 002 compare due volte nella pagina; con il PM
      acceso è presente solo «Ferma», con il PM spento solo «Avvia», con `non-installato`
      nessuno dei due e nessun messaggio d'errore; a lettura fallita la riga dice che lo
      stato del PM non è aggiornato e il resto della sezione resta visibile; nel repo non
      compaiono `package.json` né `node_modules`.

## Fase 2: i due comandi

- [ ] T004 [US1] Ferma: spegnere il PM ed elencare ciò che finirà il ciclo. In `ui/github.js`
      le chiamate `S1` e `L3` del contratto; in `ui/lib.js` il testo che elenca le esecuzioni
      ancora in corso; in `ui/index.html` il pulsante, che parte al primo click senza
      conferma, resta disabilitato mentre il comando è in corso e aggiorna lo stato mostrato
      senza attendere i sessanta secondi. Test in `ui/ferma-pm.test.js`, fixture
      `ui/fixtures/run-pm-in-corso.json`.
      Copre REQ-411, 412, 416, 417, 430.
      Verifica: dopo «Ferma», `gh workflow list` mostra `pm-agent.yml` disabilitato e
      `dev-agent.yml` ancora attivo; con un'esecuzione in corso il suo link è elencato con la
      frase che finirà il proprio ciclo, senza esecuzioni compare la frase che non ce ne
      sono; due click rapidi producono una sola richiesta di scrittura; la riga passa a
      «spento» entro un paio di secondi senza ricaricare la pagina; nella scheda Rete non
      compaiono richieste verso domini diversi da `api.github.com`.

- [ ] T005 [US2] Avvia: conferma, abilitazione e giro di recupero, in quest'ordine. In
      `ui/lib.js` il testo della conferma — che nomina il repo e dice che il giro di recupero
      chiama il modello — nella stessa forma nativa già usata da «Rispondi e riavvia», e la
      funzione pura che distingue i tre esiti `riuscito`, `solo-abilitato`, `non-abilitato`;
      in `ui/github.js` la lettura `L4` del ramo di default e le chiamate `S2` e `S3` del
      contratto in ordine fisso; in `ui/index.html` il pulsante. Test in
      `ui/avvia-pm.test.js`.
      Copre REQ-413, 414, 415, 416, 417, 430.
      Verifica: annullando la conferma non parte alcuna richiesta di scrittura; confermando,
      le richieste compaiono nell'ordine ramo di default, `enable`, `dispatches`, e il
      dispatch usa come `ref` il ramo letto, non una costante; se la lettura del ramo
      fallisce non viene abilitato nulla; se `enable`
      fallisce, `dispatches` non viene tentata e il messaggio nomina l'abilitazione; se
      `dispatches` fallisce, il messaggio lo dice e il PM resta acceso; il pulsante è
      disabilitato mentre il comando è in corso.

## Fase 3: l'avviso e gli errori

- [ ] T006 [US3] Avvisare quando il PM è spento e il lavoro si accumula. In `ui/lib.js` la
      funzione pura `lavoroInAttesa` descritta nel contratto — PR `needs-review`, issue
      `needs-human` escluse quelle con `rapporto-pm`, task `in-coda` — e in `ui/index.html`
      l'avviso accanto all'interruttore, con il conteggio per tipo. Test in
      `ui/avviso-pm-spento.test.js`.
      Copre REQ-420, 421, 441.
      Verifica: con il PM spento e una PR `needs-review` l'avviso compare e nomina quella PR
      nel conteggio; una issue che ha sia `needs-human` sia `rapporto-pm` non viene contata;
      con il PM acceso l'avviso non compare qualunque sia il lavoro in attesa; con il PM
      spento e nulla in attesa non compare; la funzione non fa richieste di rete.

- [ ] T007 [US1] Messaggi d'errore, isolamento fra repo e vincoli finali. In `ui/lib.js` i
      messaggi della tabella del contratto — 403 che nomina il permesso `Actions: read and
      write` e dove si concede, 404 che dice che il workflow non risulta installato, 401 che
      rimanda a «Configurazione» — e in `ui/index.html` il confinamento dell'errore alla
      sezione del repo che l'ha prodotto. Test in `ui/errori-interruttore.test.js`.
      Copre REQ-431, 432, 442, 443.
      Verifica: con un token in sola lettura su Actions, «Ferma» produce un messaggio che
      nomina quel permesso e non contiene il token; con un repo inesistente nell'elenco la
      sua sezione mostra l'errore e le altre restano leggibili e comandabili; questa PR non
      elenca `scripts/pm.ps1` né `template/scripts/pm.ps1` fra i file modificati; nel
      codice della pagina non compaiono chiamate di scrittura oltre a `disable`, `enable`,
      `dispatches` e a quelle già presenti per «Rispondi e riavvia» della spec 002.

## Fase 4: a cura di Alessio (non sono issue)

- [ ] T008 [MANUALE] Allargare il token del Registro a `Actions: read and write`.
      Rigenerare il token fine-grained usato dal Registro aggiungendo quel permesso sui repo
      mostrati, e reinserirlo dalla schermata «Configurazione». Aggiorna di fatto OP-202
      della spec 002. Va fatto prima di poter provare davvero T004–T007: senza, i comandi
      restano il 403 leggibile di REQ-431.
