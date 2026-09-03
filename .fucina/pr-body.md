Implementa T9 (REQ-122): aggiornamento automatico della dashboard ogni 60 secondi, pulsante manuale "Aggiorna", ora dell'ultimo aggiornamento riuscito e riquadro degli errori in cima, senza far sparire i dati precedenti quando una chiamata fallisce.

## Cosa cambia

- `ui/lib.js`: nuove funzioni pure
  - `formattaOra` — formatta un timestamp ISO come `HH:MM:SS`.
  - `creaStatoSezione` / `aggiornaStatoRepo` — stato per repo di una sezione della dashboard: su un errore mantengono i dati dell'ultima chiamata riuscita e marcano la voce `nonAggiornato`.
  - `creaStatoAggiornamento` / `avviaAggiornamento` / `terminaAggiornamento` — macchina a stati del ciclo di aggiornamento: `avviaAggiornamento` restituisce `null` se un ciclo è già in corso, così un click sul pulsante manuale mentre gira quello automatico non genera un secondo giro di richieste; `terminaAggiornamento` registra l'ora solo se il ciclo non ha avuto errori.
- `ui/index.html`:
  - le tre sezioni (Aspettano te, Avanzamento, Agenti attivi) ora tengono lo stato per repo tra un ciclo e l'altro invece di ricostruirlo da zero: se una chiamata fallisce, la sezione di quel repo resta con l'ultimo contenuto valido e un messaggio "Dati non aggiornati: ..." in testa.
  - nuovo pulsante "Aggiorna", etichetta "Ultimo aggiornamento riuscito: HH:MM:SS" e un riquadro `#banner` in cima che elenca repo e sezione di ogni errore in corso.
  - `setInterval` da 60 secondi avviato una sola volta all'ingresso in dashboard; sia il timer che il pulsante chiamano la stessa `aggiorna()`, che usa `avviaAggiornamento` per evitare richieste doppie in sovrapposizione.

## Come l'ho verificato

- `node --test "ui/**/*.test.js"` — 95 test, tutti verdi (11 nuovi in `ui/aggiornamento.test.js` per `formattaOra`, `aggiornaStatoRepo`, e la macchina a stati di `avviaAggiornamento`/`terminaAggiornamento`, incluso il caso di doppio avvio rifiutato).
- La logica di rete/DOM (timer, click, banner) non è testabile senza browser: è stata verificata a lettura di codice, seguendo lo stesso schema già in uso in `index.html` per T6/T7/T8.

## Decisioni

Nessun ADR aggiunto: le scelte (dedup con `avviaAggiornamento` che restituisce `null`, timestamp aggiornato solo sui cicli senza errori, stato per repo invece che per sezione intera) sono implementazione diretta di REQ-122 e non cambiano comportamento visibile oltre a quanto richiesto dall'issue.

## Non fatto

Nulla dei criteri di accettazione della issue: l'ora cambia ogni minuto tramite il timer, un token revocato produce l'errore nel banner con i dati vecchi marcati "non aggiornati", e l'aggiornamento manuale durante uno automatico è scartato da `avviaAggiornamento`.

## Fatto in più

Le funzioni `caricaAspettanoTe`, `caricaAvanzamento`, `caricaAgentiAttivi` in `index.html` sono state divise in una parte che carica i dati (aggiorna lo stato per repo) e una `render...` separata che disegna il DOM dallo stato: necessario per poter ridisegnare senza perdere i dati vecchi in caso di errore, ma tocca codice scritto per T6/T7/T8.

Closes #21
