# Specifica 005 — L'interruttore nel Registro

**Cartella**: `specs/005-interruttore-nel-registro` · **Creata**: 4 settembre 2026 · **Stato**: pronta per il piano

**Input**: «Voglio fare l'analisi per l'aggiornamento della parte grafica del sistema fucina:
prima di tutto deve poter avviare e fermare il sistema in qualsiasi momento, soprattutto per
evitare il troppo consumo dei token. Poi deve essere più bella e strutturata. Da dove
partiamo?» — Alessio, 4 settembre 2026.

L'idea contiene due cose di natura diversa. Questa spec prende la prima — l'interruttore e lo
stato — che la spec 003 aveva già messo in «Fuori ambito» rinviandola a una spec successiva.
Il rifacimento grafico è la spec 006, non ancora analizzata.

## Chiarimenti

### Sessione 2026-09-04

- D: L'idea contiene un interruttore (funzionale, tocca permessi e token) e un rifacimento
  grafico (presentazione). Una spec sola o due? → R: Due spec. Questa (005) è l'interruttore
  e lo stato; il rifacimento grafico è la 006, analizzata dopo.
- D: Quando premi «Ferma», cosa si ferma? → R: Solo `pm-agent.yml`, e le esecuzioni in corso
  finiscono il loro ciclo. Identico a `pm.ps1 ferma`, coerente con REQ-252 della spec 003.
  Il dev-agent **non** viene fermato.
- D: Per accendere e spegnere dal browser serve `Actions: read and write` sul token del
  Registro, che oggi ha solo lettura (OP-202 della spec 002). Come procediamo? → R: Allargare
  il token a `Actions: read and write`; la pagina chiama direttamente l'API di GitHub, senza
  workflow intermedi.
- D: Il Registro mostra più repo. Su quali agisce l'interruttore? → R: Uno per ogni repo
  mostrato, nella sezione di quel repo.
- D: Il Registro mostra già i conteggi di REQ-120. Cosa aggiungere senza duplicare? → R: Solo
  ciò che manca: acceso/spento, i task `in-coda` (che REQ-120 non ha) e l'ultima esecuzione
  del PM con esito e link. Nessun conteggio ripetuto.
- D: «Avvia» lancia anche il giro di recupero, che chiama il modello e quindi consuma? → R:
  Sì, entrambe le azioni come `pm.ps1 avvia`: abilita il workflow e lancia subito il giro di
  recupero.
- D: Serve una conferma prima di premere, come REQ-132 della spec 002? → R: Solo su «Avvia»,
  che consuma. «Ferma» è immediato, senza conferma.
- D: Se il PM è spento e intanto si accumula lavoro, il Registro deve avvisare? → R: Sì, nella
  sezione del repo, accanto all'interruttore.

## Scenari d'uso *(obbligatorio)*

### Scenario 1 — Spegnere subito, senza terminale (Priorità: P1)

Alessio vede il Registro aperto e si accorge che la fucina sta lavorando più del previsto, o
semplicemente vuole smettere di spendere per oggi. Un click sulla sezione del repo e il PM è
spento: da quel momento nessun evento fa partire una nuova esecuzione. Le esecuzioni già in
corso finiscono il loro ciclo, e la pagina lo dice, elencandole.

**Perché P1**: è la richiesta esplicita di Alessio, ed è la metà che riguarda i costi. Oggi
per spegnere serve un terminale con PowerShell e `gh` autenticato: se il terminale non è
davanti a lui, il PM resta acceso.

**Verifica indipendente**: con il PM acceso, premere «Ferma» nel Registro; poi etichettare a
mano una PR con `needs-review` e attendere: nessuna esecuzione del PM parte.

**Scenari di accettazione**:

1. **Dato** un repo con il PM acceso, **quando** Alessio preme «Ferma», **allora** entro un
   aggiornamento la sezione dice «PM: spento» e `gh workflow list` mostra `pm-agent.yml`
   disabilitato.
