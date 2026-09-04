# Convenzioni del progetto

> File letto da ogni agente a ogni esecuzione. Tienilo corto: quello che scrivi qui
> viene pagato in token a ogni run. Se cresce oltre una pagina, sposta i dettagli in
> `docs/` e lascia qui solo i puntatori.

## Comandi

- Installazione dipendenze: vedi `setup_command` in `.fucina.yml`
- Test: vedi `test_command` in `.fucina.yml`

## Dove sta la verità

- `specs/` — cosa il progetto deve fare
- `docs/decisions/` — perché è fatto così. **Non contraddire un ADR accettato:**
  se una decisione va cambiata, si scrive un ADR nuovo con `status: superseded by ...`
- `.fucina.yml` — configurazione degli agenti: il PM sotto la chiave `pm`,
  l'analista sotto `analista`

## L'analista

Prima del codice c'è l'analisi: la skill `/analista` porta un'idea fino a
`specs/<NNN>-*/` e alle issue `in-coda`, fermandosi a chiedere quando l'idea ha buchi.
Non accende niente. Il cancello che separa l'analisi dalla coda è
`node scripts/analista-cancello.js specs/<NNN>-<nome>`: se esce diverso da zero, la
spec non è consegnabile, e non si aggira.

## Il PM a cicli

Il PM gira coi comandi `scripts/pm-coda.js` (sceglie il prossimo task dalla coda) e
`scripts/pm.ps1 avvia|ferma|stato` (accende, spegne, mostra lo stato). L'issue con
label `rapporto-pm` è il rapporto del PM ad Alessio: **non va mai presa in carico
dall'agente sviluppatore**, nemmeno se etichettata `ready-for-dev` per errore.

## Definizione di "fatto"

Un lavoro è finito quando: i test passano, i criteri di accettazione dell'issue sono
tutti soddisfatti, le decisioni non coperte dalla specifica sono in un ADR, e la PR
dichiara esplicitamente cosa non è stato fatto.

## Convenzioni

- Branch: `fucina/<numero-issue>`
- Commit in italiano, all'imperativo, che dicono cosa cambia e perché
- Nessuna dipendenza nuova senza un ADR che la motivi
