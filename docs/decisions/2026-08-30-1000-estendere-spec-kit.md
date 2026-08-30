---
status: accepted
date: 2026-08-30
decision-makers: [Alessio]
---
# La fucina estende GitHub Spec Kit invece di sostituirlo

## Contesto e problema
Serve una fase di analisi strutturata che porti un'idea fino a specifiche mature.
Costruirla da zero significa reimplementare un formato di documenti, un flusso di comandi
e un ponte verso le issue.

## Opzioni considerate
- Formato e flusso proprietari
- GitHub Spec Kit come base, esteso con preset ed estensioni
- BMAD-METHOD come base

## Decisione
Spec Kit come base. È a 132k stelle, mantenuto quotidianamente, nativo per Claude Code, e
ha già `/speckit.taskstoissues` (task → issue GitHub) e `/speckit.converge` (rilevamento
deriva). Il suo meccanismo di preset ed estensioni permette di sovrascrivere template e
comandi senza fork.

## Conseguenze
Buone: nessun formato da manutenere, aggiornamenti gratuiti a monte.
Cattive: dipendenza da un progetto pre-1.0 di GitHub, che potrebbe cambiare i comandi.
Mitigazione: pinnare la versione di `specify-cli`.