2. **Dato** un repo con il PM acceso e un'esecuzione in corso, **quando** Alessio preme
   «Ferma», **allora** la pagina elenca l'esecuzione in corso dicendo che finirà il suo ciclo,
   e nessuna nuova esecuzione parte.
3. **Dato** il PM spento dal Registro, **quando** una PR riceve `needs-review`, **allora**
   nessuna esecuzione del PM compare.
4. **Dato** un repo con il PM spento, **quando** Alessio guarda la sezione, **allora** non
   c'è alcun pulsante «Ferma»: c'è «Avvia».

---

### Scenario 2 — Riaccendere senza perdere ciò che è successo (Priorità: P1)

Alessio riaccende. La pagina gli ricorda, prima di procedere, che riaccendere lancia anche un
giro di recupero e che quel giro chiama il modello. Confermato, il PM torna a reagire agli
eventi **e** lavora subito ciò che è successo mentre era spento.

**Perché P1**: senza il giro di recupero, spegnere farebbe perdere gli eventi della pausa
(SC-203 della spec 003). E senza la conferma, l'unico gesto che costa sarebbe a un click di
distanza da un tocco distratto.

**Verifica indipendente**: fermare il PM dal Registro, etichettare a mano una PR con
`needs-review`, riavviare dal Registro: parte un'esecuzione che trova quella PR e la lavora.

**Scenari di accettazione**:

1. **Dato** un repo con il PM spento, **quando** Alessio preme «Avvia», **allora** la pagina
   chiede conferma nominando il repo e dicendo che il giro di recupero chiama il modello.
2. **Dato** la richiesta di conferma, **quando** Alessio annulla, **allora** nessuna chiamata
   parte e il PM resta spento.
3. **Dato** la richiesta di conferma, **quando** Alessio conferma, **allora** il workflow
   viene abilitato e subito dopo parte un giro di recupero, in quest'ordine.
4. **Dato** che l'abilitazione riesce ma il giro di recupero fallisce, **quando** l'errore si
   presenta, **allora** la pagina dice quale delle due è fallita, e il PM resta acceso: un
   secondo «Avvia» rimedia.

---

### Scenario 3 — Sapere cosa costa tenerlo spento (Priorità: P2)

Alessio spegne il PM di sera e torna dopo tre giorni. La sezione del repo gli dice, senza che
debba cercare, che il PM è spento e che nel frattempo si sono accumulate due PR da
revisionare e quattro task in coda.

**Perché P2**: un interruttore senza il costo dello spegnimento in vista è mezzo strumento. È
il caso peggiore della richiesta di Alessio: spegnere per risparmiare e scoprire tre giorni
dopo che la fucina era ferma.

**Verifica indipendente**: spegnere il PM, etichettare una PR `needs-review`, ricaricare il
Registro: l'avviso compare e nomina quella PR nel conteggio.

**Scenari di accettazione**:

1. **Dato** un repo con il PM spento e almeno una PR `needs-review`, una issue `needs-human`
   non di rapporto o un task `in-coda`, **quando** Alessio apre il Registro, **allora** la
   sezione del repo mostra un avviso che dice quanto lavoro aspetta.
2. **Dato** un repo con il PM acceso, **quando** Alessio apre il Registro, **allora** l'avviso
   non compare, qualunque sia il lavoro in attesa.
3. **Dato** un repo con il PM spento e nulla in attesa, **quando** Alessio apre il Registro,
   **allora** l'avviso non compare.
4. **Dato** qualunque repo, **quando** Alessio guarda la sezione, **allora** legge lo stato
   acceso/spento, i task `in-coda` e l'ultima esecuzione del PM con esito e link — e nessun
   conteggio già presente nella tabella di REQ-120.

---

### Casi limite

- Il token non ha ancora `Actions: read and write`: il comando fallisce con 403 e la pagina
  dice che manca quel permesso e dove si concede, invece di un errore generico o di un
  pulsante che sembra rotto.
