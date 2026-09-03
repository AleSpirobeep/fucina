---
status: accepted
date: 2026-09-03
decision-makers: [dev-agent]
---
# Client GitHub: check run al posto del combined status, chiamate separate, `lib.js`/`github.js`

## Contesto e problema
La T5 chiede un client per l'API di GitHub: issue aperte e chiuse di recente, PR aperte,
commenti di una issue, stato dei check di una PR, run del workflow `dev-agent`. La spec
002 non fissa gli endpoint né la divisione dei file. Un primo tentativo (PR #31, mai
entrata in `main`) usava `/commits/{ref}/status` per i check; il PM l'ha respinto perché
quell'endpoint aggrega solo la Statuses API e i check run delle GitHub Actions non vi
compaiono — sul commit `325d787` di questo repo risultava `pending` con zero status
mentre i quattro check run erano tutti `success`.

## Opzioni considerate
- **Combined status** (`/commits/{ref}/status`): un solo campo di stato già aggregato da
  GitHub, ma cieco ai check run — non realizza la REQ-112 per un repo che usa solo
  Actions.
- **Check runs** (`/commits/{ref}/check-runs`): espone ogni check run con `status` e
  `conclusion`; l'aggregazione in verde/rosso/in attesa va scritta a mano, ma è pura e
  testabile, e copre GitHub Actions.
- Un'unica chiamata `/issues?state=all` filtrata lato client per aperte/chiuse, contro due
  chiamate separate (`state=open`, `state=closed&sort=updated`): la seconda evita di
  scaricare tutta la storia delle issue chiuse quando serve solo "di recente", a costo di
  una richiesta HTTP in più.
- Tutto in un solo file (`lib.js`) contro la divisione `lib.js` (URL, interpretazione
  errori e stati) / `github.js` (le chiamate `fetch`): la divisione tiene la parte
  testabile senza rete separata da quella che richiede un finto `fetch`, come da
  CLAUDE.md.

## Decisione
Stato dei check dai **check run**: `GET /repos/{repo}/commits/{ref}/check-runs`, con
header `Accept: application/vnd.github+json` su tutte le chiamate del client (GitHub lo
raccomanda per l'intera REST API, non solo per questo endpoint). L'aggregazione è la
funzione pura `interpretaStatoCheckRuns` in `lib.js`: nessun run o almeno un run non
`completed` → "in attesa"; almeno una `conclusion` fra `failure`, `timed_out`,
`cancelled`, `action_required`, `startup_failure` → "rosso", che prevale sull'attesa; solo
`success`/`neutral`/`skipped` → "verde". I run duplicati sullo stesso commit (eventi
`push` e `pull_request`) si aggregano tutti insieme, senza deduplicarli.

Issue aperte e issue chiuse di recente restano due chiamate separate
(`urlIssueAperte`, `urlIssueChiuseDiRecente`), ordinate per `updated` le seconde.

Il workflow `dev-agent` si legge da
`/repos/{repo}/actions/workflows/dev-agent.yml/runs`: il nome del file è stabile, a
differenza dell'id numerico del workflow.

Una sola funzione di richiesta (`richiesta` in `github.js`) centralizza l'invio del
token, l'header `Accept` e la trasformazione di ogni risposta non `ok` — o del token
assente — in un `ErroreGitHub` con `codice` e `messaggio`; le sei funzioni pubbliche
(`issueAperte`, `issueChiuseDiRecente`, `prAperte`, `commentiIssue`, `statoCheckPr`,
`runWorkflow`) sono involucri sottili sopra di essa.

## Conseguenze
La REQ-112 è realizzabile anche per repo che usano solo GitHub Actions, come questo. Se
in futuro un repo userà anche la Statuses API "vecchio stile" (CI esterne senza
integrazione Checks), quei check non compariranno: da valutare quando servirà davvero,
non ora. La divisione `lib.js`/`github.js` resta il confine da rispettare per T6-T8, che
consumeranno queste funzioni senza toccare `fetch` direttamente.
