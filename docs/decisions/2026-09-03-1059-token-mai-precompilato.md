---
status: accepted
date: 2026-09-03
decision-makers: [dev-agent]
---
# Il campo token non è mai precompilato nel modulo

## Contesto e problema
La issue T2 chiede un pulsante "Configurazione" che riapre il modulo per cambiare
repo e token, e impone che il token non compaia mai nell'HTML. Il modulo di modifica
deve quindi decidere cosa mostrare nel campo token quando uno è già salvato: la
spec non lo specifica.

## Opzioni considerate
- Precompilare il campo token con il valore salvato: comodo per rivedere il token
  attuale, ma lo scriverebbe nel DOM ogni volta che si riapre il modulo — in
  contraddizione diretta con il criterio "il token non compare mai nell'HTML".
- Lasciare il campo sempre vuoto, con un segnaposto che spiega che vuoto = non
  cambiare il token attuale; solo un valore non vuoto lo sovrascrive.

## Decisione
Il campo token nel modulo parte sempre vuoto. Al salvataggio, se il campo è vuoto
si mantiene il token già in `localStorage`; se contiene testo, lo sostituisce.
L'elenco repo, non sensibile, viene invece precompilato quando si riapre il modulo
da "Configurazione".

## Conseguenze
Il token non viene mai scritto nel DOM dalla pagina stessa, in nessun momento del
ciclo di vita del modulo. L'utente che vuole solo cambiare i repo può salvare senza
reinserire il token.