- Un repo configurato non ha `pm-agent.yml`: la sezione dice «PM non installato» e non mostra
  alcun interruttore. Non è un errore.
- Un repo risponde e un altro no: l'errore di uno non impedisce di vedere e comandare gli
  altri.
- «Avvia» con fallimento parziale (abilitazione riuscita, giro di recupero fallito): la pagina
  dice quale delle due è fallita; lo stato resta coerente perché l'abilitazione va per prima.
- Doppio click sull'interruttore: il pulsante è disabilitato mentre il comando è in corso,
  così due click non producono due chiamate.
- Il PM viene spento dal terminale con `pm.ps1 ferma` mentre il Registro è aperto: al
  successivo aggiornamento la pagina mostra «spento». Il Registro non tiene uno stato proprio.
- La lettura dello stato del PM fallisce mentre i conteggi di REQ-120 riescono: la sezione
  segnala che lo stato del PM non è aggiornato, senza far sparire il resto.
- Il PM viene spento mentre un'esecuzione sta fondendo una PR: l'esecuzione finisce il ciclo
  (REQ-252 della spec 003), quindi la PR non resta mezza fusa.

## Requisiti *(obbligatorio)*

Numerazione: REQ-4xx. Ogni requisito ha una verifica che una macchina o Alessio può eseguire
in meno di dieci minuti.

### Lo stato del PM

- **REQ-401** — Per ogni repo configurato, il Registro mostra se il PM è acceso o spento,
  leggendo lo stato del workflow `pm-agent.yml` da GitHub a ogni aggiornamento.
  *Verifica:* con il PM acceso la sezione del repo dice «acceso»; dopo `pm.ps1 ferma` e un
  aggiornamento dice «spento».

- **REQ-402** — La sezione del repo mostra il numero di task `in-coda` e l'ultima esecuzione
  del PM con esito e link. Nessun conteggio già presente nella tabella di REQ-120 (spec 002)
  viene ripetuto.
  *Verifica:* i sei conteggi di REQ-120 compaiono una volta sola nella pagina; `in-coda` e
  l'ultima esecuzione compaiono solo nella riga del PM.

- **REQ-403** — Lo stato del PM si aggiorna nello stesso ciclo di REQ-122 (ogni 60 secondi e
  con il pulsante di aggiornamento). Se la sua lettura fallisce, la sezione lo dice invece di
  mostrare un valore vecchio come se fosse nuovo.
  *Verifica:* l'indicazione cambia entro un minuto da un `pm.ps1 ferma`; con il token revocato
  compare un messaggio di errore leggibile al posto dello stato.

- **REQ-404** — Un repo configurato in cui `pm-agent.yml` non esiste mostra «PM non
  installato» e nessun interruttore, senza che questo conti come errore.
  *Verifica:* aggiungere all'elenco un repo senza quel workflow → compare la dicitura, nessun
  pulsante, nessun messaggio d'errore.

### L'interruttore

- **REQ-410** — Ogni repo con il PM installato ha, nella propria sezione, un solo comando:
  «Ferma» quando è acceso, «Avvia» quando è spento. Mai entrambi.
  *Verifica:* con il PM acceso è presente solo «Ferma»; dopo averlo premuto e aggiornato, solo
  «Avvia».

- **REQ-411** — «Ferma» disabilita `pm-agent.yml` di quel repo e nient'altro: `dev-agent.yml`
  resta abilitato. Non chiede conferma.
  *Verifica:* dopo «Ferma», `gh workflow list` mostra `pm-agent.yml` disabilitato e
  `dev-agent.yml` attivo; il comando parte al primo click.

- **REQ-412** — Dopo un «Ferma» riuscito, la pagina elenca le esecuzioni del PM ancora in
  corso su quel repo, dicendo che finiranno il loro ciclo; se non ce ne sono, lo dice.
  *Verifica:* premere «Ferma» durante un'esecuzione → l'esecuzione è elencata con il suo link;
  a repo fermo → la frase che non ce ne sono.

