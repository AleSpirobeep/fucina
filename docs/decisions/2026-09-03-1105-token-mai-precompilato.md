---
status: accepted
date: 2026-09-03
decision-makers: [dev-agent]
---
# Il campo token nel modulo di configurazione non è mai precompilato

## Contesto e problema
Il criterio di accettazione della issue #14 richiede che il token non compaia mai
nell'HTML. Riaprendo il modulo di configurazione (per esempio con il pulsante
"Configurazione") serve però un modo per non costringere l'utente a reinserire un
token già salvato solo perché vuole cambiare l'elenco dei repo.

## Opzioni considerate
- Precompilare il campo token con il valore salvato: comodo, ma lo scrive nel DOM
  (leggibile con gli strumenti sviluppatore) e viola il criterio alla lettera.
- Lasciare il campo sempre vuoto e trattare "vuoto al salvataggio" come "mantieni il
  token attuale", con un segnaposto che spiega il comportamento.

## Decisione
Il campo token è sempre vuoto all'apertura del modulo. Se l'utente lo lascia vuoto e
salva, il token già in `localStorage` resta invariato; se scrive qualcosa, quel
valore sostituisce il token esistente. Il segnaposto del campo dipende dalla presenza
effettiva di un token salvato al momento in cui il modulo si apre: con un token
presente dice di lasciarlo vuoto per non cambiarlo; senza token dice solo "Token
personale di GitHub", perché in quel caso non c'è nulla da mantenere.

## Conseguenze
Il token non è mai scritto nel DOM in chiaro, nemmeno dopo un salvataggio
precedente. L'utente che vuole solo cambiare l'elenco dei repo non deve andare a
recuperare di nuovo il proprio token. Il segnaposto calcolato al momento
dell'apertura del modulo, e non fissato una volta sola, resta corretto anche subito
dopo "Dimentica il token", quando nessun token esiste più.
