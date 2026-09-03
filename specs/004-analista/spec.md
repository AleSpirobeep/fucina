# Specifica 004 — L'analista: da un'idea a una coda di task

**Cartella**: `specs/004-analista` · **Creata**: 3 settembre 2026 · **Stato**: pronta per il piano

**Input**: «Voglio un agente che mi aiuti a definire la mia idea tramite GitHub Spec Kit. Io ho
un'idea e questo agente deve costruire tutte le pagine, le informazioni e le specifiche che
serviranno poi alla fucina per sviluppare l'idea. Se le informazioni che do non sono complete,
o ci sono buchi, o servono altri dettagli, si deve fermare e chiedermi chiarimenti. Finché non
è tutto pronto non deve far partire la fucina.» — Alessio, 3 settembre 2026.

## Il buco che questa spec chiude

La fucina ha due ruoli: `dev-agent` scrive il codice a partire da una issue, `pm-agent`
giudica la PR e la fonde. A monte manca il terzo: qualcuno deve trasformare un'idea in
specifica, piano, task e issue. Finora quel qualcuno è Alessio, a mano, lanciando i comandi di
Spec Kit uno per uno e decidendo da sé quando la spec è abbastanza matura da mandarla in coda.

Questa spec dà a quel lavoro un ruolo — l'**analista** — e un cancello: nessun task entra in
coda finché la specifica non regge una verifica meccanica e Alessio non dice sì.

## Chiarimenti

### Sessione 2026-09-03

- D: Dove vive l'analista e come fa le domande? → R: Skill locale di Claude Code, invocata
  dal PC nel repo di destinazione. La conversazione è immediata e non costa nulla quando non
  la si usa. Un analista che chiede via commenti su una issue è rinviato: paga un run e un
  turno di modello per ogni domanda.
- D: Fin dove arriva prima di fermarsi? → R: Fino alle issue `in-coda` pronte (spec →
  chiarimenti → piano → task → issue). L'accensione del PM resta un gesto di Alessio
  (`scripts/pm.ps1 avvia`), come vuole P4.
- D: Su quale repo lavora? → R: Su un repo esistente e già preparato con `init.sh`. L'idea
  diventa una nuova cartella `specs/NNN-.../` in quel repo. Creare repo, secret e protezioni
  resta fuori: `init.sh` li lascia esplicitamente ad Alessio.
- D: Cosa impedisce la partenza della fucina? → R: Due cose in serie. Prima una verifica
  meccanica (nessun buco dichiarato, ogni requisito verificabile, ogni requisito coperto da un
  task, il repo pronto a eseguire i test); poi la conferma esplicita di Alessio sul riepilogo.

## Scenari d'uso *(obbligatorio)*

### Scenario 1 — Da un'idea di due righe a una coda di task (Priorità: P1)

Alessio invoca l'analista nel repo e descrive l'idea come gli viene. L'analista non comincia a
scrivere: prima chiede. Domande chiuse, con le opzioni che vede e la conseguenza di ciascuna,
poche per volta, in ordine di impatto. Ogni risposta finisce, come coppia domanda/risposta,
nella sezione «Chiarimenti» della specifica. Quando non ha più domande, produce i documenti —
`spec.md`, `plan.md`, i contratti, `tasks.md`, la checklist dei requisiti — e li porta su
`main` con una PR, come qualunque altra modifica al repo (P1). A spec fusa, crea le issue dei
task con `in-coda` e dice ad Alessio l'unica cosa che resta da fare: accendere il PM.

**Perché P1**: è l'intera ragione della spec. Oggi questo lavoro è manuale e la sua qualità
dipende da quanto Alessio ha voglia di essere pignolo la sera in cui scrive la spec.

**Verifica indipendente**: partire da una frase («voglio un pulsante Avvia/Ferma nel Registro»)
e arrivare, senza toccare un editor, a una cartella `specs/NNN-*/` completa su `main` e a
issue `in-coda` con titoli `T001: …`, ciascuna con criteri di accettazione verificabili.

