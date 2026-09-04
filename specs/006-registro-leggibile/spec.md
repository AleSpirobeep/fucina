# Specifica 006 — Il Registro leggibile

**Cartella**: `specs/006-registro-leggibile` · **Creata**: 5 settembre 2026 · **Stato**: pronta per il piano

**Input**: «Voglio fare l'analisi per l'aggiornamento della parte grafica del sistema fucina:
[…] Poi deve essere più bella e strutturata. Da dove partiamo?» — Alessio, 4 settembre 2026.

È la seconda metà di quell'idea. La prima — l'interruttore e lo stato del PM — è la spec 005,
chiusa: sette task su sette fusi. Questa prende ciò che resta: **gerarchia, densità e colore**.

Questa spec **emenda esplicitamente cinque punti della spec 002**. Sono dichiarati nei
requisiti che li cambiano, come fece REQ-262 della spec 003 con la 001: una spec accettata non
si riscrive di nascosto.

## Chiarimenti

### Sessione 2026-09-05

- D: Cosa dà fastidio davvero, aprendo il Registro oggi? → R: Tre cose insieme: la gerarchia
  (tutto pesa uguale), la tabella dell'avanzamento (è un muro), e l'estetica (spaziature,
  allineamenti, colori). Non manca nulla: è come sono mostrate le cose.
- D: Come si fa a sapere che la 006 ha funzionato, dato che «più bella» non è un criterio? →
  R: Il cronometro che la spec 002 si era già data: aprire la pagina e sapere in dieci secondi
  se c'è qualcosa che aspetta Alessio e se gli agenti stanno lavorando, misurato su uno stato
  di prova preparato.
- D: Quanto può cambiare del Registro? → R: Anche cosa sta in quali sezioni, e l'identità
  visiva. È il raggio più ampio dei tre proposti, e comporta di emendare la 002.
- D: Su quanti repo deve reggere la struttura? → R: Uno o due, il caso reale. Niente
  navigazione fra repo da progettare.
- D: Con cosa si sostituisce la tabella dell'avanzamento? → R: Conteggi compatti, con il
  dettaglio dei titoli che si apre a richiesta.
- D: Qual è la prima cosa da vedere aprendo la pagina? → R: Una riga di stato in cima — PM
  acceso o spento, agenti al lavoro, quante cose aspettano — e sotto il dettaglio.
- D: L'identità visiva cambia? → R: Sì, ma **solo i colori**. I font restano Archivo,
  Newsreader e JetBrains Mono: il problema è la tavolozza, non le famiglie.
- D: Che fine fa la sezione «Agenti attivi», ora che la riga di stato dice già quanti agenti
  lavorano? → R: Resta, ma compare **solo quando c'è qualcuno al lavoro**.
- D: Il telefono, che la 002 lasciava fuori? → R: Dentro, per leggere e per comandare: dal
  telefono si deve poter sia fermare sia riavviare il PM.
- D: Il dettaglio aperto resta aperto dopo un ricarico? → R: Sì, ricordato nel browser.
- D: Come si fissa la palette, visto che «più bella» non entra in un criterio di
  accettazione? → R: Con delle proposte da guardare. Fatte quattro (Attuale, Ardesia, Carta,
  Grafite) rese sulla struttura nuova nei due temi. **Scelta: Ardesia.** I suoi valori esatti
  sono il contratto `contracts/palette.md`.
- D: Il tema resta automatico o serve un interruttore? → R: Resta automatico, segue il
  sistema operativo.
- D: Da quale stato si misurano i dieci secondi, dato che il dettaglio aperto viene
  ricordato? → R: Sempre dalla vista compatta, come la vede un browser che apre la pagina la
  prima volta.
- D: I task `in-coda` stanno oggi nella riga del PM (REQ-402 della spec 005), perché la
  vecchia tabella non li aveva; con la riga di conteggi nuova finirebbero in due posti, e
  SC-403 della 005 lo vieta. Dove vivono? → R: Nella riga dei conteggi, come settima voce
  dell'avanzamento; la riga del PM torna a occuparsi solo del PM.

**Tensione accettata, dichiarata**: la sezione «Agenti attivi» che compare e scompare è una
pagina che cambia forma sotto gli occhi — lo stesso difetto per cui è stata scartata l'opzione
«la cima cambia secondo lo stato». Alessio l'ha scelta sapendolo. REQ-520 la mitiga tenendo il
conteggio degli agenti sempre presente nella riga di stato, così l'informazione non scompare
mai del tutto: scompare solo il dettaglio.

