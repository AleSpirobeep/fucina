# Task: Il Registro leggibile

**Input**: `specs/006-registro-leggibile/` — `spec.md`, `plan.md`, `contracts/palette.md`.

**Test**: richiesti (P2, P3). Ogni task porta il proprio file di test, **nuovo**: i file
`ui/*.test.js` esistenti sono percorsi protetti, il guard blocca le modifiche e lascia passare
le aggiunte. Nessun task ha bisogno della label `allow-test-changes`.

**Rete di sicurezza**: i 280 test della spec 005 restano verdi senza essere toccati. Se una
riorganizzazione rompe un comportamento, lo dice la CI prima del PM.

**Organizzazione**: un task = una issue = una PR, lavorata dall'agente sviluppatore e
revisionata dal PM. Ordine sequenziale.

## Formato: `[ID] [Scenario] Descrizione`

- **[US1..US4]**: scenario d'uso della spec (1 dieci secondi, 2 l'avanzamento non è più un
  muro, 3 il telefono, 4 i colori scelti)

## Fase 1: il colore

- [ ] T001 [US4] La tavolozza Ardesia e il contrasto come test. In `ui/index.html` sostituire
      i valori dei token di colore nei due temi con quelli del contratto, e aggiungere il
      token nuovo `--colore-ok`; in `ui/lib.js` le funzioni pure `luminanza(colore)` e
      `contrasto(a, b)` secondo la formula del contratto, e la tabella delle coppie da
      verificare. Test in `ui/contrasto.test.js`. Il colore va per primo, da solo, mentre la
      struttura è ancora quella nota.
      Copre REQ-540, 541, 542, 543, 551.
      Verifica: i sedici token di ciascun tema coincidono uno a uno con la tabella del
      contratto; il test calcola le quattordici coppie in entrambi i temi e nessuna scende
      sotto 4,5, con minimo atteso 5,23; abbassando di proposito un valore il test diventa
      rosso; nel foglio di stile l'accento non è usato per indicare uno stato e i tre colori
      semantici non compaiono come sfondo di un pulsante d'azione; non esiste alcun comando
      di tema nell'interfaccia.

## Fase 2: la gerarchia

- [ ] T002 [US1] La riga di stato sopra ogni sezione. In `ui/lib.js` la funzione pura che
      compone, per ogni repo, stato del PM, agenti al lavoro e lavoro in attesa **dai dati che
      la pagina ha già** — nessuna chiamata nuova; in `ui/index.html` la riga in cima, prima
      di «Aspettano te», e le tre sezioni nell'ordine «Aspettano te», «Avanzamento», «Agenti
      attivi». Test in `ui/riga-stato.test.js`.
      Copre REQ-501, 502, 503.
      Verifica: in una finestra da 1280×800, a pagina appena caricata, stato del PM, agenti e
      lavoro in attesa sono visibili senza scorrere; con un repo del tutto a riposo la riga lo
      dice esplicitamente invece di restare vuota; senza repo configurati rimanda alla
      configurazione invece di mostrare tre zeri; con un repo che risponde e uno che no, la
      riga segnala l'incompletezza e non somma dati parziali; l'ordine nel documento è riga di
      stato, «Aspettano te», «Avanzamento», «Agenti attivi»; la funzione non fa richieste di
      rete.

## Fase 3: la densità

- [ ] T003 [US2] L'avanzamento come riga di conteggi. In `ui/index.html` sostituire la tabella
      a colonne con una riga di sette conteggi per repo — le sei voci già previste più i task
      in coda — senza alcun titolo, togliendo contestualmente il numero dei task in coda dalla
      riga del PM, che torna a occuparsi solo del PM; in `ui/lib.js` la funzione pura che
      prepara le voci e dice quali sono apribili. Test in `ui/conteggi-avanzamento.test.js`.
      Copre REQ-510, 513.
      Verifica: con sette issue chiuse di recente e tre in coda la sezione mostra sette
      conteggi e nessun titolo; il numero dei task in coda compare una volta sola nella pagina
      e non è più nella riga del PM, che continua a mostrare stato, ultima esecuzione e
      comando; una voce a zero non reagisce al clic e non mostra l'indicatore di apertura che
      hanno le altre; la funzione non fa richieste di rete.

- [ ] T004 [US2] Il dettaglio che si apre, e che viene ricordato. In `ui/index.html`
      l'apertura e la chiusura di ogni conteggio maggiore di zero, con i titoli e il link alla
      pagina GitHub corrispondente; in `ui/lib.js` la funzione pura che legge e scrive quali
      conteggi sono aperti, con la stessa chiave di prefisso delle altre preferenze, così che
      «Dimentica il token» le azzeri tutte con una sola regola. Test in
      `ui/dettaglio-apribile.test.js`.
      Copre REQ-511, 512.
      Verifica: aprendo «Fatte 7» compaiono sette titoli con link, richiudendo spariscono;
      dopo un ricarico il dettaglio aperto è ancora aperto; dopo «Dimentica il token» e un
      ricarico è tutto compatto; in una finestra privata, dove la memoria non è concessa, la
      pagina funziona, parte compatta e non mostra alcun errore; un dettaglio ricordato che
      punta a un conteggio diventato zero si presenta chiuso e viene dimenticato; un elenco
      con molti titoli scorre dentro il proprio riquadro invece di allungare la pagina.

- [ ] T005 [US1] «Agenti attivi» solo quando c'è qualcuno al lavoro. In `ui/index.html` la
      sezione compare se e solo se esiste almeno un'esecuzione in corso o in coda, mentre il
      conteggio degli agenti resta sempre nella riga di stato. Test in
      `ui/agenti-condizionale.test.js`.
      Copre REQ-520.
      Verifica: senza esecuzioni la sezione non è nel documento e la riga di stato dice che
      nessun agente sta lavorando; avviata un'esecuzione la sezione compare entro un
      aggiornamento; il conteggio nella riga di stato è presente in entrambi i casi.

## Fase 4: il telefono, e la chiusura

- [ ] T006 [US3] La pagina da 360 px in su. In `ui/index.html` togliere le larghezze fisse e
      far ridurre la griglia a una colonna, con i conteggi che vanno a capo e le aree
      toccabili dei comandi del PM ad almeno 44×44 px; una sola serie di regole valida a ogni
      larghezza, non una seconda pagina da mantenere. Test in `ui/telefono.test.js` per le
      funzioni pure coinvolte.
      Copre REQ-530, 531, 532.
      Verifica: a 360×740 nessuna sezione provoca scorrimento orizzontale; «Ferma» e «Avvia»
      sono raggiungibili e toccabili, con la stessa conferma su «Avvia» già prevista; i
      conteggi occupano più righe invece di introdurre una barra di scorrimento; un nome di
      repo molto lungo va a capo o si tronca senza spingere fuori il pulsante del PM.

- [ ] T007 [US4] Vincoli finali e nessuna regressione. Verifica di chiusura sulla pagina
      completa, in `ui/index.html` per le eventuali correzioni residue, con i controlli
      raccolti in `ui/vincoli-006.test.js`.
      Copre REQ-550, 552.
      Verifica: nel repo non compaiono `package.json` né `node_modules` e l'unico dominio
      esterno referenziato dalla pagina resta quello dei caratteri; la suite è verde; nessuna
      PR di questa spec elenca un file di test preesistente fra i file modificati; le tre
      famiglie di caratteri dichiarate sono ancora Archivo, Newsreader e JetBrains Mono.