**Scenari di accettazione**:

1. **Dato** un repo preparato e un'idea descritta in linguaggio naturale, **quando** Alessio
   invoca l'analista, **allora** l'analista fa domande prima di scrivere qualunque file.
2. **Dato** un giro di domande a cui Alessio ha risposto, **quando** l'analista scrive la
   specifica, **allora** ogni risposta compare nella sezione «Chiarimenti» come coppia D/R
   datata, e nessuna risposta viene riformulata in modo da cambiarne il senso.
3. **Dato** che l'analista non ha più domande e la verifica del cancello passa, **quando**
   Alessio conferma, **allora** i documenti vengono commessi su un branch e una PR viene
   aperta, con il riepilogo nel corpo.
4. **Dato** la PR della spec fusa su `main`, **quando** Alessio invoca la consegna, **allora**
   esiste una issue `in-coda` per ogni task di `tasks.md`, con titolo `T<NNN>: …`, corpo con
   i criteri di accettazione e il rimando ai requisiti coperti.

---

### Scenario 2 — Si ferma sui buchi, non li riempie (Priorità: P1)

Alessio descrive l'idea saltando metà delle cose: non dice chi la userà, non dice cosa succede
quando l'operazione fallisce, non dice come si capisce che ha funzionato. L'analista non
inventa nessuna delle tre. Chiede. Se Alessio risponde «non lo so», l'analista non sceglie al
posto suo: marca il punto come aperto e propone due strade — rinviare quel requisito a una spec
successiva, oppure restringere l'ambito finché la domanda non serve più. Finché resta anche un
solo punto aperto, la specifica non è consegnabile.

**Perché P1**: è la richiesta esplicita di Alessio, ed è P5 applicato a monte. Una spec che
riempie i buchi con congetture produce dodici task che implementano la congettura.

**Verifica indipendente**: dare all'analista un'idea volutamente incompleta e non rispondere a
una domanda. La specifica prodotta contiene il punto aperto marcato, il cancello risulta rosso
e nessuna issue viene creata.

**Scenari di accettazione**:

1. **Dato** un'idea che non dice cosa deve succedere in un caso limite, **quando** l'analista
   la analizza, **allora** formula una domanda chiusa su quel caso invece di sceglierne uno.
2. **Dato** una domanda a cui Alessio risponde «non lo so» o non risponde, **quando**
   l'analista prosegue, **allora** il punto resta marcato come aperto nella specifica e
   l'analista propone di rinviarlo o di restringere l'ambito.
3. **Dato** una specifica con almeno un punto aperto, **quando** Alessio chiede di consegnare,
   **allora** l'analista rifiuta, elenca i punti aperti uno per uno e non crea alcuna issue.
4. **Dato** un requisito senza una verifica che una macchina o Alessio possano eseguire,
   **quando** l'analista rilegge la specifica, **allora** lo tratta come un punto aperto (P2).

---

### Scenario 3 — Il cancello: niente parte finché non è pronto (Priorità: P1)

Tra l'analisi e la fucina c'è una verifica che non dipende dal giudizio del modello. È uno
script: legge i documenti prodotti e restituisce l'elenco dei problemi bloccanti. Se l'elenco
non è vuoto, non si va avanti — nemmeno se il modello è convinto che vada bene. Se è vuoto,
l'analista mostra ad Alessio un riepilogo (quanti requisiti, quanti task, quali decisioni ha
preso da solo, quali ADR ha scritto) e aspetta un sì. Il PM non lo accende mai lui.

**Perché P1**: è la seconda metà della richiesta («finché non è tutto pronto non deve far
partire la fucina») ed è P9: ciò che si può decidere da fatti osservabili non lo decide
l'agente.

**Verifica indipendente**: rendere non verificabile un requisito in una spec altrimenti
completa e rieseguire la verifica: risulta rossa, nomina il requisito, e la consegna è
rifiutata.

