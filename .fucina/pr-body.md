## Cosa ho fatto

Mostrata la riga del PM nella sezione che il Registro già costruisce per ogni repo (quella di
`costruisciTabellaRepo`, la stessa tabella dei sei conteggi di REQ-120), usando le letture di
T001 (`statoPm`) e T002 (`contaInCoda`, `ultimaEsecuzionePm`).

- `ui/lib.js`: le funzioni pure che producono i testi della riga — `testoStatoPm(stato)`,
  `pulsantePm(stato)` (un solo valore o `null`, mai due pulsanti insieme), `testoInCodaPm(numero)`,
  `testoUltimaEsecuzionePm(ultimaEsecuzione, adesso)` (esito e tempo trascorso via
  `formattaTempoTrascorso`, già esistente), `messaggioStatoPmNonAggiornato(errore)` e
  `rigaPm(stato, inCoda, ultimaEsecuzione, adesso)` che le combina in un'unica vista: con
  `non-installato` azzera pulsante e ultima esecuzione ma non il conteggio `in-coda`, che non
  dipende dall'installazione del PM.
- `ui/index.html`:
  - `caricaPm()`, nuova funzione che per ogni repo legge solo `statoPm` (L1) e, solo se
    installato, `ultimaEsecuzionePm` (L2) — **due chiamate per repo**, come impone
    `plan.md` (Fase 0, scelta 1). Il conteggio `in-coda` **non** viene letto qui: arriva da
    `caricaAvanzamento`, che ha già `issueAperteRepo` scaricato per la tabella di REQ-120, tramite
    `contaInCoda(issueAperteRepo)` portato nei `dati` di `statoAvanzamentoRepo` insieme alla
    classificazione (`{ classificazione, inCoda }`). Nessuna chiamata di lettura in più rispetto
    a oggi.
  - Lo stato del PM vive in `statoPmRepo`, la stessa forma (`creaStatoSezione`/`aggiornaStatoRepo`)
    già usata dalle altre sezioni: un fallimento marca `nonAggiornato` senza cancellare l'ultimo
    dato buono, ed entra nel banner degli errori come le altre tre sezioni.
  - `costruisciRigaPm(inCoda, pmVoce, adesso)` costruisce il markup della riga dentro la sezione
    del repo, dopo la tabella dei sei conteggi: non ne ripete nessuno. A lettura fallita mostra
    l'avviso "Stato del PM non aggiornato: …", lasciando la tabella (dati di un'altra lettura,
    indipendente) visibile. Se lo stato del PM non è ancora arrivato dal primo giro, non
    restituisce alcun elemento (niente riga vuota sotto la tabella).
  - `caricaPm()` è entrata nel `Promise.all` di `aggiorna()`, accanto alle altre tre sezioni.

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 222 test, tutti verdi (15 nuovi
in `ui/riga-pm.test.js`, uno o più per ciascuna delle sei funzioni pure aggiunte). Sintassi dello
script di `index.html` verificata estraendolo e con `node --check`. Verifica manuale dei quattro
criteri di accettazione seguendo il codice: nessuno dei sei conteggi di REQ-120 ripetuto (`in-coda`
non è fra le `COLONNE_AVANZAMENTO`); `pulsantePm` restituisce un solo valore o `null`, mai
entrambi, e con `non-installato` `statoPm` tratta il 404 come stato (nessuna eccezione, quindi
nessun messaggio d'errore); `costruisciRigaPm` mostra l'avviso di dato non aggiornato senza far
sparire la tabella, che è appesa alla sezione da uno stato indipendente; nessun `package.json` o
`node_modules` nel repo.

## Decisioni

Nessun ADR: il contratto (`contracts/comandi-pm.md`) e `plan.md` coprivano già sia la forma dei tre
stati sia il vincolo delle due sole letture per repo — la scelta di dove calcolare `in-coda` era
già scritta in `plan.md`, Fase 0, non da inventare qui.

## Non fatto

Il pulsante «Ferma»/«Avvia» non ha ancora un gestore di click: mostrarlo era lo scopo di T003,
comandarlo è T004 (Ferma) e T005 (Avvia), non ancora in coda. L'avviso "lavoro in attesa" di
REQ-420/421 è T006. I messaggi d'errore specifici (403/404/401) del contratto sono T007.

## Fatto in più

`aggiornaBanner()` in `ui/index.html` include ora anche `statoPmRepo` fra le sezioni controllate,
così un errore nella lettura del PM compare nel banner globale come già succede per le altre tre
sezioni — non richiesto dai criteri di accettazione (che chiedono solo l'avviso nella riga), ma
coerente con il trattamento esistente di ogni altra sezione della pagina.

Closes #74
