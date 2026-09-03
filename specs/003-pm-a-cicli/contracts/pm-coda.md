# Contratto — `template/scripts/pm-coda.js`

## Interfaccia

```js
// modulo CommonJS, nessuna dipendenza
module.exports = { decidi, estraiSezioniMancanti, identificativoTask };

decidi(stato)                    // stato: vedi data-model.md §1 → decisione: §2
estraiSezioniMancanti(corpo)     // → array tra ["Non fatto", "Fatto in più"], vuoto se ci sono entrambe
identificativoTask(titolo)       // "T004: ..." → "T004"; "T004b - ..." → "T004b"; altrimenti null
```

CLI: `node scripts/pm-coda.js < stato.json` stampa la decisione in JSON su stdout, exit 0.
Input non JSON o senza le chiavi `pr` e `issue` → messaggio su stderr, exit 2. Eseguito
come modulo (`require`) non legge stdin.

## Regole, in ordine (la prima che si applica vince)

| # | Condizione | Decisione |
|---|---|---|
| 1 | esiste una PR con `needs-review` e senza `needs-human` e `ultimoCommentoPm == false` → si prende quella con `numero` minimo | continua con 1a–1d |
| 1a | `check == "rosso"` | `rimanda-check-rossi` |
| 1b | `check == "in-corso"` | `attendi-check` |
| 1c | `estraiSezioniMancanti(corpo)` non vuoto | `rimanda-corpo-incompleto`, `dettagli.manca` |
| 1d | altrimenti | `revisione` |
| 2 | esiste una issue con `needs-human` e `ultimoCommentoPm == false` → `numero` minimo | `domanda` |
| 3 | nessuna issue con `ready-for-dev`, `in-progress` o `needs-human`; nessuna PR con `needs-review`; esiste almeno una issue con `in-coda` e identificativo valido → quella con identificativo minimo (ordine: numero, poi suffisso lettera; `T004` < `T004a` < `T004b` < `T005`) | `avvia-task`, `dettagli.task` |
| 4 | altrimenti | `niente` |

Note:

- Una issue con `in-coda` **e** un'altra label di stato conta come attiva, non come in coda.
- Le PR con `needs-human` bloccano l'avvio dei task (regola 3 le vede come `needs-review`
  ancora aperte): una PR ferma su una domanda ad Alessio non deve far partire il task
  successivo, che spesso dipende da lei.
- `dettagli.issue` per le PR: primo numero dopo `Closes #` (insensibile a maiuscole) nel
  corpo; `null` se assente.
- `identificativoTask` accetta `T` seguita da almeno tre cifre e al più una lettera minuscola,
  come parola intera, ovunque nel titolo. `ST001` non è valido.

## Sezioni del corpo

Una sezione è presente se esiste una riga che, tolti spazi iniziali e finali, è
`## Non fatto` oppure `## Fatto in più` (confronto insensibile a maiuscole; è ammesso
`###`). Il contenuto non conta: `nulla` è un contenuto valido. Stessa regola di
`ui/lib.js` → `estraiSezioni`, reimplementata (vedi `research.md` R5).

## Fixture minime richieste (in `template/scripts/fixtures/`)

| file | cosa contiene | decisione attesa |
|---|---|---|
| `stato-vuoto.json` | nessuna PR, nessuna issue | `niente` |
| `stato-coda.json` | `T002`, `T003` in coda, nulla di attivo | `avvia-task` #T002 |
| `stato-coda-bloccata.json` | `T002` in coda, `T001` `in-progress` | `niente` |
| `stato-coda-suffissi.json` | `T004b`, `T004a`, `T005` in coda | `avvia-task` `T004a` |
| `stato-pr-verde.json` | PR con check verdi e corpo completo (da `pr-body-6.md`) | `revisione` |
| `stato-pr-rossa.json` | PR con check rossi | `rimanda-check-rossi` |
| `stato-pr-in-corso.json` | PR con check in corso | `attendi-check` |
| `stato-pr-senza-sezioni.json` | PR con corpo minimo del workflow | `rimanda-corpo-incompleto`, `manca` con entrambe |
| `stato-priorita.json` | PR #40 verde, issue #30 `needs-human`, `T005` in coda | `revisione` #40 |
| `stato-domanda.json` | issue `needs-human` senza marcatore, nulla di altro | `domanda` |
| `stato-domanda-vista.json` | issue `needs-human` con `ultimoCommentoPm: true` | `niente` |
| `stato-pr-umano.json` | PR `needs-review` + `needs-human`, `T006` in coda | `niente` |