**Scenari di accettazione**:

1. **Dato** una cartella di spec completa, **quando** si esegue la verifica, **allora** esce
   con esito positivo e un riepilogo dei conteggi.
2. **Dato** una cartella con un requisito privo di verifica, o un task che non rimanda ad
   alcun requisito, o un requisito che nessun task copre, **quando** si esegue la verifica,
   **allora** esce con esito negativo e un problema per ciascuno, con file e riga.
3. **Dato** una verifica verde, **quando** l'analista chiede conferma, **allora** nessuna
   issue esiste ancora e nessun workflow è stato acceso.
4. **Dato** una verifica verde e la conferma di Alessio, **quando** la consegna avviene,
   **allora** le issue vengono create e il PM resta spento: l'analista si limita a stampare
   il comando per accenderlo.

---

### Scenario 4 — Riprendere un'analisi lasciata a metà (Priorità: P2)

Alessio comincia un'analisi la sera, risponde a sei domande e chiude il PC. Due giorni dopo
riprende. L'analista rilegge i documenti già scritti, ricalcola cosa manca e riparte dalla
prima domanda ancora aperta, senza rifare quelle già risposte e senza chiedere ad Alessio di
ripetere l'idea.

**Perché P2**: senza ripresa, un'analisi lunga va fatta in una sola seduta, e P1 (il repo è
l'unica fonte di verità) resterebbe sulla carta.

**Verifica indipendente**: interrompere una sessione dopo alcune domande, invocare di nuovo
l'analista sulla stessa cartella e osservare che riprende dai punti aperti.

**Scenari di accettazione**:

1. **Dato** una cartella di spec già iniziata, **quando** l'analista viene invocato di nuovo,
   **allora** non sovrascrive le sezioni già compilate e riparte dai punti aperti.
2. **Dato** una sessione interrotta, **quando** la si riprende, **allora** tutto ciò che
   serve a riprendere sta nei file del repo: nessuno stato altrove.
3. **Dato** una risposta che contraddice una risposta precedente, **quando** l'analista se ne
   accorge, **allora** lo dice, cita la coppia D/R precedente e chiede quale delle due vale.

---

### Scenario 5 — Ogni decisione lascia una traccia (Priorità: P2)

Durante l'analisi l'analista prende delle piccole decisioni che Alessio non ha preso: come
chiamare una cosa, dove metterla, in che ordine fare i task. Ognuna finisce da qualche parte
leggibile: le scelte di merito in un ADR, le risposte di Alessio nella sezione «Chiarimenti».
Chi legge la spec sei mesi dopo sa perché è fatta così.

**Perché P2**: è P5. Ed è ciò che permette al PM, più avanti, di rispondere alle domande
dell'agente sviluppatore citando una fonte invece di inventare.

**Verifica indipendente**: dopo un'analisi, ogni scelta non riconducibile a una risposta di
Alessio o a un ADR esistente ha un ADR nuovo con `decision-makers: [analista]`.

**Scenari di accettazione**:

1. **Dato** una decisione che la specifica non copriva, **quando** l'analista la prende,
   **allora** scrive un ADR in `docs/decisions/`, formato MADR, `decision-makers: [analista]`,
   e lo cita nel riepilogo della consegna.
2. **Dato** una decisione che tocca sicurezza, token, permessi o costi, **quando** l'analista
   la incontra, **allora** non decide: chiede ad Alessio (P5).
3. **Dato** un ADR accettato che contraddice una scelta in discussione, **quando** l'analista
   se ne accorge, **allora** lo cita e non lo contraddice senza che Alessio lo superi
   esplicitamente.

---

### Casi limite

- **Alessio non sa rispondere**: il punto resta aperto; l'analista propone di rinviarlo a una
  spec successiva o di restringere l'ambito, e non consegna finché una delle due è scelta.
- **L'idea è troppo grande per una spec sola**: l'analista lo dice e propone una divisione in
  più spec, con l'ordine e la dipendenza fra loro; è Alessio a scegliere, non lui.
