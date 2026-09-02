# Spec 002 — Il Registro

Stato: **bozza, in attesa di chiusura degli open point** · Data: 2 settembre 2026

## Obiettivo

Una pagina che mostra, per tutti i repo su cui la fucina è installata, **quello che
GitHub non mostra**: cosa aspetta una decisione umana, cosa aspetta una revisione e con
quali dichiarazioni dell'agente, quali agenti stanno lavorando, e a che punto è ogni
progetto. Più un solo comando: rispondere a un agente che si è fermato.

Non reimplementa ciò che GitHub fa già bene — diff, check, storia dei commit — ma ci
porta con un link.

## Utente

Alessio, da desktop, nel browser. Nessun altro utente, nessuna autenticazione oltre al
suo token, nessun hosting.

## Il lavoro singolo della v1

Aprire la pagina e sapere in dieci secondi: *c'è qualcosa che aspetta me?* e *gli agenti
stanno lavorando o sono fermi?* Tutto il resto è secondario e va dopo.

## Forma dell'artefatto

Una pagina statica — `ui/index.html` più un modulo `ui/lib.js` — che parla con l'API di
GitHub usando un token personale conservato nel browser. Nessun backend, nessun passo di
build, nessuna dipendenza esterna. La logica pura (parsing, classificazione) sta in
`lib.js` ed è testata con il test runner incorporato di Node.

Vive in `fucina/ui/`. La costruisce la fucina stessa, issue per issue.

---

## Requisiti

### Configurazione

- **REQ-101** — al primo avvio la pagina chiede l'elenco dei repo (`proprietario/nome`,
  uno per riga) e il token; li salva nel `localStorage` del browser e mostra la dashboard.
  Ai successivi avvii parte direttamente dalla dashboard.
  *Verifica:* prima apertura → modulo di configurazione; dopo il salvataggio e un ricarico
  → dashboard senza domande.

- **REQ-102** — il token non lascia il browser se non verso `api.github.com`.
  *Verifica:* la scheda Rete degli strumenti sviluppatore mostra richieste solo a quel
  dominio.

- **REQ-103** — un pulsante "Configurazione" permette di cambiare repo e token in qualsiasi
  momento, e uno "Dimentica il token" lo cancella dal browser.
  *Verifica:* dopo "Dimentica", un ricarico ripropone il modulo del REQ-101.

### La coda — cosa aspetta te

- **REQ-110** — una sezione **"Aspettano te"** in cima elenca, su tutti i repo configurati:
  le issue con `needs-human`, mostrando in linea l'ultimo commento dell'agente (la domanda);
  le PR con `needs-review`, mostrando in linea le sezioni **Non fatto** e **Fatto in più**
  estratte dal corpo, e lo stato dei check.
  *Verifica:* con lo stato attuale di `fucina-lab`, la issue 1 compare con il commento sui
  tentativi esauriti; una PR etichettata `needs-review` compare con le sue due sezioni.

- **REQ-111** — ogni elemento della coda ha il link alla pagina GitHub corrispondente.
  *Verifica:* click → si apre GitHub sull'elemento giusto.

- **REQ-112** — lo stato dei check di una PR è mostrato come verde / rosso / in attesa,
  senza elencare i singoli check.
  *Verifica:* la PR di prova con guard rosso mostra rosso; una PR con tutti i check verdi
  mostra verde.

