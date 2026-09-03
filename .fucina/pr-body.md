Completa `template/.github/workflows/pm-agent.yml` con i passi 8–10 di `plan.md`: la
chiamata al modello (`anthropics/claude-code-action@v1`) e l'esecuzione del verdetto
secondo `contracts/verdetto.md`.

- Passo **«Esegui il PM»**: gira solo quando `steps.modalita.outputs.modalita == 'modello'`,
  cioè esattamente `workflow_dispatch` con `azione` diversa da `scansione` (REQ-220, 230,
  calcolato dal passo esistente "Determina la modalità"). `claude_code_oauth_token`;
  `env` con `ANTHROPIC_BASE_URL` da `endpoint` e `GH_TOKEN: secrets.GITHUB_TOKEN` (sola
  lettura: il PAT non arriva mai al modello); `track_progress: false`; prompt `/pm-agent`
  + «Revisiona la PR #N» / «Rispondi alla issue #N» (calcolato nel passo "Decidi la
  prossima azione", nuovo output `richiesta`) + `CARTELLA_FUCINA=$RUNNER_TEMP/fucina`
  (creata da un passo precedente, con `decisioni/`); `claude_args` con `--model`,
  `--max-turns`, `--max-budget-usd` da `pm.*` e `--allowedTools "<elenco>"` tra virgolette.
- Passo **«Leggi il verdetto»**: legge `verdetto.json` con `jq`; assente, non valido,
  `versione` ≠ 1, numero diverso da quello richiesto, o esito non ammesso per il tipo
  (dedotto dal contesto della richiesta, non dal campo `oggetto.tipo` del file — vedi ADR)
  → esito `umano` con il commento standard «Il PM non ha concluso: \<causa\>. Log: \<link\>»
  (REQ-222).
- Passo **«Pubblica gli ADR del PM»**: per ogni file in `decisioni/`, copia in
  `docs/decisions/`, `git add`, commit «ADR del PM: \<nome\>», push su `main` (ramo di
  default) con il PAT; se il push fallisce il verdetto viene eseguito comunque e il
  commento sul rapporto lo segnala (REQ-234).
- Un passo per ogni esito della tabella di `contracts/verdetto.md`: `fondi` → merge
  squash + delete-branch, su errore `+needs-human` sulla PR con l'errore (REQ-223);
  `rimanda` → commento, chiusura della PR, stesso commento sull'issue collegata (`Closes #`
  nel corpo), `+ready-for-dev` (REQ-224); `rispondi` → commento, `-needs-human
  +ready-for-dev` (REQ-231); `umano` → commento con `<!-- fucina:pm-umano -->` in coda,
  `+needs-human` solo se PR (REQ-232); `riscrivi` → una issue `in-coda` per ogni
  `nuove_issue`, commento e chiusura dell'originale (REQ-233).
- Passo **«Commenta il rapporto (modello)»**: esito, motivo, link, ed eventuale errore di
  push degli ADR (REQ-241).
- Passo **«Rilancia se resta lavoro (dopo il verdetto)»**: rilegge lo stato e rilancia una
  scansione solo se `pm-coda.js` trova ancora lavoro (REQ-205), stesso schema del passo
  analogo già esistente per la modalità `scansione`.
- Il passo di fallimento esistente («Segnala il fallimento del run», `if: failure()`) copre
  già anche questi passi nuovi: nessuna modifica necessaria.

## Verificato

- `yq '.' template/.github/workflows/pm-agent.yml` esce 0.
- Nessuna stringa `--admin` nel file; il modello riceve solo `secrets.GITHUB_TOKEN`
  (mai il PAT); `--allowedTools` è tra virgolette.
- `node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` → 150/150 verdi (nessun
  file toccato da questo task ha test propri: è un workflow, verificato con `yq` e lettura,
  non con `node --test`, come previsto da `tasks.md`).

## Decisioni

- `docs/decisions/2026-09-03-1739-dettagli-esecuzione-verdetto.md`: da dove viene il "tipo"
  usato per validare `esito` (dal contesto della richiesta, non dal campo `oggetto.tipo`
  scritto dal modello) e perché l'estrazione di `Closes #` dal corpo della PR è
  reimplementata in bash invece di essere esportata da `pm-coda.js` (T003 tocca solo il
  workflow).

## Non fatto

- Nessun collaudo end-to-end reale del passo «Esegui il PM» (richiede l'action, i secret e
  un repo installato: fuori portata di questo ambiente). La verifica è statica (`yq`,
  lettura del file, corrispondenza con `contracts/verdetto.md` e `plan.md`).
- Non ho toccato `plugin/skills/pm-agent/SKILL.md` (riscrittura del ruolo): è T004, un altro
  task.

## Fatto in più

Nulla oltre a `template/.github/workflows/pm-agent.yml`: ho aggiunto l'output `richiesta`
al passo esistente "Decidi la prossima azione" (necessario per comporre il prompt del
passo «Esegui il PM») e aggiornato il commento in testa al file, che citava ancora il
segnaposto di T002.

Closes #45
