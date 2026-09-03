---
status: accepted
date: 2026-09-03
decision-makers: [dev-agent]
---
# Rilevamento server già attivo in `ui/apri.ps1`

## Contesto e problema

REQ-143 chiede che `ui/apri.ps1` avvii un server locale sulla cartella `ui/` e apra il
browser, ma un secondo avvio non deve aprire un secondo server. La spec non dice come
lo script deve accorgersi che un server è già attivo.

## Opzioni considerate

- **PID file**: salvare l'id del processo `python` avviato. Fragile: un PID può essere
  riassegnato ad un altro processo dopo che il server è terminato, dando un falso
  positivo.
- **Porta fissa nota**: usare sempre la stessa porta (es. 8000) e verificarne
  l'occupazione. Semplice, ma fallisce se quella porta è occupata da un altro
  programma non correlato: lo script rinuncerebbe a partire senza motivo.
- **File di stato con la porta usata, verificata con una connessione TCP** (scelta):
  al primo avvio si cerca una porta libera in un intervallo, si avvia il server e si
  salva la porta in `ui/.apri-stato.json`; agli avvii successivi si prova a connettersi
  a quella porta — se risponde, il server è già su, e si apre solo il browser.

## Decisione

File di stato con la porta, verificata con una connessione TCP diretta (non un ping
al PID). Una connessione riuscita è la prova più diretta che *qualcosa* sta servendo
quella porta; è la stessa cosa che il browser farà un istante dopo.

Il file `ui/.apri-stato.json` è runtime, non va in git: aggiunto a `.gitignore`.

## Conseguenze

- Avvii concorrenti in una finestra molto stretta (due `apri.ps1` lanciati nello
  stesso istante) potrebbero entrambi non trovare uno stato valido e avviare due
  server su porte diverse: accettabile, i criteri di accettazione parlano di "eseguito
  due volte", non di esecuzione simultanea.
- Se il processo del server muore senza liberare subito la porta (raro, ma possibile
  con TIME_WAIT), un riavvio potrebbe non riconoscerlo come attivo e tentarne un altro
  su una porta diversa: non è un secondo server sullo stesso indirizzo, quindi rispetta
  comunque il criterio.