- **REQ-113** — se la coda è vuota, la sezione lo dice esplicitamente ("Niente aspetta
  te") invece di scomparire.
  *Verifica:* con tutte le issue senza `needs-human` e nessuna PR `needs-review`, la
  frase compare.

### L'avanzamento

- **REQ-120** — per ogni repo, una tabella di stato con sei colonne e i relativi conteggi:
  **Backlog** (issue aperte senza label di stato), **Pronte** (`ready-for-dev`),
  **In lavorazione** (`in-progress`), **In revisione** (PR `needs-review`),
  **Bloccate** (`needs-human`), **Fatte** (issue chiuse negli ultimi 14 giorni).
  Ogni colonna elenca i titoli con link.
  *Verifica:* i conteggi coincidono con `gh issue list` e `gh pr list` filtrati per label.

- **REQ-121** — una sezione **"Agenti attivi"** elenca i run del workflow `dev-agent` in
  stato `in_progress` o `queued`, per repo, con la issue su cui lavorano, il tempo
  trascorso e il link al run.
  *Verifica:* si avvia un run → compare entro un aggiornamento; termina → scompare.

- **REQ-122** — la pagina si aggiorna da sola ogni 60 secondi e con un pulsante; mostra
  l'ora dell'ultimo aggiornamento e, se una chiamata all'API fallisce, lo dice invece di
  mostrare dati vecchi come se fossero nuovi.
  *Verifica:* l'ora cambia ogni minuto; con il token revocato compare un errore leggibile.

### Il comando

- **REQ-130** — su ogni elemento `needs-human` c'è un campo di testo e un pulsante
  **"Rispondi e riavvia"**. Alla conferma: pubblica il commento, toglie `needs-human`,
  mette `ready-for-dev`. In quest'ordine.
  *Verifica:* su una issue di prova → il commento compare, le label cambiano, il
  workflow parte.

- **REQ-131** — se una delle tre chiamate fallisce, la pagina dice quale, e lo stato resta
  coerente: il commento va per primo, così un fallimento sulle label lascia la domanda
  già risposta e la issue ancora `needs-human` — rimediabile a mano, mai un riavvio senza
  risposta.
  *Verifica:* con un token senza permesso di scrittura sulle issue → errore esplicito
  sulla prima chiamata, nessun cambio di stato.

- **REQ-132** — prima di inviare, la pagina chiede conferma mostrando il testo che sta per
  pubblicare e su quale issue.
  *Verifica:* click → finestra di conferma; annulla → nessuna chiamata.

### Vincoli

- **REQ-140** — nessun passo di build, nessuna dipendenza esterna oltre all'API di
  GitHub. La cartella `ui/` contiene `index.html`, `lib.js`, `lib.test.js` e uno script
  di avvio.
  *Verifica:* nessun `package.json`, nessun `node_modules`.

- **REQ-141** — tutta la logica pura — estrazione delle sezioni dal corpo di una PR,
  classificazione di issue e PR nelle colonne, formattazione dei tempi — sta in `lib.js`
  ed è coperta da test eseguibili con `node --test ui/`.
  *Verifica:* `node --test ui/` verde; le funzioni sono importabili senza un browser.

- **REQ-142** — impaginazione per schermi da 1200 px in su. Nessun requisito per il
  telefono.
  *Verifica:* a 1280 px nulla scorre orizzontalmente.

- **REQ-143** — la pagina si apre con uno script `ui/apri.ps1` che avvia un server locale
  e apre il browser. (Le pagine con moduli ES non funzionano da `file://`.)
  *Verifica:* doppio click o `.\ui\apri.ps1` → browser aperto sulla dashboard.

---

## Fuori scope in v1

Creare issue dalla pagina · modificare specifiche · lanciare comandi Spec Kit · agente
PM · costi per run (non disponibili sotto sottoscrizione) · più utenti · hosting ·
telefono · notifiche.

Ognuno di questi, se e quando servirà, è una spec propria con la sua Fase 0.

---

## Open point

| # | Domanda | Proposta |
|---|---|---|
| OP-201 | La UI vive in `fucina/ui/`, ma `fucina` è privato e sul piano Free non ha protezione del branch. Renderlo pubblico o creare un repo `fucina-ui`? | **Rendere `fucina` pubblico.** Non contiene segreti (i token sono nei secret di GitHub), e la UI è parte della fucina, non un progetto a sé. |
| OP-202 | Con quale token parla la pagina? Il `FUCINA_PAT` è limitato a `fucina-lab`. | Un token fine-grained dedicato, `fucina-ui`, sui repo da mostrare: Issues e Pull requests in lettura e scrittura, Actions in lettura. |
| OP-203 | Identità visiva | La stessa della pagina "Officina Agenti": è la fucina, ha già una faccia. |
| OP-204 | Finestra delle "Fatte" | 14 giorni |
| OP-205 | Adottare i comandi di Spec Kit (`specify init`) nel repo, ora che c'è una seconda spec? | Sì, come issue separata dopo la v1 del Registro: il formato è già quello, mancano solo i comandi. |