## Scenari d'uso *(obbligatorio)*

### Scenario 1 — Dieci secondi, sempre (Priorità: P1)

Alessio apre il Registro. Prima di qualunque sezione, una riga gli dice tre cose: il PM è
acceso, un agente sta lavorando, due cose aspettano lui. Non deve scorrere, non deve contare,
e non deve sapere dov'è scritto: è la prima cosa che c'è.

**Perché P1**: è il lavoro singolo che la spec 002 si era data — «aprire la pagina e sapere in
dieci secondi: c'è qualcosa che aspetta me? gli agenti stanno lavorando o sono fermi?» — e oggi
non è vero, perché per rispondere alla seconda domanda bisogna scorrere fino in fondo.

**Verifica indipendente**: preparare uno stato noto, aprire la pagina in una finestra da
1280×800 mai usata prima, cronometrare. Sotto i dieci secondi, senza scorrere.

**Scenari di accettazione**:

1. **Dato** un browser che apre il Registro per la prima volta, **quando** la pagina ha
   finito di caricare, **allora** stato del PM, agenti al lavoro e quantità di lavoro in
   attesa sono tutti visibili senza scorrere.
2. **Dato** un repo a riposo — nessuna PR, nessuna domanda, nessun agente — **quando** Alessio
   apre la pagina, **allora** la riga di stato lo dice esplicitamente, invece di essere vuota.
3. **Dato** il Registro aperto, **quando** Alessio guarda la prima schermata, **allora** trova
   la risposta a entrambe le domande della spec 002, qualunque sia lo stato del repo.

---

### Scenario 2 — L'avanzamento smette di essere un muro (Priorità: P1)

Il repo ha sette task chiusi, tre in coda, uno in lavorazione. Oggi sono sette titoli, tre
titoli e un titolo, tutti stampati dentro le celle di una tabella a sei colonne, e la sezione
è più alta dello schermo. Da domani è una riga di numeri; i titoli si aprono quando servono.

**Perché P1**: è il secondo dei tre fastidi dichiarati, ed è quello che peggiora da solo — più
la fucina lavora, più la pagina si allunga.

**Verifica indipendente**: con lo stato attuale del repo `fucina`, la sezione Avanzamento
occupa una riga di conteggi e nessun titolo, finché non si apre un dettaglio.

**Scenari di accettazione**:

1. **Dato** un repo con sette issue chiuse di recente, **quando** Alessio apre la pagina,
   **allora** legge «Fatte 7» e nessuno dei sette titoli.
2. **Dato** un conteggio maggiore di zero, **quando** Alessio lo apre, **allora** compaiono i
   titoli con il link a GitHub, e richiudendolo spariscono.
3. **Dato** un dettaglio lasciato aperto, **quando** Alessio ricarica la pagina, **allora**
   quel dettaglio è ancora aperto.
4. **Dato** un conteggio a zero, **quando** Alessio prova ad aprirlo, **allora** non succede
   nulla, e si vedeva già che non era apribile.

---

### Scenario 3 — Fermare il PM dal telefono (Priorità: P2)

Alessio è fuori, si accorge che la fucina sta consumando, tira fuori il telefono, apre il
Registro e preme «Ferma». Più tardi, dallo stesso telefono, lo riaccende con la conferma.

**Perché P2**: è la richiesta con cui è nata la 005 — «avviare e fermare in qualsiasi momento,
per evitare il troppo consumo dei token» — e oggi è vera solo davanti al PC, perché la 002
aveva escluso il telefono. L'interruttore c'è già: manca la pagina che lo lascia toccare.

**Verifica indipendente**: aprire il Registro da un telefono, o da una finestra larga 360 px,
e premere «Ferma»: il workflow risulta disabilitato.

**Scenari di accettazione**:

1. **Dato** uno schermo largo 360 px, **quando** Alessio apre il Registro, **allora** nessun
   elemento provoca scorrimento orizzontale.
2. **Dato** il Registro su schermo stretto, **quando** Alessio cerca i comandi del PM,
   **allora** «Ferma» e «Avvia» sono presenti e toccabili come sul desktop, con la stessa
   conferma su «Avvia».
