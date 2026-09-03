## Cosa ho fatto

Creato `template/.github/workflows/pm-agent.yml`: la prima parte del PM a cicli
(spec 003, T002). Il workflow:

- filtra gli eventi (`pull_request`/`issues` con label `needs-review`, `needs-human`,
  `in-coda`, i `closed`, gli `unlabeled` di `needs-human`, e i `workflow_dispatch`);
- serializza le esecuzioni per repo (`concurrency: pm-agent`);
- fa il checkout del branch di default (mai del ref della PR);
- legge la chiave `pm` di `.fucina.yml` con i default del contratto, e si ferma con
  errore esplicito se `strumenti_permessi` contiene uno strumento di mutazione
  (REQ-270);
- trova o crea l'issue di rapporto (`rapporto-pm`);
- raccoglie lo stato del repo (PR aperte con check e corpo, issue aperte con
  l'ultimo commento) nel formato di `data-model.md` §1;
- decide con `node scripts/pm-coda.js` (già presente da T001);
- esegue le quattro azioni deterministiche (`avvia-task`, `attendi-check`,
  `rimanda-check-rossi`, `rimanda-corpo-incompleto`), commenta il rapporto, e
  rilancia una scansione di recupero;
- per `revisione`/`domanda`, se l'esecuzione non è già un dispatch per quell'azione,
  si rilancia in `workflow_dispatch` con l'oggetto e termina; se lo è già, stampa
  `modello: T003` (il modello non viene chiamato in questa parte, come richiesto
  dall'issue);
- in caso di fallimento, commenta il rapporto con il link al log.

## Come l'ho verificato

```
$ yq '.' template/.github/workflows/pm-agent.yml
```
Esce con codice 0 (YAML valido); l'output completo è stato controllato a mano contro
`plan.md` e i contratti.

```
$ grep -n -- "--admin" template/.github/workflows/pm-agent.yml
nessuna occorrenza (ok)

$ yq '.jobs.ciclo.permissions' template/.github/workflows/pm-agent.yml
contents: write
issues: write
pull-requests: write
actions: write
```

Ho controllato a mano ciascuno dei 14 passi `run:` del file: tutti iniziano con
`set -euo pipefail`. Nessun secret viene stampato: solo `GH_TOKEN` in `env:`, mai in
un comando `echo`.

```
$ node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"
# tests 150
# pass 150
# fail 0
```
Nessun test nuovo: questo task non aggiunge logica JavaScript (lo script di
decisione e i suoi test sono di T001, già fusi). Il workflow si verifica con `yq` e
con il collaudo manuale di `quickstart.md`, come previsto da `tasks.md` per i task che
toccano solo YAML.

## Requisiti → passo del workflow

| Requisito | Passo |
|---|---|
| REQ-201 (nessun processo tra un evento e l'altro) | Per costruzione: il job esiste solo per la durata dell'esecuzione, nessun passo resta in ascolto |
| REQ-202 (filtro degli eventi) | `if:` del job `ciclo` |
| REQ-203 (stato riletto a ogni esecuzione) | `Raccogli lo stato del repo` + `Decidi la prossima azione` |
| REQ-204 (serializzazione) | `concurrency: { group: pm-agent, cancel-in-progress: false }` |
| REQ-205 (un oggetto per esecuzione, poi rilancio) | `Rilancia per il modello` e `Rilancia una scansione di recupero` |
| REQ-211 (avvio del task successivo) | `Azione: avvia-task` |
| REQ-213 (PR con check rossi rimandata senza modello) | `Azione: rimanda-check-rossi` |
| REQ-214 (PR senza sezioni rimandata senza modello) | `Azione: rimanda-corpo-incompleto` |
| REQ-215 (attesa dei check con tetto) | `Azione: attendi-check` |
| REQ-240 (issue di rapporto) | `Trova o crea l'issue di rapporto` |
| REQ-241 (commento sul rapporto per ogni azione) | `Commenta il rapporto` |
| REQ-242 (nessun commento se non c'è lavoro) | Nessun passo si attiva quando `azione == niente`: tutti i passi successivi hanno `if:` sull'azione |
| REQ-270 (nessuno strumento di mutazione al modello) | `Leggi la configurazione del PM` (controllo su `strumenti_permessi`) |

## Decisioni

- `docs/decisions/2026-09-03-1710-pm-agent-dettagli-implementativi.md`: tre dettagli
  implementativi non coperti dai contratti — il valore di `check` quando `gh pr
  checks` non riporta ancora nulla (`in-corso`, non `verde`); il controllo su
  `strumenti_permessi` per elemento della lista invece che sull'intera stringa unita
  (per non bloccare i pattern `Bash(...)` di sola lettura); il rilancio
  incondizionato di una scansione di recupero dopo un'azione deterministica, invece
  di ricalcolare lo stato per decidere se serve.

## Non fatto

- **T003** (seconda parte del workflow): la chiamata effettiva al modello
  (`anthropics/claude-code-action@v1`), l'esecuzione del verdetto (fusione, rimando,
  risposta, riscrittura), la pubblicazione degli ADR su `main`. In questa parte le
  esecuzioni `workflow_dispatch` con `azione` `revisione`/`domanda` terminano
  stampando `modello: T003`, come richiesto dall'issue.
- Il timeout del job (`timeout-minutes: 30`) copre il default di
  `pm.attesa_check_minuti` (15) più margine; se quel valore viene alzato oltre i 20
  minuti in `.fucina.yml`, il timeout del job va alzato a mano (limite intrinseco di
  GitHub Actions: `timeout-minutes` è statico, non può leggere la configurazione a
  runtime).
- Non ho collaudato il workflow su un repo reale (richiede eventi GitHub veri): la
  verifica è `yq`, l'ispezione dei passi e i test esistenti, come indicato da
  `tasks.md` per T002.

## Fatto in più

- `docs/decisions/2026-09-03-1710-pm-agent-dettagli-implementativi.md`: non richiesto
  esplicitamente dall'issue, ma necessario per registrare le tre scelte non coperte
  dai contratti (vedi sopra).

Closes #44
