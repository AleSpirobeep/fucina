Aggiunge il client per l'API di GitHub richiesto dalla T5: funzioni che leggono issue
aperte e chiuse di recente, PR aperte, commenti di una issue, stato combinato dei check
di una PR e run del workflow `dev-agent` (REQ-102, REQ-122 parte).

- **Parte pura, in `ui/lib.js`**: costruzione delle URL (`urlIssueRepo`, `urlPrRepo`,
  `urlCommentiIssue`, `urlStatoCheckPr`, `urlRunWorkflow`), interpretazione dello stato
  combinato dei check (`interpretaStatoCheck`: `success` → verde, `failure`/`error` →
  rosso, tutto il resto → in attesa), interpretazione degli errori HTTP
  (`interpretaErroreHttp`: 401 → "Token non valido o scaduto.", 404 → nomina il repo non
  raggiungibile, altrimenti un messaggio generico col codice), calcolo di una data ISO a
  N giorni da oggi (`dataIsoGiorniFa`) e la classe `ErroreGitHub`.
- **Funzioni sottili, nel nuovo file `ui/github.js`**: `issueAperte`,
  `issueChiuseDiRecente`, `prAperte`, `commentiIssue`, `statoCheckPr`, `runWorkflow`.
  Condividono un'unica funzione interna `richiediGitHub` che manda l'header
  `Authorization: Bearer <token>` solo verso `api.github.com`, rifiuta subito se il
  token manca, e lancia `ErroreGitHub` su ogni risposta non `ok` — mai un fallimento
  silenzioso.

Verificato con: `node --test "ui/**/*.test.js"` — 49 test verdi, 24 nuovi in
`ui/github.test.js` (parte pura: URL, interpretazione degli stati e degli errori, date;
parte fetch: `fetch` globale sostituito con un finto in ogni test, nessuna chiamata di
rete vera, verificati URL, header `Authorization`, propagazione del corpo della
risposta, e gli errori su token mancante, 401 e 404).

Closes #17.

## Decisioni
Un ADR: `docs/decisions/2026-09-03-1130-client-github-endpoint-e-struttura.md`. Copre
le scelte non coperte dalla spec: due chiamate separate per issue aperte/chiuse di
recente invece di una con `state=all`, l'endpoint "Combined status" per i check invece
dei check-runs singoli, e la divisione tra `lib.js` (pura) e `ui/github.js` (fetch) —
quest'ultima esplicitamente permessa dal testo della issue.

## Non fatto
`ui/github.js` non è ancora importato da `index.html`: la issue #17 chiedeva il client,
non il suo collegamento alla dashboard. Quel collegamento è compito dei task successivi
(T6 "Aspettano te", T7 "Avanzamento", T8 "Agenti attivi" in
`specs/002-registro/tasks.md`), che dipendono esplicitamente da questa T5.

## Fatto in più
Nulla: solo `ui/lib.js` (nuove funzioni pure, in coda al file), il nuovo `ui/github.js`,
il nuovo `ui/github.test.js` e l'ADR sopra citato.
