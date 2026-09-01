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
- `.fucina.yml` — configurazione degli agenti

## Definizione di "fatto"

Un lavoro è finito quando: i test passano, i criteri di accettazione dell'issue sono
tutti soddisfatti, le decisioni non coperte dalla specifica sono in un ADR, e la PR
dichiara esplicitamente cosa non è stato fatto.

## Convenzioni

- Branch: `fucina/<numero-issue>`
- Commit in italiano, all'imperativo, che dicono cosa cambia e perché
- Nessuna dipendenza nuova senza un ADR che la motivi
