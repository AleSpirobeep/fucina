---
status: accepted
date: 2026-08-30
decision-makers: [Alessio]
---
# Headroom rinviato a dopo la misurazione della spesa reale

## Contesto e problema
Headroom comprime gli output dei tool prima che diventino token in input. Era candidato
all'inclusione dal giorno uno per contenere i costi.

## Decisione
Non incluso in v1. Prima si attiva il prompt caching di Anthropic, si misura la spesa
reale per PR tramite `--max-budget-usd`, e solo dopo si valuta.

## Conseguenze
Introdurlo insieme a tutto il resto renderebbe impossibile attribuire gli effetti.
Va inoltre corretta l'aspettativa: sui coding agent il guadagno reale è intorno al 20%,
non al 60-95% — il codice sorgente non viene compresso per scelta progettuale. Il
guadagno grande è su JSON e log, cioè log di CI e risposte dell'API GitHub.
Da sapere: avvolgere Claude Code cambiando `ANTHROPIC_BASE_URL` ne disabilita il Remote
Control dalla versione 2.1.196.
