---
status: accepted
date: 2026-08-30
decision-makers: [Alessio]
---
# Specifiche e decisioni in markdown nel repo, non in un servizio di memoria

## Contesto e problema
Era in valutazione Supermemory come memoria di progetto e registro decisioni.

## Opzioni considerate
- Supermemory (o mem0, Zep, Cognee) come archivio delle decisioni
- Markdown versionato in git

## Decisione
Markdown in git.

## Conseguenze
Determinismo: stesso commit, stesso contesto. Un recupero top-k per similarità non
garantisce che un run di CI veda l'ADR che conta. Provenienza: le decisioni passano da
review, blame e revert. Atomicità: codice e decisione che lo giustifica si muovono nello
stesso commit — una memoria esterna diverge dal branch sotto test. Costo zero, nessun
nuovo dominio di guasto.

Supermemory è inoltre risultato mis-scoped (memoria dell'utente, con dimenticanza
automatica) e con il motore proprietario nonostante il client MIT.

Se un giorno il corpus supererà il grep, rivalutare Cognee (Apache-2.0, embedded).
