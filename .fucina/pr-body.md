Completa `template/.github/workflows/pm-agent.yml` con i passi 8–10 di `plan.md`: la
chiamata al modello (`anthropics/claude-code-action@v1`) e l'esecuzione del verdetto
secondo `contracts/verdetto.md`.

## Cosa ho fatto

Ripreso il tentativo 1 (PR #57, chiusa) e corretto i tre problemi della sua revisione,
oltre al punto minore:

1. **Bloccante — canale di output del verdetto.** Il passo «Leggi il verdetto» non fa
   più passare `motivo`, `commento` e `nuove_issue` (testo scritto dal modello) per
   `GITHUB_OUTPUT` con l'heredoc `PMEOF`: un `commento` che contenesse quella riga
   poteva chiudere l'heredoc in anticipo e far vincere all'ultima riga un `esito=fondi`
   arbitrario. Ora `esito` e `tipo` (calcolati dal workflow, mai dal file) restano gli
   unici output del passo; `motivo`, `commento` e `nuove_issue` sono file in
   `$RUNNER_TEMP` (`fucina-verdetto-motivo.txt`, `fucina-verdetto-commento.md`,
   `fucina-verdetto-nuove-issue.json`), letti dai passi a valle — che già usavano
   `--body-file` e quindi si semplificano.
2. **La pubblicazione degli ADR non può più impedire l'esecuzione del verdetto.** Il
   passo «Pubblica gli ADR del PM» non gira più sotto `set -euo pipefail`: ogni comando
   che può fallire (`docs/decisions/` assente nel repo di destinazione, `git commit`
   senza nulla da committare, il push) è verificato esplicitamente, e solo il push
   fallito o un fallimento nel ciclo di copia/commit produce l'`errore` segnalato nel
   rapporto (REQ-234) — mai un passo morto prima di raggiungere i rami dell'esito.
3. **REQ-222 ora copre anche il fallimento del modello stesso.** Il passo «Esegui il
   PM» ha `continue-on-error: true`: se l'action fallisce (tetto di turni o di spesa
   superato), i passi successivi girano comunque, `verdetto.json` risulta assente, e
   «Leggi il verdetto» produce l'esito `umano` di riserva invece di saltare tutto.
4. **Minore.** Aggiunto `set -euo pipefail` al passo «Prepara la cartella di lavoro del
   PM», l'unico `run:` del file che ne era privo.

Per il resto la struttura del tentativo 1 (validata nella revisione) resta: passo
«Esegui il PM» con `GH_TOKEN: secrets.GITHUB_TOKEN` (mai il PAT), `track_progress:
false`, prompt `/pm-agent` + richiesta (nuovo output `richiesta` sul passo "Decidi la
prossima azione") + `CARTELLA_FUCINA`; `claude_args` con `--model`, `--max-turns`,
`--max-budget-usd`, `--allowedTools "<elenco>"` tra virgolette; validazione del
verdetto (file assente, JSON non valido, `versione` ≠ 1, numero diverso, esito non
ammesso per il tipo dedotto dal contesto della richiesta — non da `oggetto.tipo` del
file); un passo per ciascun esito (`fondi`, `rimanda`, `rispondi`, `umano`, `riscrivi`);
commento sul rapporto; rilancio in `scansione` se resta lavoro.

| esito | passo che lo esegue |
|---|---|
| `fondi` | «Verdetto: fondi» |
| `rimanda` | «Verdetto: rimanda» |
| `rispondi` | «Verdetto: rispondi» |
| `umano` (anche il fallback di validazione) | «Verdetto: umano» |
| `riscrivi` | «Verdetto: riscrivi» |

## Come l'ho verificato

```
$ yq '.' template/.github/workflows/pm-agent.yml
```
Esce con codice 0. Nessuna stringa `--admin` nel file; il modello riceve solo
`secrets.GITHUB_TOKEN` (mai il PAT); `--allowedTools` è tra virgolette. Il passo del
modello gira solo quando `steps.modalita.outputs.modalita == 'modello'`, cioè
esattamente `workflow_dispatch` con `azione` diversa da `scansione` (REQ-220, 230).

```
$ node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"
# tests 150
# pass 150
# fail 0
```
Nessun test nuovo: il task tocca solo un workflow YAML, nessuna funzione JavaScript
pura nuova da coprire con `node:test` (come previsto da `tasks.md` per questo task).

Nessun collaudo end-to-end reale del passo «Esegui il PM» (richiede l'action e i
secret, fuori portata di questo ambiente): verifica statica con `yq` e lettura contro
`contracts/verdetto.md` e `plan.md`, punto per punto.

## Decisioni

- `docs/decisions/2026-09-03-1750-dettagli-esecuzione-verdetto.md`: da dove viene il
  "tipo" usato per validare `esito` (dal contesto della richiesta, non da
  `oggetto.tipo` scritto dal modello) e perché l'estrazione di `Closes #` dal corpo
  della PR è reimplementata in bash invece di essere esportata da `pm-coda.js` (T003
  tocca solo il workflow).

## Non fatto

Non ho toccato `plugin/skills/pm-agent/SKILL.md` (riscrittura del ruolo): è T004, un
altro task.

## Fatto in più

Nulla oltre a `template/.github/workflows/pm-agent.yml`: ho aggiunto l'output
`richiesta` al passo esistente "Decidi la prossima azione" (necessario per comporre il
prompt del passo «Esegui il PM») e aggiornato il commento in testa al file, che citava
ancora il segnaposto di T003.

Closes #45