- **REQ-413** — «Avvia» chiede conferma prima di agire, nominando il repo e dicendo che il
  giro di recupero chiama il modello. Annullando, nessuna chiamata parte.
  *Verifica:* click su «Avvia» → finestra di conferma con il nome del repo; annulla → nella
  scheda Rete nessuna richiesta di scrittura.

- **REQ-414** — Confermato «Avvia», la pagina abilita `pm-agent.yml` e **poi** lancia il giro
  di recupero, in quest'ordine, sul ramo di default del repo — lo stesso su cui lo lancia
  `pm.ps1 avvia`.
  *Verifica:* nella scheda Rete le due richieste compaiono in quest'ordine; dopo il comando il
  workflow è attivo e una nuova esecuzione risulta avviata sul ramo di default; su un repo il
  cui ramo di default non si chiama `main`, il giro parte lo stesso.

- **REQ-415** — Se una delle due chiamate di «Avvia» fallisce, la pagina dice quale. L'ordine
  di REQ-414 garantisce che un fallimento sul giro di recupero lasci il PM acceso, rimediabile
  con un secondo «Avvia», e che un fallimento sull'abilitazione non lanci alcun giro.
  *Verifica:* con un token senza permesso di scrittura → errore esplicito sulla prima
  chiamata e nessuna esecuzione avviata.

- **REQ-416** — Dopo un comando riuscito, lo stato mostrato si aggiorna senza attendere il
  ciclo dei 60 secondi.
  *Verifica:* premere «Ferma» → la sezione dice «spento» entro un paio di secondi, senza
  ricaricare la pagina.

- **REQ-417** — Mentre un comando è in corso, il suo pulsante è disabilitato: due click non
  producono due chiamate.
  *Verifica:* con la rete rallentata, due click rapidi producono una sola richiesta di
  scrittura nella scheda Rete.

### L'avviso

- **REQ-420** — Quando il PM di un repo è spento e c'è lavoro in attesa — PR `needs-review`,
  issue `needs-human` escluse quelle con `rapporto-pm`, o task `in-coda` — la sezione mostra
  un avviso che dice quanto lavoro aspetta, per tipo.
  *Verifica:* con il PM spento e una PR `needs-review`, l'avviso compare e nomina quella PR
  nel conteggio.

- **REQ-421** — L'avviso non compare quando il PM è acceso, né quando è spento senza lavoro in
  attesa.
  *Verifica:* con il PM acceso e tre PR `needs-review` non compare; con il PM spento e nulla
  in attesa non compare.

### Il token e gli errori

- **REQ-430** — I comandi usano lo stesso token già in `localStorage` (spec 002): nessun token
  nuovo, nessun secondo canale, nessuna richiesta verso domini diversi da `api.github.com`.
  *Verifica:* la scheda Rete mostra richieste solo a quel dominio; il token non compare nel
  DOM né in alcun file del repo.

- **REQ-431** — Se il token non ha `Actions: read and write`, la pagina dice che manca quel
  permesso e dove si concede, invece di un errore generico.
  *Verifica:* con un token in sola lettura su Actions, «Ferma» produce un messaggio che nomina
  quel permesso.

- **REQ-432** — Un errore su un repo non impedisce di vedere e comandare gli altri.
  *Verifica:* con un repo inesistente nell'elenco, la sezione di quel repo mostra l'errore e
  gli altri restano leggibili e comandabili.

### Vincoli

- **REQ-440** — Nessun passo di build, nessuna dipendenza esterna oltre all'API di GitHub:
  REQ-140 della spec 002 resta valido.
  *Verifica:* nessun `package.json` e nessun `node_modules` compaiono nel repo.

- **REQ-441** — La logica pura — costruzione degli URL, interpretazione dello stato del
  workflow, testo dell'avviso e della conferma, messaggi d'errore — sta in `ui/lib.js` come
  funzioni pure esportate, ciascuna con almeno un test in un file `ui/<argomento>.test.js`
  nuovo.
  *Verifica:* la suite di `.fucina.yml` è verde; ogni funzione nuova si importa senza browser.