- **Il repo non è preparato** (`.fucina.yml` assente, label mancanti): l'analista si ferma
  prima di scrivere qualsiasi cosa e dice di eseguire `init.sh`.
- **`test_command` è vuoto in `.fucina.yml`**: il cancello è rosso. Senza comando di test la
  CI non può fare da arbitro (P3) e l'agente sviluppatore aprirebbe PR non verificabili.
- **La cartella `specs/NNN-*` esiste già**: si riprende, non si sovrascrive (Scenario 4).
- **Due analisi in parallelo prendono lo stesso numero**: il numero si sceglie leggendo
  `specs/` al momento della creazione; se è occupato, si prende il primo libero.
- **Un task tocca `.github/workflows/`**: il cancello lo segnala. L'agente sviluppatore non
  può scrivere quel percorso (lezione della spec 003): il file va in `template/` e lo installa
  Alessio. Il task va riscritto così, oppure marcato esplicitamente come manuale.
- **Un task tocca un percorso protetto** (`percorsi_protetti` in `.fucina.yml`): il cancello
  lo segnala; il task deve dire esplicitamente che serve la label `allow-test-changes`.
- **La consegna viene invocata due volte**: è idempotente, non duplica le issue già create.
- **La consegna viene invocata prima che la PR della spec sia fusa**: viene rifiutata; le
  issue devono puntare a una spec che sta su `main`, perché è lì che il PM e l'agente
  sviluppatore la cercano.
- **Il PM è già acceso e sta lavorando un'altra spec**: l'analista lo dice nel riepilogo. Le
  issue nuove entrano in coda dopo quelle esistenti; il PM le prende al suo turno.
- **La costituzione manca nel repo di destinazione**: l'analista lo segnala e propone di
  crearla prima di procedere; non la scrive di sua iniziativa (i principi sono di Alessio).

## Requisiti *(obbligatorio)*

Numerazione: REQ-3xx. Ogni requisito ha una verifica che una macchina o Alessio può eseguire
in meno di dieci minuti.

### La conversazione

- **REQ-301** — L'analista è una skill di Claude Code invocabile dal PC nel repo di
  destinazione. Non esiste alcun workflow, alcun processo in ascolto e alcun costo quando non
  è invocata.
  *Verifica:* con la skill installata e non invocata, per un'ora non compare alcuna esecuzione
  nel repo e nessun token è consumato.

- **REQ-302** — Prima di scrivere qualunque file, l'analista fa almeno un giro di domande su
  ciò che l'idea non dice.
  *Verifica:* invocarla con un'idea di una riga: il primo output è un elenco di domande, e
  `git status` non mostra alcun file nuovo.

- **REQ-303** — Ogni domanda è chiusa: ha un elenco finito di opzioni e, per ciascuna, la
  conseguenza. Le domande sono al più cinque per giro, ordinate per impatto sul lavoro che
  ne seguirà.
  *Verifica:* leggere un giro di domande: nessuna è aperta («cosa ne pensi?»), ciascuna ha
  almeno due opzioni con la relativa conseguenza, il giro ne contiene al più cinque.

- **REQ-304** — Ogni domanda posta e la risposta ricevuta finiscono in `spec.md`, sezione
  «Chiarimenti», sotto una sessione datata, come coppia D/R.
  *Verifica:* contare le domande poste in una sessione e le coppie D/R nella sezione: sono
  tante quante.

- **REQ-305** — L'analista non inventa un requisito, un vincolo o un criterio che Alessio non
  ha dato e che nessun documento del repo copre. Se serve e non c'è, o chiede, o lascia il
  punto marcato come aperto.
  *Verifica:* dare un'idea priva di criteri di successo e non rispondere: la spec prodotta
  contiene il marcatore di punto aperto, non un criterio inventato.

