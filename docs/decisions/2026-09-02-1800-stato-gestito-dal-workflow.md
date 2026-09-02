---
status: accepted
date: 2026-09-02
decision-makers: [Alessio]
---
# Lo stato dell'issue lo gestisce il workflow, mai l'agente

## Contesto e problema
Terzo ciclo, issue deliberatamente ambigua (fucina-lab#5). L'agente si è fermato come
previsto dal REQ-031: nessun branch, nessun codice, una domanda chiusa con due opzioni
nel suo report. Ma la label `needs-human` non è stata applicata: `gh issue edit` era
fra gli strumenti permessi, eppure il sistema di permessi del run l'ha bloccato.

È il terzo caso in tre cicli in cui un'azione di stato affidata all'agente non è
avvenuta (PR non aperta, label non applicata). La lezione si generalizza.

Un secondo problema, di metodo: l'agente ha scritto *"il README del repo conferma che
questa issue è pensata apposta per verificare che l'agente si fermi"*. Il README del
laboratorio annunciava lo scopo del test, e l'agente l'ha letto. Il risultato è meno
conclusivo di quanto appaia.

## Decisione
Ogni transizione di stato — label, commenti di stato, apertura della PR — è del
workflow. L'agente produce solo artefatti nel branch (codice, test, ADR, corpo della
PR) e il proprio report finale. Il workflow deduce lo stato da fatti osservabili:
run verde con branch → PR aperta e `needs-review`; run verde senza branch → l'agente
si è fermato → `needs-human` e un commento che spiega come riprendere; run rosso →
`in-progress` rimossa e commento con il link al log.

Gli strumenti `gh` dell'agente si riducono alla sola lettura (`gh issue view`,
`gh pr view`). Il ruolo aggiunge la lettura dei commenti dell'issue, perché la risposta
a una domanda precedente vive lì.

La frase del README di fucina-lab che annuncia lo scopo della issue ambigua va
rimossa. Il REQ-031 resta verificato con riserva e va ricollaudato con una issue
ambigua non annunciata.

## Conseguenze
L'agente ha meno superficie e meno modi di fallire in silenzio. Il flusso di ripresa
dopo un'escalation è esplicito: la persona risponde in un commento, toglie
`needs-human`, rimette `ready-for-dev`; l'agente rilegge l'issue con i commenti e
procede. Il contatore dei tentativi continua a contare: anche una ripresa consuma
una cartuccia, ed è corretto così.

Principio per la costituzione, da formalizzare: **ciò che è deterministico lo fa il
workflow; l'agente fa solo ciò che richiede giudizio.**
