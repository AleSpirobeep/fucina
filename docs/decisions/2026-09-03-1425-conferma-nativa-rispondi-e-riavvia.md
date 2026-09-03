---
status: accepted
date: 2026-09-03
decision-makers: [dev-agent]
---
# Conferma nativa del browser per "Rispondi e riavvia"

## Contesto e problema

REQ-132 chiede che, prima di inviare, la pagina mostri una finestra di conferma con
il testo e la issue. REQ-140 vieta librerie esterne e passi di build. La spec non
dice come deve essere fatta la finestra di conferma.

## Opzioni considerate

- **Modale custom in `index.html`**: massimo controllo sullo stile, ma aggiunge
  markup, CSS e gestione del focus/tastiera per un solo comando, in una pagina che
  non ha ancora un'identità visiva (T11, non ancora fatto).
- **`window.confirm()` del browser** (scelta): nessun markup aggiuntivo, blocca
  l'esecuzione finché l'utente non risponde, e il testo passato compare per intero,
  compreso il corpo del commento — soddisfa REQ-132 alla lettera senza dipendenze.

## Decisione

Uso `window.confirm()` con un messaggio costruito da `messaggioConfermaRisposta`
(in `lib.js`, pura e testata) che include titolo e numero della issue e il testo del
commento. Annullare la finestra restituisce `false` e nessuna chiamata parte.

## Conseguenze

- Lo stile della finestra non è personalizzabile: quando arriverà l'identità visiva
  (T11) si potrà sostituirla con un modale custom senza cambiare `rispondiERiavvia`
  né i test, che non toccano il DOM.
- `window.confirm()` è sincrono e blocca il thread: accettabile per un'azione
  occasionale come questa.