- **REQ-442** — `scripts/pm.ps1` e `template/scripts/pm.ps1` restano invariati: il Registro si
  affianca allo script, non lo sostituisce, e REQ-250/251 della spec 003 restano soddisfatti.
  *Verifica:* nessuna PR di questa spec elenca quei due file fra i file modificati.

- **REQ-443** — Le uniche scritture nuove verso GitHub sono l'abilitazione, la
  disabilitazione e l'avvio di `pm-agent.yml`. Il Registro non fonde, non chiude, non
  etichetta e non crea nulla oltre a ciò che la spec 002 già fa.
  *Verifica:* nel codice della pagina non compaiono chiamate di scrittura diverse da quelle
  elencate qui e da quelle di REQ-130 della spec 002.

### Entità

- **Stato del PM di un repo**: installato o no; acceso o spento; numero di task `in-coda`;
  ultima esecuzione (esito, data, link); esecuzioni in corso (link).
- **Lavoro in attesa**: PR `needs-review`, issue `needs-human` escluse quelle `rapporto-pm`,
  task `in-coda`. È ciò che l'avviso di REQ-420 conta.
- **Esito di un comando**: quale comando, su quale repo, riuscito o fallito, e in caso di
  «Avvia» quale delle due chiamate ha fallito.

## Criteri di successo *(obbligatorio)*

- **SC-401** — Da Registro aperto, spegnere il PM di un repo richiede un solo click e ha
  effetto entro un aggiornamento, senza aprire un terminale.
- **SC-402** — Riaccendere dal Registro non perde lavoro: tutto ciò che è successo durante la
  pausa viene lavorato dal giro di recupero, come se fosse stato riacceso da `pm.ps1 avvia`.
- **SC-403** — Nessun conteggio compare due volte nella pagina.
- **SC-404** — Con il PM spento e lavoro in attesa, chi apre il Registro se ne accorge senza
  cercare e senza contare nulla a mano.
- **SC-405** — Il Registro non chiama mai il modello: l'unico consumo di token che può
  causare è il giro di recupero che Alessio chiede esplicitamente confermando «Avvia».

## Assunzioni

- Il token fine-grained del Registro viene rigenerato **da Alessio** con `Actions: read and
  write` sui repo mostrati, aggiornando OP-202 della spec 002. È un passo manuale suo, come i
  passi che `init.sh` gli lascia. Finché non lo fa, quello che si vede è REQ-431.
- Il compromesso dell'ADR `2026-09-02-2000-registro-pagina-statica.md` — token nel browser,
  fine-grained, limitato ai repo mostrati, con scadenza e pulsante «Dimentica» — resta valido
  e si estende al permesso nuovo.
- Il PM è installato dove `pm-agent.yml` esiste. Il Registro non lo installa e non lo
  configura: quello resta `init.sh`.
- Il dev-agent non è comandabile dal Registro in questa spec: chi vuole fermare anche quello
  usa GitHub o una spec successiva.
- Il rifacimento grafico è la spec 006, non ancora analizzata. Questa spec aggiunge elementi
  alla struttura esistente del Registro senza ridisegnarla; se la 006 sposterà quegli
  elementi, li sposterà a requisiti già soddisfatti.
- Nessun requisito per il telefono: REQ-142 della spec 002 resta valido.
- Il Registro non tiene uno stato proprio dell'interruttore: rilegge sempre da GitHub, così
  `pm.ps1` e la pagina non possono divergere.

## Fuori ambito

- Fermare il dev-agent, e annullare le esecuzioni in corso.
- Il rifacimento grafico e strutturale del Registro (spec 006).
- Comandi del PM diversi da avvia e ferma, per esempio forzare la revisione di una PR.
- Notifiche, telefono, più utenti: restano fuori come nella spec 002.
- L'installazione del PM su un repo dal Registro.