- **REQ-306** — Se una risposta di Alessio contraddice una risposta precedente o un ADR
  accettato, l'analista lo dice, cita la fonte, e chiede quale vale. Non sceglie da solo.
  *Verifica:* rispondere a due domande in modo incompatibile: l'analista lo segnala prima di
  proseguire.

- **REQ-307** — L'analista si ferma e chiede — non decide — quando la decisione tocca
  sicurezza, token, permessi, costi, oppure cambia un principio della costituzione.
  *Verifica:* porre un'idea che richiede un nuovo secret: l'analista chiede invece di
  scegliere.

### I documenti prodotti

- **REQ-310** — L'analista produce i documenti invocando i comandi di Spec Kit già installati
  (`speckit-specify`, `speckit-clarify`, `speckit-plan`, `speckit-tasks`, `speckit-checklist`,
  `speckit-analyze`, `speckit-taskstoissues`). Non riscrive né duplica ciò che quei comandi
  già fanno (P6).
  *Verifica:* nel ruolo non compare alcun template di spec, piano o task proprio: solo
  l'ordine in cui invocare i comandi e i controlli aggiuntivi della fucina.

- **REQ-311** — I documenti finiscono in `specs/<NNN>-<nome-breve>/`, con `NNN` il primo
  numero libero a tre cifre e `<nome-breve>` di due-quattro parole in italiano.
  *Verifica:* con `001`, `002`, `003`, `004` presenti, una nuova analisi crea `005-…`.

- **REQ-312** — La cartella contiene almeno: `spec.md` (con Input, Chiarimenti, Scenari d'uso,
  Casi limite, Requisiti, Criteri di successo, Assunzioni), `plan.md`, `tasks.md`, e
  `checklists/requirements.md`. I contratti in `contracts/` sono obbligatori quando la spec
  introduce un formato di file o un'interfaccia fra due componenti.
  *Verifica:* il cancello (REQ-320) elenca come bloccante ogni file obbligatorio mancante.

- **REQ-313** — Ogni requisito ha un identificativo `REQ-<NNN>xx` coerente con il numero
  della spec e una riga di verifica eseguibile (P2).
  *Verifica:* il cancello segnala ogni requisito senza verifica.

- **REQ-314** — Ogni task in `tasks.md` ha un identificativo `T<NNN>` univoco e progressivo,
  i file che tocca, criteri di accettazione, e il rimando ad almeno un requisito.
  *Verifica:* il cancello segnala i task senza identificativo, senza criteri o senza rimando.

- **REQ-315** — Le decisioni che l'analista prende da solo lasciano un ADR in
  `docs/decisions/`, formato MADR, `decision-makers: [analista]`, `status: accepted`.
  *Verifica:* dopo un'analisi con almeno una decisione, l'ADR esiste ed è citato nel
  riepilogo.

- **REQ-316** — I documenti arrivano su `main` con una PR, mai con un commit diretto (P1).
  Il corpo della PR contiene il riepilogo mostrato ad Alessio.
  *Verifica:* dopo la conferma, esiste una PR con i soli file di `specs/<NNN>-*/` e degli ADR,
  e `main` non è stato toccato direttamente.

### Il cancello

- **REQ-320** — Esiste una verifica eseguibile che, data una cartella di spec, restituisce
  l'elenco dei problemi bloccanti e un esito. È una funzione pura, testata, indipendente dal
  modello (P9).
  *Verifica:* eseguirla su una cartella completa (esito positivo) e su fixture con un difetto
  ciascuna (esito negativo, con il problema nominato).

- **REQ-321** — Sono bloccanti almeno: un marcatore di punto aperto in un documento; un file
  obbligatorio mancante; un requisito senza verifica; un task senza identificativo, criteri o
  rimando a un requisito; un requisito che nessun task copre; un task che rimanda a un
  requisito inesistente; identificativi di task duplicati; `test_command` vuoto o assente in
  `.fucina.yml`; un task che tocca `.github/workflows/` senza essere marcato come manuale; un
  task che tocca un percorso protetto senza dichiarare che serve `allow-test-changes`.
  *Verifica:* una fixture per ciascun caso, ciascuna con esito negativo e il problema atteso.

