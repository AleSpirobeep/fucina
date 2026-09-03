Implementa la T5 della spec 002: un client per l'API di GitHub per il Registro, con le
correzioni chieste dal PM dopo la revisione della PR #31 (tentativo 1, mai fusa).

- **`ui/lib.js`** (parte pura, senza rete): costruzione delle URL per issue aperte,
  issue chiuse di recente, PR aperte, commenti di una issue, check run e run del
  workflow `dev-agent`; interpretazione degli errori HTTP (`messaggioErroreHttp`: 401 →
  "Token non valido o scaduto.", 404 → nomina il repo non raggiungibile); la classe
  `ErroreGitHub` (`codice` + messaggio); `interpretaStatoCheckRuns`, l'aggregazione
  dell'array `check_runs` in "verde"/"rosso"/"in attesa" secondo le regole del PM (nessun
  run o uno non `completed` → in attesa; una conclusione fra `failure`, `timed_out`,
  `cancelled`, `action_required`, `startup_failure` → rosso, che prevale sull'attesa;
  altrimenti verde; i run duplicati sullo stesso commit si aggregano tutti).
- **`ui/github.js`** (nuovo, funzioni sottili): `issueAperte`, `issueChiuseDiRecente`,
  `prAperte`, `commentiIssue`, `statoCheckPr`, `runWorkflow`. Una sola funzione
  `richiesta` centralizza l'invio del token nell'header `Authorization` verso
  `api.github.com`, l'header `Accept: application/vnd.github+json`, e trasforma il token
  mancante o una risposta non `ok` in un `ErroreGitHub` esplicito — mai un fallimento
  silenzioso.
- **`ui/github.test.js`** (nuovo): 27 test — le URL, `messaggioErroreHttp`,
  `interpretaStatoCheckRuns` su tutti i casi elencati dal PM (nessun run, un run in
  corso, tutti verdi, ciascuna delle cinque conclusioni rosse, il rosso che prevale
  sull'attesa, i run duplicati aggregati), e le sei funzioni sottili con `fetch`
  globale sostituito da un finto (nessuna chiamata di rete vera).
- **`ui/index.html`**: aggiunta la riga `import "./github.js";` accanto all'import di
  `lib.js`, per dimostrare che il modulo si carica nel browser (non ancora collegato
  alla dashboard: è compito di T6-T8).
- Un ADR nuovo — `docs/decisions/2026-09-03-1131-client-github-check-run-e-struttura.md`
  — su check run contro combined status, le due chiamate separate per issue
  aperte/chiuse di recente, l'endpoint del workflow per nome file, e la divisione
  `lib.js`/`github.js`.

Verificato con `node --test "ui/**/*.test.js"`: 53 test, 0 falliti.

Closes #17.

## Decisioni
- `docs/decisions/2026-09-03-1131-client-github-check-run-e-struttura.md`: stato dei
  check dai check run (non dal combined status), chiamate separate per issue
  aperte/chiuse di recente, endpoint del workflow per nome file, divisione
  `lib.js`/`github.js`.

## Non fatto
`ui/github.js` non è collegato alla dashboard oltre alla riga di `import`: la issue #17
chiedeva il client, non il suo uso in `index.html` per popolare "Aspettano te",
l'avanzamento o gli agenti attivi — è compito di T6, T7 e T8, che dipendono da questa T5.

## Fatto in più
Nulla oltre ai file elencati sopra (`ui/lib.js`, `ui/github.js`, `ui/github.test.js`,
`ui/index.html`, l'ADR).