3. **Dato** uno schermo stretto e un repo dal nome lungo, **quando** la pagina si dispone,
   **allora** i conteggi vanno a capo invece di introdurre una barra di scorrimento.

---

### Scenario 4 — I colori scelti, non ereditati (Priorità: P2)

La pagina passa alla tavolozza Ardesia: neutri blu-grigio, accento acciaio riservato
all'azione, e tre colori semantici distinti — verde per ciò che è andato bene, ambra per ciò
che attende, rosso per ciò che è rotto. In entrambi i temi, che restano automatici.

**Perché P2**: è il terzo fastidio dichiarato. Viene dopo gli altri due perché una pagina
ordinata con i colori di ieri è meglio di una pagina disordinata con i colori di domani.

**Verifica indipendente**: i valori nel foglio di stile coincidono con la tabella del
contratto, e il controllo di contrasto in CI è verde.

**Scenari di accettazione**:

1. **Dato** il foglio di stile della pagina, **quando** lo si confronta con
   `contracts/palette.md`, **allora** i sedici token di ciascun tema coincidono uno a uno.
2. **Dato** qualunque coppia testo/sfondo della tabella, **quando** se ne calcola il rapporto
   di contrasto, **allora** supera 4,5:1.
3. **Dato** il sistema operativo impostato su scuro, **quando** Alessio apre la pagina,
   **allora** vede il tema scuro, senza alcun comando da premere.

---

### Casi limite

- Nessun repo configurato: la riga di stato dice che non c'è niente da mostrare e rimanda alla
  configurazione, invece di mostrare tre zeri.
- Un repo risponde e un altro no: la riga di stato riporta i conteggi che ha e segnala che uno
  è incompleto; non somma dati parziali fingendo che siano totali.
- Un dettaglio ricordato come aperto punta a un conteggio diventato zero: si presenta chiuso,
  e la memoria di quel dettaglio viene dimenticata.
- Il browser non concede memoria locale (finestra privata, impostazioni): la pagina funziona,
  parte tutta compatta e non ricorda nulla. Non è un errore da mostrare.
- Un conteggio aperto contiene molti titoli: l'elenco scorre dentro il proprio riquadro
  invece di allungare la pagina senza fine.
- Il sistema operativo cambia tema mentre la pagina è aperta: i colori cambiano senza
  ricaricare e senza perdere ciò che era aperto.
- Nome di repo molto lungo su schermo stretto: va a capo o si tronca con l'intero nome
  disponibile al passaggio del mouse; non spinge fuori il pulsante del PM.
- La pagina è aperta mentre il PM viene spento dal terminale: la riga di stato lo mostra al
  successivo aggiornamento, come già oggi.

## Requisiti *(obbligatorio)*

Numerazione: REQ-5xx. Ogni requisito ha una verifica eseguibile in meno di dieci minuti.

### La gerarchia

- **REQ-501** — Sopra ogni sezione, una riga di stato riporta, per ciascun repo configurato:
  se il PM è acceso, spento o non installato; quanti agenti stanno lavorando; **quanto** lavoro
  aspetta Alessio, come totale. La ripartizione per tipo resta dov'era: nell'avviso a PM
  spento della spec 005, che è un allarme e non un conteggio.
  *Verifica:* in una finestra da 1280×800, a pagina appena caricata, le tre informazioni sono
  visibili senza scorrere; il totale della riga di stato e la ripartizione dell'avviso non si
  contraddicono.

- **REQ-502** — Le due domande della spec 002 — c'è qualcosa che aspetta Alessio, e gli agenti
  stanno lavorando — hanno risposta nella prima schermata **in ogni stato**, compreso il repo
  completamente a riposo.
  *Verifica:* con uno stato di prova senza PR, senza domande e senza agenti, entrambe le
  risposte restano visibili senza scorrere.

- **REQ-503** — Sotto la riga di stato l'ordine delle sezioni è: «Aspettano te»,
  «Avanzamento», «Agenti attivi». **Emenda REQ-110 della spec 002**, che voleva «Aspettano te»
  in cima alla pagina: da qui in avanti in cima c'è la riga di stato, e «Aspettano te» è la
  prima sezione.
  *Verifica:* nell'ordine del documento la riga di stato precede «Aspettano te», che precede
  «Avanzamento», che precede «Agenti attivi».

