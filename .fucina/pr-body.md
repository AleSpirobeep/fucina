## Cosa ho fatto

Il comando «Ferma» del contratto (`contracts/comandi-pm.md`, S1 poi L3): dalla riga del PM che
T003 già mostra, un click disabilita `pm-agent.yml` e subito dopo elenca le esecuzioni ancora in
corso, dicendo che finiranno il proprio ciclo.

- `ui/lib.js`: `urlFermaPm(repo)` (S1, `PUT .../disable`), `urlEsecuzioniInCorsoPm(repo)` (L3,
  `GET .../runs?status=in_progress`), `riduciEsecuzioniInCorsoPm(runs)` che riduce ogni run a
  `{ titolo, url }`, e `testoEsecuzioniInCorsoPm(esecuzioni)` che dà la frase "Nessuna esecuzione
  del PM in corso." sull'elenco vuoto o "Finiranno il proprio ciclo:" altrimenti.
- `ui/github.js`: `esecuzioniInCorsoPm(token, repo)` (L3 da sola, riusata anche da `fermaPm`) e
  `fermaPm(token, repo)`, che fa la `PUT` di S1 e solo dopo la `GET` di L3, nell'ordine imposto dal
  contratto — la lettura che racconta l'effetto della scrittura viene sempre dopo.
- `ui/index.html`:
  - `costruisciRigaPm` ora riceve anche `repo` e collega un gestore di click **solo** al pulsante
    «Ferma» (quello di «Avvia» resta senza gestore: è T005, non ancora in coda).
  - `gestisciFermaPm(repo, pulsante)`: disabilita il pulsante in modo sincrono, prima di ogni
    `await` — così un secondo click nello stesso giro di eventi non trova più un pulsante attivo e
    non produce una seconda richiesta (REQ-417). A successo, salva l'elenco delle esecuzioni in
    `statoEsecuzioniFermaPm` e richiama `caricaPm()`, che rilegge lo stato vero da GitHub e
    ridisegna la riga come «spento» senza attendere il ciclo dei sessanta secondi (REQ-416). A
    fallimento, marca la sezione come non aggiornata con `aggiornaStatoRepo` e ridisegna: il
    pulsante torna a comparire, riprovabile.
  - `costruisciElencoEsecuzioniFerma(esecuzioni)` mostra la frase di `testoEsecuzioniInCorsoPm` e,
    se l'elenco non è vuoto, i link delle esecuzioni.

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 234 test, tutti verdi (12 nuovi
in `ui/ferma-pm.test.js`, con fixture `ui/fixtures/run-pm-in-corso.json`): le due URL di S1 e L3,
la riduzione delle run in corso, il testo con e senza esecuzioni, `esecuzioniInCorsoPm` da sola, e
`fermaPm` con l'ordine delle due chiamate verificato registrando `url` e `method` di ogni `fetch`
finto — compreso il caso in cui la `PUT` fallisce e la `GET` di L3 non parte. Sintassi dello script
di `index.html` verificata estraendolo e con `node --check`. Verifica manuale sul codice per il
resto: il pulsante disabilita se stesso prima di qualunque `await`, quindi un doppio click
sincrono non può produrre due richieste; `fermaPm` chiama solo l'endpoint di `pm-agent.yml`, mai
`dev-agent.yml`; tutte le chiamate passano da `richiesta()` verso `API_BASE`
(`https://api.github.com`), nessun dominio nuovo. Non ho un ambiente con un token
`Actions: read and write` per una prova end-to-end contro GitHub vero: T008 (manuale, a cura di
Alessio) non è ancora fatto.

## Decisioni

Nessun ADR: il contratto copriva già le due chiamate, il loro ordine e i tre esiti da distinguere
in T007. La sola scelta lasciata aperta — le due frasi esatte per l'elenco delle esecuzioni in
corso — è testo dell'interfaccia senza alternative in gioco, della stessa natura delle frasi già
scelte senza ADR in T001–T003 (`testoStatoPm`, `testoInCodaPm`).

## Non fatto

Il pulsante «Avvia» resta senza gestore (T005, non ancora in coda). I messaggi d'errore specifici
del contratto — 403 che nomina il permesso `Actions: read and write`, 404 che dice che il workflow
non è installato, 401 che rimanda a «Configurazione» — sono T007: qui un fallimento di «Ferma»
mostra il messaggio generico già usato dalla pagina (`messaggioErroreHttp`/`ErroreGitHub`).
L'avviso "lavoro in attesa" di REQ-420/421 è T006. Non ho potuto verificare contro l'API vera di
GitHub (serve il token con `Actions: read and write` di T008): la verifica sopra è sulla
suite automatica e sulla lettura del codice.

## Fatto in più

Nulla: solo i file elencati dalla issue.

Closes #75
