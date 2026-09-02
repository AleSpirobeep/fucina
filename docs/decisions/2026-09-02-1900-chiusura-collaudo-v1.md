---
status: accepted
date: 2026-09-02
decision-makers: [Alessio]
---
# Chiusura del collaudo v1

## Contesto e problema
Dopo sei run dell'agente e una serie di prove deliberate, la spec 001 ha diciassette
requisiti verificati sul campo, uno per costruzione, uno con riserva, uno da confermare
e uno non verificato. Va deciso se la v1 è "tarata" abbastanza da usarla su un progetto
vero.

## Decisione
La v1 è utilizzabile su progetti reali con due riserve dichiarate:

- **REQ-014 (tetto di spesa)** non è verificato. Fino a prova contraria, il tetto
  effettivo è `max_turns`. Sui primi progetti reali `max_turns` resta a 60 e il budget a
  3 dollari; la prova va rifatta con budget minimo su un trigger da label.
- **REQ-031 (fermarsi davanti all'ambiguità)** è verificato con riserva: l'agente aveva
  letto nel README del laboratorio che la issue era un test. Il ragionamento sostanziale
  era comunque corretto. Da ricollaudare senza annuncio.

Il criterio "tre issue di fila verdi senza toccare niente" non è stato raggiunto in senso
stretto: i cicli sono stati due buoni (#4, #6) di cui uno pienamente pulito. È accettato
consapevolmente: ogni ciclo ha prodotto una correzione strutturale, e la struttura ora è
stabile — le ultime due correzioni riguardavano il workflow, non il ruolo.

## Cosa è cambiato rispetto alla spec di partenza
- Il branch lo nomina l'action (`fucina/issue-N-data`), non la fucina.
- La PR la apre il workflow con il corpo scritto dall'agente in un file (D-03).
- Lo stato dell'issue è interamente del workflow (P9).
- L'agente ha solo strumenti `gh` di lettura.
- Le approvazioni richieste sono zero; il cancello è il merge manuale.
- CODEOWNERS non applicabile sul piano Free; ridondante con una persona.
- `track_progress` disattivato su `workflow_dispatch`.

## Conseguenze
Prossimi passi, in ordine: verifica del REQ-014; `init.ps1` per non dipendere da Git
Bash; template repository per i progetti nuovi; primo progetto reale.
