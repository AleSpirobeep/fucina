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
  l'ultimo commento) nel formato di `data-model.md` §1, con `template/scripts/
  raccogli-stato.sh` (nuovo — vedi "Fatto in più");
- decide con `node scripts/pm-coda.js` (già presente da T001);
- esegue le quattro azioni deterministiche (`avvia-task`, `attendi-check`,
  `rimanda-check-rossi`, `rimanda-corpo-incompleto`), commenta il rapporto, e
  rilegge lo stato per rilanciare una scansione **solo se resta lavoro**;
- per `revisione`/`domanda`, se l'esecuzione non è già un dispatch per quell'azione,
  si rilancia in `workflow_dispatch` con l'oggetto e termina; se lo è già, stampa
  `modello: T003` (il modello non viene chiamato in questa parte, come richiesto
  dall'issue);
- in caso di fallimento, commenta il rapporto con il link al log.

### Revisione del tentativo 1 (PR #52, chiusa)

Questo tentativo riparte dal lavoro del tentativo 1 (cherry-pick del suo commit) e
corregge i cinque punti della revisione:

1. **Bloccante — `--argjson` passato a `gh issue list --jq`.** `--jq` è un flag di
   `jq`, non di `gh`: si mangiava `--argjson` come propria espressione e faceva
   fallire il passo sotto `set -euo pipefail`. Corretto in
   `raccogli-stato.sh`: `gh issue list ... | jq -c --argjson rapporto ... '...'`,
   con `gh` e `jq` come comandi separati in pipe — lo stesso pattern già corretto
   usato per le PR nello stesso passo.
2. **Rilancio incondizionato.** Il passo "Rilancia una scansione di recupero"
   lanciava sempre un `workflow_dispatch` dopo un'azione deterministica. Ora il
   passo "Rilancia se resta lavoro" rilegge lo stato (`raccogli-stato.sh`), rifà
   girare `pm-coda.js`, e rilancia solo se l'azione risultante non è `niente`
   (plan.md, passo 6). Per evitare di duplicare ~50 righe di bash tra il passo
   "Raccogli lo stato del repo" e questo, la raccolta dello stato è ora una
   funzione condivisa in `template/scripts/raccogli-stato.sh`, chiamata da
   entrambi i punti.
3. **REQ-215, due mancanze.**
   - (a) `gh pr checks --watch` esce subito (non con lo stesso codice del timeout,
     124) se sulla PR non risulta ancora nessun check: quell'uscita ora ha un ramo
     proprio nel passo "Azione: attendi-check" (`esito=nessun-check`), distinto dal
     tetto superato (`esito=tetto-superato`) — entrambi mettono `needs-human` con un
     commento diverso, così l'esecuzione non richiama l'azione a vuoto in eterno.
   - (b) Il passo "Commenta il rapporto" ora sceglie il motivo in base a
     `steps.attendi.outputs.esito`: quando il tetto scatta, il rapporto dice
     esplicitamente che i check non si sono conclusi e che la PR è passata a
     `needs-human`, non più il motivo generico "check ancora in corso" della
     decisione originale.
4. **`data-model.md` §2 — issue mancante.** "Azione: rimanda-check-rossi" e
   "Azione: rimanda-corpo-incompleto" ora emettono `issue_mancante=true/false`;
   quando è `true` (nessun `Closes #` nel corpo), il passo "Commenta il rapporto"
   aggiunge una riga che lo segnala esplicitamente, oltre al commento già presente
   sulla sola PR.
5. **Minori.** Il link dell'oggetto nel commento del rapporto è `/pull/<numero>` per
   le quattro azioni su PR e `/issues/<numero>` solo per `avvia-task` (issue); il
   messaggio di `rimanda-corpo-incompleto` usa "sezioni" al plurale quando ne manca
   più di una (rilevato dalla virgola in `dettagli_manca`); gli input del dispatch
   (`inputs.azione`, `inputs.numero`) e i valori di `steps.decisione.outputs.*`
   ora passano da `env:` invece di essere interpolati nello script bash, come già
   per gli altri valori del file.

## Come l'ho verificato

```
$ yq '.' template/.github/workflows/pm-agent.yml
```
Esce con codice 0 (YAML valido) — l'output completo (369 → ora più righe per i rami
aggiunti) è stato controllato a mano contro `plan.md` e i contratti, e le sette
occorrenze di `gh ... --jq` più le due nuove in `raccogli-stato.sh` sono state rilette
isolate dal contesto YAML per controllare che ogni flag esista e stia dove deve —
compreso il punto bloccante del tentativo 1.

