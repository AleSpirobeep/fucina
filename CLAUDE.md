# Convenzioni — repo fucina

> Letto da ogni agente a ogni esecuzione. Corto per scelta.

## Cosa c'è qui

- `ui/` — il Registro (spec 002): una pagina statica che interroga l'API di GitHub.
  `index.html` è la pagina, `lib.js` la logica pura, `lib.test.js` i suoi test.
- `specs/` — cosa deve fare ogni cosa. La spec attiva è `specs/002-registro/spec.md`.
- `docs/decisions/` — perché è fatto così. Non contraddire un ADR accettato.
- `template/`, `plugin/`, `init.sh` — la fucina stessa. **Non toccarli** se l'issue non li
  nomina: sono ciò che fa girare l'agente che sta leggendo queste righe.

## Comandi

- Test: `node --test ui/` — nessuna dipendenza, nessun `npm install`.

## Regole per `ui/`

- Nessun passo di build, nessun `package.json`, nessuna libreria esterna. Solo API di
  GitHub.
- La logica che si può testare senza browser va in `lib.js`, come funzioni pure
  esportate; `index.html` la importa come modulo ES e fa solo rendering e chiamate.
- Ogni funzione in `lib.js` ha almeno un test, con il runner di Node (`node:test` e
  `node:assert`). I test vanno in file `ui/<argomento>.test.js` — **uno nuovo per ogni
  task**, accanto a quelli esistenti. I file di test esistenti non si modificano: il
  guard li protegge, e il glob `ui/**/*.test.js` li raccoglie tutti.
- Le fixture (corpi di PR, risposte dell'API) stanno in `ui/fixtures/` come file, mai
  lette dalla rete dentro un test.
- Il token dell'utente esiste solo in `localStorage`. Mai in un file, mai in un log.
- Italiano nell'interfaccia e nei messaggi d'errore.

## Definizione di "fatto"

Test verdi, criteri di accettazione della issue soddisfatti uno per uno, decisioni non
coperte dalla spec in un ADR, `.fucina/pr-body.md` con le sezioni "Non fatto" e "Fatto
in più" compilate.