- **REQ-322** — Nessuna issue viene creata e nessun workflow viene acceso finché la verifica
  non è positiva.
  *Verifica:* con una verifica negativa, chiedere la consegna: viene rifiutata, e `gh issue
  list` non mostra issue nuove.

- **REQ-323** — Verifica positiva non basta: l'analista mostra un riepilogo — numero di
  requisiti, numero di task, elenco dei task con i file che toccano, decisioni prese e ADR
  scritti, punti rinviati — e attende una conferma esplicita di Alessio.
  *Verifica:* con la verifica verde e senza risposta di Alessio, nessuna issue viene creata.

- **REQ-324** — La verifica è eseguibile anche da sola, fuori dalla conversazione, con un
  comando che stampa i problemi ed esce con codice diverso da zero se ce ne sono.
  *Verifica:* eseguire il comando su una cartella difettosa: stampa i problemi, esce 1.

### La consegna alla fucina

- **REQ-330** — La consegna crea una issue per ogni task di `tasks.md`, con label `in-coda`,
  titolo `T<NNN>: <titolo del task>`, corpo con i criteri di accettazione, i file da toccare e
  i requisiti coperti.
  *Verifica:* dopo la consegna di una spec di cinque task, cinque issue `in-coda` con i
  titoli attesi.

- **REQ-331** — La consegna rifiuta di procedere se la cartella della spec non è su `main`.
  *Verifica:* invocarla con la PR della spec ancora aperta: viene rifiutata con il motivo.

- **REQ-332** — La consegna è idempotente: rieseguita, non crea una seconda issue per un task
  che ne ha già una aperta o chiusa.
  *Verifica:* eseguirla due volte: il numero di issue non cambia e la seconda esecuzione lo
  dice.

- **REQ-333** — La consegna non accende il PM e non applica `ready-for-dev` a nessuna issue.
  Termina stampando il comando che Alessio deve dare (`scripts/pm.ps1 avvia`).
  *Verifica:* dopo la consegna, il workflow del PM risulta disabilitato e nessuna issue ha
  `ready-for-dev`.

- **REQ-334** — Se il PM è già acceso, la consegna lo dice nel riepilogo e avverte che i task
  nuovi partiranno dopo quelli già in coda.
  *Verifica:* con il PM acceso, il riepilogo della consegna contiene l'avviso.

### Installazione e configurazione

- **REQ-340** — `init` installa il ruolo `analista` e la verifica del cancello nel repo di
  destinazione, allo stesso modo degli altri due ruoli; è idempotente (P8).
  *Verifica:* eseguire `init` due volte su un repo pulito: la seconda non crea né sovrascrive
  nulla; la skill è invocabile.

- **REQ-341** — La configurazione dell'analista sta in `.fucina.yml` sotto la chiave
  `analista`: modello, tetto di turni, tetto di spesa, numero massimo di domande per giro,
  strumenti permessi. Ha default sensati se assente (P7).
  *Verifica:* rimuovere la chiave: l'analista funziona con i default; cambiare il numero
  massimo di domande: i giri lo rispettano.

- **REQ-342** — Se nel repo manca `.specify/` o `.fucina.yml`, l'analista si ferma prima di
  scrivere qualsiasi file e dice cosa eseguire.
  *Verifica:* invocarla in un repo non preparato: si ferma con il messaggio.

### Vincoli

- **REQ-350** — L'analista non scrive codice e non tocca file fuori da `specs/`,
  `docs/decisions/` e `.fucina/`. In particolare non tocca `ui/`, `template/`, `plugin/`,
  `init.sh`, `.fucina.yml`, `.github/workflows/`, `.specify/`.
  *Verifica:* dopo un'analisi completa, `git diff --name-only` mostra solo percorsi ammessi.