```
$ grep -n -- "--admin" template/.github/workflows/pm-agent.yml
nessuna occorrenza (ok)

$ yq '.jobs.ciclo.permissions' template/.github/workflows/pm-agent.yml
contents: write
issues: write
pull-requests: write
actions: write

$ yq '.jobs.ciclo.steps[] | select(has("run")) | (.run | split("\n")[0])' \
    template/.github/workflows/pm-agent.yml
set -euo pipefail   # × 14, uno per ogni passo run:
```

Nessun secret viene stampato: `GH_TOKEN` (e le sue varianti `GH_TOKEN_LETTURA`/
`GH_TOKEN_RILANCIO`) restano in `env:`, mai in un comando `echo`; `raccogli-stato.sh`
riceve il token dall'ambiente del passo che lo chiama, non lo stampa.

```
$ node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"
# tests 150
# pass 150
# fail 0
```
Nessun test nuovo: questo task non aggiunge logica JavaScript testabile (lo script di
decisione e i suoi test sono di T001, già fusi; `raccogli-stato.sh` è bash che chiama
`gh`, non una funzione pura). Il workflow si verifica con `yq`, l'ispezione dei passi
e il collaudo manuale di `quickstart.md`, come previsto da `tasks.md` per i task che
toccano solo YAML/bash.

## Requisiti → passo del workflow

| Requisito | Passo |
|---|---|
| REQ-201 (nessun processo tra un evento e l'altro) | Per costruzione: il job esiste solo per la durata dell'esecuzione, nessun passo resta in ascolto |
| REQ-202 (filtro degli eventi) | `if:` del job `ciclo` |
| REQ-203 (stato riletto a ogni esecuzione, anche dopo un'azione) | `Raccogli lo stato del repo` + `Decidi la prossima azione`; rilettura in `Rilancia se resta lavoro` |
| REQ-204 (serializzazione) | `concurrency: { group: pm-agent, cancel-in-progress: false }` |
| REQ-205 (un oggetto per esecuzione, poi rilancio solo se resta lavoro) | `Rilancia per il modello` e `Rilancia se resta lavoro` |
| REQ-211 (avvio del task successivo) | `Azione: avvia-task` |
| REQ-213 (PR con check rossi rimandata senza modello) | `Azione: rimanda-check-rossi` |
| REQ-214 (PR senza sezioni rimandata senza modello) | `Azione: rimanda-corpo-incompleto` |
| REQ-215 (attesa dei check con tetto, e segnalazione nel rapporto) | `Azione: attendi-check` + `Commenta il rapporto` |
| REQ-240 (issue di rapporto) | `Trova o crea l'issue di rapporto` |
| REQ-241 (commento sul rapporto per ogni azione) | `Commenta il rapporto` |
| REQ-242 (nessun commento se non c'è lavoro) | Nessun passo si attiva quando `azione == niente`: tutti i passi successivi hanno `if:` sull'azione |
| REQ-270 (nessuno strumento di mutazione al modello) | `Leggi la configurazione del PM` (controllo su `strumenti_permessi`) |

## Decisioni

- `docs/decisions/2026-09-03-1710-pm-agent-dettagli-implementativi.md`: aggiornato in
  questo tentativo. Restano due decisioni non coperte dai contratti — il valore di
  `check` quando `gh pr checks` non riporta ancora nulla (`in-corso`, non `verde`); il
  controllo su `strumenti_permessi` per elemento della lista invece che sull'intera
  stringa unita (per non bloccare i pattern `Bash(...)` di sola lettura). Il terzo
  punto che vi era registrato — il rilancio incondizionato — non era in realtà una
  decisione libera: `plan.md` lo copre già esplicitamente, come segnalato nella
  revisione del tentativo 1. È stato tolto dall'ADR e implementato secondo la
  specifica (vedi sopra, punto 2).

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
- Non ho collaudato il workflow su un repo reale (richiede eventi GitHub veri, ed è
  fuori dagli strumenti permessi in questa sessione): la verifica è `yq`, l'ispezione
  dei passi e i test esistenti, come indicato da `tasks.md` per T002.

## Fatto in più

- `template/scripts/raccogli-stato.sh`: non elencato esplicitamente nella issue, ma
  necessario per soddisfare il rilancio condizionato (punto 2 della revisione del
  tentativo 1) senza duplicare ~50 righe di bash tra il passo iniziale e quello dopo
  l'azione deterministica.
- `docs/decisions/2026-09-03-1710-pm-agent-dettagli-implementativi.md`: aggiornato
  (non creato ex novo) per togliere la decisione non valida sul rilancio
  incondizionato, come spiegato sopra.

Closes #44
