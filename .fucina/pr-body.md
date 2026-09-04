## Cosa ho fatto

Mostrata la riga del PM nella sezione che il Registro già costruisce per ogni repo (quella
di `costruisciTabellaRepo`, la stessa tabella di REQ-120), usando le letture di T001
(`statoPm`) e T002 (`contaInCoda`, `ultimaEsecuzionePm`).

- `ui/lib.js`: le funzioni pure che producono i testi della riga —
  `testoStatoPm(stato)`, `pulsantePm(stato)` (mai due pulsanti insieme, `null` per
  `non-installato`), `testoInCodaPm(numero)`, `testoUltimaEsecuzionePm(ultimaEsecuzione,
  adesso)` (esito e tempo trascorso via `formattaTempoTrascorso`, già esistente),
  `messaggioStatoPmNonAggiornato(errore)` e `rigaPm(stato, inCoda, ultimaEsecuzione,
  adesso)` che le combina in un'unica vista, azzerando ultima esecuzione e pulsante quando
  lo stato è `non-installato`.
- `ui/index.html`:
  - `caricaPm()`, nuova funzione che per ogni repo legge `statoPm` (L1) e, solo se
    installato, `ultimaEsecuzionePm` (L2), più `issueAperte` per calcolare `contaInCoda`
    sui dati appena scaricati. Lo stato vive in `statoPmRepo`, la stessa forma
    (`creaStatoSezione`/`aggiornaStatoRepo`) già usata dalle altre sezioni: un fallimento
    marca `nonAggiornato` senza cancellare l'ultimo dato buono.
  - `costruisciRigaPm(pmVoce, adesso)` costruisce il markup della riga dentro la sezione
    del repo prodotta da `costruisciTabellaRepo`, dopo la tabella dei sei conteggi: non ne
    ripete nessuno. A lettura fallita mostra solo l'avviso "Stato del PM non aggiornato:
    …", lasciando la tabella (dati di un'altra lettura, indipendente) visibile.
  - `caricaPm()` è entrata nel `Promise.all` di `aggiorna()` e nel banner degli errori,
    come le altre tre sezioni.

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 220 test, tutti verdi
(13 nuovi in `ui/riga-pm.test.js`). Sintassi dello script di `index.html` verificata con
`node --check` dopo averlo estratto. Verifica manuale dei quattro criteri di accettazione
seguendo il codice: nessuno dei sei conteggi ripetuto; `pulsantePm` mai restituisce
entrambi i valori; `costruisciRigaPm` mostra l'avviso di dato non aggiornato senza
nascondere la tabella; nessun `package.json` o `node_modules` nel repo.

## Decisioni

Nessun ADR: il contratto (`contracts/comandi-pm.md`) e la spec 005 coprivano già la forma
dei tre stati e il vincolo di un solo pulsante. L'unica scelta non scritta nel contratto —
far leggere a `caricaPm()` anche `issueAperte` in proprio, invece di condividere l'array
già scaricato da `caricaAvanzamento` — replica lo stile già in uso in `caricaAspettanoTe`
(ogni sezione fa le proprie chiamate in autonomia); non introduce un endpoint nuovo, quindi
resta dentro REQ-402.

## Non fatto

Il pulsante «Ferma»/«Avvia» non ha ancora un gestore di click: mostrarlo era lo scopo di
T003, comandarlo è T004 (Ferma) e T005 (Avvia), non ancora in coda. L'avviso "lavoro in
attesa" di REQ-420/421 è T006. I messaggi d'errore specifici (403/404/401) del contratto
sono T007.

## Fatto in più

Nulla: solo i tre file elencati nella issue sono stati toccati.