- **REQ-351** — L'analista non abilita, disabilita o esegue workflow, non applica
  `ready-for-dev`, non fonde e non chiude PR. L'unica scrittura su GitHub è la creazione delle
  issue della consegna e l'apertura della PR della spec.
  *Verifica:* gli strumenti concessi al ruolo non includono i comandi corrispondenti.

- **REQ-352** — L'analista non crea repository, non imposta secret e non modifica le
  protezioni del branch: restano gesti di Alessio, come già in `init.sh`.
  *Verifica:* il ruolo non dispone degli strumenti relativi.

- **REQ-353** — Nessun token compare in un file o in un log prodotto dall'analista.
  *Verifica:* cercare i nomi dei secret nei file prodotti: compaiono al più come nomi, mai
  come valori.

### Entità

- **Idea**: il testo iniziale di Alessio, conservato integralmente come «Input» in `spec.md`.
- **Punto aperto**: una informazione mancante che l'analista non può inventare. Ha una
  domanda, un luogo nel documento, e uno stato: risposto, rinviato, o ancora aperto.
- **Cancello**: l'esito della verifica su una cartella di spec. Esito (positivo/negativo) e
  elenco di problemi, ciascuno con file, riga e cosa serve.
- **Riepilogo**: ciò che Alessio legge prima di confermare — conteggi, elenco dei task,
  decisioni prese, ADR scritti, punti rinviati.
- **Consegna**: la creazione delle issue `in-coda` da `tasks.md`, e il messaggio finale con
  il comando per accendere il PM.

## Criteri di successo *(obbligatorio)*

- **SC-301** — Da un'idea descritta in due righe si arriva a una coda di task pronta senza
  aprire un editor: l'unica cosa che Alessio scrive sono le risposte alle domande e la
  conferma finale.
- **SC-302** — Su un'idea volutamente incompleta, l'analista non produce mai un requisito
  inventato: ogni buco è o una domanda, o un punto rinviato dichiarato.
- **SC-303** — Nessuna issue e nessuna esecuzione della fucina esistono prima che la verifica
  sia verde e Alessio abbia confermato.
- **SC-304** — Chi legge la spec sei mesi dopo trova, per ogni scelta non ovvia, o una coppia
  D/R nella sezione «Chiarimenti», o un ADR.
- **SC-305** — I task consegnati sono lavorabili dall'agente sviluppatore senza ulteriori
  chiarimenti nella maggior parte dei casi: si misura contando quante issue finiscono in
  `needs-human` per una domanda che l'analista avrebbe potuto chiudere.
- **SC-306** — L'analista costa zero quando non è invocato, e il costo di un'analisi è
  proporzionale al numero di giri di domande, non alla dimensione del repo.

## Assunzioni

- Il repo di destinazione è già preparato con `init.sh`: label, workflow, `.fucina.yml`, i
  ruoli `dev-agent` e `pm-agent`, e la struttura `.specify/` di Spec Kit.
- I comandi di Spec Kit installati nel repo sono quelli attuali. Se cambiano a monte, cambia
  l'ordine di invocazione nel ruolo, non i documenti prodotti (mitigazione già registrata in
  `docs/decisions/2026-08-30-1000-estendere-spec-kit.md`: pinnare la versione).
- La conversazione avviene in Claude Code sul PC di Alessio, con gli stessi permessi che ha
  già oggi: leggere il repo, scrivere file, usare `gh` e `git`.
- La costituzione del repo di destinazione esiste ed è la fonte dei principi che l'analista
  non può contraddire. Se manca, l'analista lo segnala (caso limite) ma non la scrive.
- Il numero di spec e la loro nomenclatura restano quelli di Spec Kit: `specs/<NNN>-<nome>/`.
- L'analista lavora una spec alla volta. Analisi in parallelo su idee diverse sono possibili
  ma non coordinate fra loro: il numero si prende al momento della creazione della cartella.
- Un analista che dialoga via commenti su una issue, utilizzabile dal telefono, è rinviato a
  una spec successiva: costerebbe un run e un turno di modello per domanda.
