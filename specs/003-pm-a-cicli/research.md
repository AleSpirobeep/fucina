# Ricerca — fase 0 della spec 003

Decisioni tecniche prese per il piano, con le alternative scartate. Nessun "NEEDS
CLARIFICATION" residuo.

## R1 — Interruttore: abilitazione del workflow, non una label né una variabile

**Decisione**: `gh workflow enable/disable pm-agent.yml`.
**Motivo**: un workflow disabilitato non parte per nessun evento e non appare tra le
esecuzioni: il costo a PM fermo è esattamente zero, incluse le esecuzioni "vuote". Lo stato
è visibile nella pagina Actions di GitHub e leggibile via API
(`actions/workflows/pm-agent.yml` → `state`), quindi il Registro potrà mostrarlo in una spec
successiva senza ulteriori convenzioni.
**Scartate**: label `pm-attivo` sull'issue di rapporto (il workflow partirebbe comunque a
ogni evento, anche solo per uscire: run visibili, minuti consumati, rumore nel Registro);
variabile di repository `PM_ATTIVO` (stesso difetto); cron periodico (esecuzioni a vuoto e
ritardo medio di mezzo periodo; inutile con gli eventi).

## R2 — Eventi perduti a PM fermo: accettati, con giro di recupero

**Decisione**: `avvia` lancia subito un `workflow_dispatch` in modalità `scansione`, che
rilegge tutto lo stato e lavora ciò che trova (REQ-203). Ogni esecuzione, a fine ciclo,
rilancia una scansione se resta lavoro (REQ-205).
**Motivo**: rende irrilevante quali eventi sono andati persi; è la stessa idea di P9
(decidere dai fatti, non dall'evento).

## R3 — La chiamata al modello avviene sempre in contesto `workflow_dispatch`

**Decisione**: un'esecuzione svegliata da `pull_request` o `issues` che ha bisogno del
modello non lo chiama: rilancia sé stessa con `workflow_dispatch` (`azione`, `numero`) e
termina.
**Motivo**: l'action `claude-code-action` in contesto `pull_request` ha comportamenti
propri (commit e push sul branch della PR, commento di avanzamento) che non abbiamo
collaudato per un ruolo di sola revisione; il contesto `workflow_dispatch` è quello già
collaudato nella spec 001 (con `track_progress` spento). Costo: un avvio in più (~20 s di
runner, zero token). Il rilancio usa `GITHUB_TOKEN` con permesso `actions: write`:
`workflow_dispatch` e `repository_dispatch` sono le uniche due eccezioni documentate alla
regola per cui il `GITHUB_TOKEN` non sveglia altri workflow.
**Scartata**: chiamare il modello direttamente nel job svegliato dall'evento, con checkout
di `main`. Funzionerebbe forse, ma "forse" non è un criterio: la fucina ha già perso tre
cicli su comportamenti impliciti dell'action.

## R4 — Il modello scrive file in `$RUNNER_TEMP`, non nel repo

**Decisione**: verdetto in `$RUNNER_TEMP/fucina/verdetto.json`, ADR in
`$RUNNER_TEMP/fucina/decisioni/`. Il workflow copia gli ADR in `docs/decisions/` e li
pubblica su `main` con il PAT.
**Motivo**: niente nel workspace da committare per sbaglio; il modello non ha `git`
(REQ-270); la pubblicazione è un atto deterministico e verificabile (P9). Il push diretto
su `main` con il PAT è permesso dalla protezione attuale (`enforce_admins: false`,
proprietario del PAT amministratore), esattamente come fa oggi la sessione desktop.

## R5 — Decisione in JavaScript, testata, invece che in bash

**Decisione**: `template/scripts/pm-coda.js`, funzione pura + CLI su stdin/stdout, test con
`node:test` su fixture JSON.
**Motivo**: P2 e P9 insieme: ciò che decide deve essere verificabile a tavolino. Node è
presente su tutti i runner GitHub e sul PC di Alessio; nessuna dipendenza (regola già in
vigore per `ui/`). Bash con `jq` avrebbe la stessa logica senza test.
**Nota**: l'estrazione delle sezioni "Non fatto" / "Fatto in più" esiste già in `ui/lib.js`
(`estraiSezioni`). Non si importa da `template/` a `ui/`: nel repo di destinazione `ui/`
non esiste. Si reimplementa la sola regola (intestazione `## Non fatto`, `## Fatto in più`,
insensibile a maiuscole e spazi) e la si testa sugli stessi corpi di fixture
(`ui/fixtures/pr-body-6.md`, `pr-body-9.md`, copiati in `template/scripts/fixtures/`).

## R6 — Un oggetto per esecuzione

**Decisione**: ogni esecuzione lavora una sola PR o issue, poi rilancia.
**Motivo**: log leggibili (un'esecuzione = un verdetto), tetti di spesa per oggetto, nessun
verdetto multiplo da interpretare, concurrency semplice.

## R7 — Le domande ad Alessio stanno sull'oggetto, non sul rapporto

**Decisione**: `umano` lascia (o mette) `needs-human` sulla PR/issue interessata con il
commento del PM come ultimo commento; il rapporto ha solo la riga di log e non porta
`needs-human`.
**Motivo**: il Registro (spec 002) mostra "Aspettano te" leggendo esattamente questo: la
issue con `needs-human` e il suo ultimo commento, con il comando "Rispondi e riavvia" che
toglie `needs-human` e mette `ready-for-dev`. Se la domanda stesse sul rapporto, il comando
rimetterebbe `ready-for-dev` al rapporto e l'agente sviluppatore tenterebbe di
"implementarlo" — da qui la seconda modifica di REQ-262.
**Marcatore**: `<!-- fucina:pm-umano -->` nel commento del PM; lo script ignora gli oggetti
il cui ultimo commento lo contiene (REQ-216). Quando Alessio risponde, il suo commento
diventa l'ultimo e la label cambia: entrambi i segnali riattivano il PM.

## R8 — Attesa dei check dentro l'esecuzione, non con un evento in più

**Decisione**: `gh pr checks N --watch` con `timeout` (default 15 min) prima di decidere su
una PR `needs-review` con check in corso.
**Motivo**: la label `needs-review` arriva nell'istante in cui la PR è aperta, quando i
check sono ancora in coda; ascoltare `check_suite: completed` aggiungerebbe un evento che
non porta il numero della PR in modo affidabile. L'attesa costa minuti di runner, non
token, e i check della fucina durano meno di un minuto.

## R9 — Il PAT ha già i permessi necessari

`FUCINA_PAT` (Contents, Issues, Pull requests in scrittura) copre fusione, chiusura,
commenti, label e push su `main`. Il rilancio del workflow usa `GITHUB_TOKEN` (R3): nessun
permesso nuovo da aggiungere al PAT. `pm.ps1` usa l'autenticazione locale di `gh`, che ha
`workflow` scope (necessario per enable/disable/run) se il login è stato fatto con
`gh auth login` standard; `init` lo ricorda nei passi manuali.
