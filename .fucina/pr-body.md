Implementa T10 (REQ-130, REQ-131, REQ-132): su ogni issue `needs-human` della sezione
"Aspettano te" un campo di testo e un pulsante "Rispondi e riavvia" che, dopo conferma,
pubblica il commento, toglie `needs-human` e mette `ready-for-dev`, fermandosi al primo
errore.

## Cosa cambia

- `ui/lib.js`: nuove funzioni pure
  - `urlLabelIssue` / `urlRimuoviLabelIssue` — URL per aggiungere e togliere
    un'etichetta di una issue.
  - `testoRispostaValido` — vero solo se il campo non è vuoto o di soli spazi;
    guida il disabilitato del pulsante.
  - `messaggioConfermaRisposta` — testo della finestra di conferma: titolo, numero
    della issue e il commento che sta per essere pubblicato.
  - `FASE_COMMENTO` / `FASE_RIMUOVI_NEEDS_HUMAN` / `FASE_AGGIUNGI_READY_FOR_DEV` e
    `messaggioErroreFase` — dicono quale delle tre chiamate è fallita.
- `ui/github.js`:
  - `richiesta` ora accetta un metodo HTTP e un corpo, e gestisce le risposte `204`
    (le DELETE sulle etichette non hanno corpo JSON).
  - `pubblicaCommento`, `rimuoviLabel`, `aggiungiLabel` — le tre chiamate singole.
  - `rispondiERiavvia` — le esegue in ordine (commento, poi rimozione di
    `needs-human`, poi aggiunta di `ready-for-dev`) e si ferma al primo errore,
    rilanciandolo come `ErroreFase` con la fase e la causa originale.
- `ui/index.html`: ogni issue bloccata in "Aspettano te" ha ora una `textarea`, un
  pulsante disabilitato finché il campo è vuoto, e un `window.confirm()` con il testo
  di `messaggioConfermaRisposta` prima di chiamare `rispondiERiavvia`. In caso di
  errore mostra `messaggioErroreFase` sotto il campo; in caso di successo svuota il
  campo e rilancia un aggiornamento completo della dashboard.

## Come l'ho verificato

- `node --test "ui/**/*.test.js"` — 113 test, tutti verdi (21 nuovi in
  `ui/rispondi-e-riavvia.test.js`, incluso l'ordine delle tre chiamate, l'arresto alla
  prima chiamata fallita con token senza permesso di scrittura, e il fatto che un
  fallimento sulla rimozione dell'etichetta non arrivi mai ad aggiungere
  `ready-for-dev`).
- La conferma nativa del browser e il disabilitato del pulsante sono wiring DOM in
  `index.html`, non testabile senza browser: verificati a lettura di codice, con lo
  stesso schema già in uso per T6/T7/T8/T9.

Closes #22

## Decisioni

- [2026-09-03-1425-conferma-nativa-rispondi-e-riavvia.md](../docs/decisions/2026-09-03-1425-conferma-nativa-rispondi-e-riavvia.md):
  uso `window.confirm()` invece di un modale custom per la conferma di REQ-132, in
  attesa dell'identità visiva di T11.

## Non fatto

Nulla dei criteri di accettazione della issue: il commento va sempre per primo (REQ-131),
un fallimento su una qualunque delle tre chiamate ferma la sequenza e lo dice, annullare
la conferma non fa partire nessuna chiamata, e il pulsante resta disabilitato a campo vuoto.

## Fatto in più

Ho generalizzato la funzione privata `richiesta` in `ui/github.js` per accettare metodo e
corpo (prima faceva solo `GET`): necessario per le tre nuove chiamate, ma tocca codice
scritto per T5/T6.