### L'avanzamento

- **REQ-510** — L'avanzamento di un repo si legge come una riga di sette conteggi: le sei voci
  della spec 002 più i task in coda. Nessun titolo compare finché non si apre un dettaglio.
  **Emenda REQ-120 della spec 002**, che imponeva «ogni colonna elenca i titoli con link», e
  **REQ-402 della spec 005**, che voleva i task in coda solo nella riga del PM: quel numero è
  avanzamento e vive qui, mentre la riga del PM torna a occuparsi solo del PM — acceso o
  spento, ultima esecuzione, comando. Nessun conteggio compare due volte, come vuole SC-403
  della spec 005.
  *Verifica:* con sette issue chiuse di recente e tre in coda, la sezione mostra sette
  conteggi e nessun titolo; il numero dei task in coda compare una volta sola nella pagina, e
  non è nella riga del PM.

- **REQ-511** — Ogni conteggio maggiore di zero si può aprire, e mostra i titoli con il link
  alla pagina GitHub corrispondente; si richiude con lo stesso gesto.
  *Verifica:* aprire «Fatte 7» mostra sette titoli con link funzionanti; richiudendolo
  spariscono.

- **REQ-512** — Ciò che è aperto resta aperto dopo un ricarico, ricordato nel browser accanto
  alle altre preferenze della pagina; «Dimentica il token» azzera anche questa memoria.
  *Verifica:* aprire un dettaglio e ricaricare → resta aperto; premere «Dimentica il token» e
  ricaricare → tutto compatto.

- **REQ-513** — Un conteggio a zero non è apribile, e lo si vede prima di provarci.
  *Verifica:* «Backlog 0» non reagisce al clic e non mostra l'indicatore di apertura che hanno
  gli altri.

### Gli agenti

- **REQ-520** — La sezione «Agenti attivi» compare solo quando c'è almeno un'esecuzione in
  corso o in coda; altrimenti non è nella pagina. Il **conteggio** degli agenti resta sempre
  nella riga di stato, così l'informazione non scompare mai del tutto. **Emenda REQ-121 della
  spec 002**, che la voleva sempre presente.
  *Verifica:* senza esecuzioni la sezione non compare e la riga di stato dice «nessun agente
  al lavoro»; avviata un'esecuzione, la sezione compare entro un aggiornamento.

### Il telefono

- **REQ-530** — La pagina è usabile da 360 px di larghezza in su: nessun elemento provoca
  scorrimento orizzontale e ogni testo resta leggibile senza ingrandire. **Emenda REQ-142
  della spec 002**, che dichiarava «nessun requisito per il telefono».
  *Verifica:* a 360×740 la pagina non scorre lateralmente in nessuna delle sue sezioni.

- **REQ-531** — Da schermo stretto si leggono tutte le sezioni e si usano entrambi i comandi
  del PM, «Ferma» e «Avvia», con la stessa conferma su «Avvia» prevista dalla spec 005.
  *Verifica:* a 360 px i due comandi sono raggiungibili e la loro area toccabile è almeno
  44×44 px.

- **REQ-532** — A schermo stretto la riga dei conteggi va a capo invece di introdurre una
  barra di scorrimento orizzontale.
  *Verifica:* a 360 px i conteggi occupano più righe e la sezione non scorre lateralmente.

### I colori

- **REQ-540** — I colori della pagina sono i sedici token per tema del contratto
  `contracts/palette.md` (tavolozza Ardesia), con i valori esatti indicati lì. **Emenda OP-203
  della spec 002 limitatamente ai colori**: le tre famiglie di caratteri — Archivo, Newsreader,
  JetBrains Mono — restano quelle, e l'ADR che le riguarda non è toccato.
  *Verifica:* i valori dichiarati nel foglio di stile coincidono uno a uno con la tabella del
  contratto, in entrambi i temi.

- **REQ-541** — Ogni coppia testo/sfondo elencata nel contratto supera 4,5:1 di contrasto
  (WCAG AA) in entrambi i temi.
  *Verifica:* un test della suite calcola i rapporti dalla tabella del contratto ed è verde;
  il minimo atteso è 5,2.

