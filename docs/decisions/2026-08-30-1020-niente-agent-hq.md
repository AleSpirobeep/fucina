---
status: accepted
date: 2026-08-30
decision-makers: [Alessio]
---
# Workflow con claude-code-action, non GitHub Agent HQ

## Contesto e problema
GitHub Agent HQ assegna già agenti Claude e Codex alle issue e mostra il loro stato in
Issues e Projects. Copre buona parte del loop.

## Opzioni considerate
- Agent HQ / Copilot coding agent
- Workflow GitHub Actions con `anthropics/claude-code-action`

## Decisione
Workflow propri con `claude-code-action`.

## Conseguenze
Agent HQ richiede un piano Copilot a pagamento oltre alla sottoscrizione Claude già
attiva, e non permette di definire ruoli, protezioni e regole di escalation proprie.
Il costo è che le viste agente native di Issues e Projects non mostreranno i nostri run:
il monitoraggio si basa su label e stato delle issue.
