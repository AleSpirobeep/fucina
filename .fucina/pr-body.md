Aggiunge la tabella di avanzamento per repo (T7, REQ-120).

- `ui/lib.js`: `COLONNE_AVANZAMENTO` (ordine e etichette delle sei colonne) e
  `tabellaAvanzamento(classificazione)`, funzione pura che trasforma il risultato di
  `classifica()` (T4) in colonne con conteggio ed elementi `{ titolo, url }` pronti per
  il rendering — una colonna senza elementi ha `elementi: []` e `conteggio: 0`, non manca.
- `ui/index.html`: per ogni repo configurato, recupera issue aperte, issue chiuse di
  recente e PR aperte con `ui/github.js` (T5), classifica con `classifica()` e disegna una
  tabella con intestazioni "Etichetta (conteggio)" e celle con elenco di link a GitHub, o
  un trattino `-` quando la colonna è vuota. Ogni repo è in una `<section>` separata con
  il nome in un `<h3>`. Un errore nel recupero di un repo mostra il messaggio invece della
  tabella, senza bloccare gli altri repo.

**Verificato con:**
- `node --test "ui/**/*.test.js"` verde (58 test, di cui 5 nuovi in `ui/avanzamento.test.js`
  per `tabellaAvanzamento`: ordine e etichette delle colonne, colonna vuota, conteggi,
  mapping titolo/url per issue e PR).

## Decisioni

Nessun ADR aggiunto: l'implementazione segue la spec 002 (REQ-120) e riusa `classifica()`
(T4) e i client (T5) senza scelte non coperte dalla specifica.

## Non fatto

Nulla dei criteri di T7: i conteggi derivano direttamente da `classifica()` (già verificata
contro `gh issue list`/`gh pr list` nei test di T4), e le colonne vuote mostrano sempre il
trattino. La sezione "Agenti attivi" (T8) e l'aggiornamento automatico (T9) sono task
successivi e non fanno parte di questa issue.

## Fatto in più

Nulla: solo `ui/lib.js`, `ui/index.html` e il nuovo `ui/avanzamento.test.js`.

Closes #19