- **REQ-542** — Il tema resta automatico e segue il sistema operativo: nessun comando di tema
  nell'interfaccia.
  *Verifica:* cambiando il tema del sistema la pagina cambia senza ricaricare, e nella pagina
  non esiste alcun controllo per sceglierlo.

- **REQ-543** — Il colore semantico è distinto dall'accento: verde per ciò che è andato bene,
  ambra per ciò che attende, rosso per ciò che è rotto; l'accento resta riservato alle azioni.
  *Verifica:* nel foglio di stile l'accento non è usato per indicare uno stato, e i tre colori
  semantici non sono usati come sfondo di un pulsante d'azione.

### Vincoli

- **REQ-550** — Nessun passo di build e nessuna dipendenza esterna oltre all'API di GitHub e
  ai caratteri già dichiarati.
  *Verifica:* nel repo non compaiono `package.json` né `node_modules`, e l'unico dominio
  esterno referenziato dalla pagina resta quello dei caratteri.

- **REQ-551** — La logica pura nuova sta in `ui/lib.js` come funzioni pure esportate, ciascuna
  con almeno un test in un file `ui/<argomento>.test.js` nuovo.
  *Verifica:* la suite di `.fucina.yml` è verde e ogni funzione nuova si importa senza browser.

- **REQ-552** — Nessuna funzione già esistente cambia comportamento: questa spec riorganizza
  come le cose sono mostrate, non ciò che la pagina sa. I test esistenti restano verdi **senza
  essere modificati**.
  *Verifica:* la suite passa e nessuna delle PR di questa spec elenca un file di test
  preesistente fra i file modificati.

### Entità

- **Riga di stato**: per ogni repo, stato del PM, numero di agenti al lavoro, quantità di
  lavoro in attesa. È la sintesi che sta sopra tutto.
- **Conteggio apribile**: una voce dell'avanzamento — nome, numero, e l'elenco di titoli con
  link che compare quando è aperta. A zero non è apribile.
- **Memoria della vista**: quali conteggi sono aperti, per repo, conservata nel browser.
- **Token di colore**: i sedici nomi del contratto, con un valore per il tema chiaro e uno per
  lo scuro.

## Criteri di successo *(obbligatorio)*

- **SC-501** — Su uno stato di prova preparato, aprendo la pagina da una vista compatta si
  risponde in meno di dieci secondi a entrambe le domande della spec 002.
- **SC-502** — Con sette task chiusi, tre in coda e uno in lavorazione, la pagina a riposo sta
  in due schermate da 1280×800; oggi ne occupa di più.
- **SC-503** — Il PM si può fermare e riavviare dal telefono, senza aprire un terminale e
  senza un computer.
- **SC-504** — Nessun colore della pagina è scelto fuori dai sedici token del contratto.
- **SC-505** — I test della spec 005 restano verdi senza essere stati modificati: la 006 non
  toglie nulla di ciò che la 005 ha costruito.

## Assunzioni

- La spec 005 è chiusa e fusa: la riga del PM, l'interruttore e l'avviso esistono già. La 006
  li ricolloca, non li riscrive.
- Il token del Registro con `Actions: read and write` (T008 della 005) resta a carico di
  Alessio. Non blocca questa spec: i comandi già mostrano il proprio errore leggibile.
- I caratteri restano Archivo, Newsreader e JetBrains Mono, con i loro ripieghi di sistema.
  L'ADR `2026-09-03-1541-font-da-google-fonts.md` resta valido e non viene toccato.
- I repo mostrati sono uno o due: nessuna navigazione fra repo è progettata, e la struttura
  verticale regge.
- La tavolozza Ardesia è stata scelta guardando quattro proposte rese sulla struttura nuova
  nei due temi. La pagina di confronto è un supporto alla decisione, vive fuori dal repo, e
  non è un artefatto da mantenere.
- Il contrasto si misura secondo WCAG 2.1 sul rapporto di luminanza relativa, la stessa
  formula usata per costruire la tabella del contratto.

## Fuori ambito

- Cambiare le famiglie di caratteri: solo i colori.
- Un interruttore per il tema chiaro/scuro: resta automatico.
- Navigazione fra più repo, viste separate, filtri o ricerca.
- Mostrare informazioni che oggi il Registro non ha: questa spec cambia come si vede ciò che
  c'è, non cosa c'è.
- Notifiche, più utenti, hosting: restano fuori come nella spec 002.
