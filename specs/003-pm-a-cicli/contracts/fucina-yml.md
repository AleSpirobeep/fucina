# Contratto — chiave `pm` di `.fucina.yml`

Aggiunta alla configurazione della spec 001. Tutte le sottochiavi hanno un default: la
chiave `pm` può mancare del tutto (REQ-261).

```yaml
pm:
  modello: "claude-sonnet-5"        # default: claude-sonnet-5
  max_turns: 40                     # default: 40 (rivedere un diff costa meno che scriverlo)
  max_budget_usd: 2.00              # default: 2.00
  attesa_check_minuti: 15           # default: 15 (REQ-215)
  titolo_rapporto: "Rapporto del PM"   # default: "Rapporto del PM" (REQ-240)
  strumenti_permessi:               # default: l'elenco qui sotto
    - "Read"
    - "Glob"
    - "Grep"
    - "Write"
    - "Bash(gh pr view:*)"
    - "Bash(gh pr diff:*)"
    - "Bash(gh pr checks:*)"
    - "Bash(gh issue view:*)"
    - "Bash(gh run view:*)"
    - "Bash(gh run list:*)"
    - "Bash(git log:*)"
    - "Bash(git show:*)"
    - "Bash(node:*)"
```

Regole:

- Il workflow legge le chiavi con `yq -r '.pm.<chiave> // <default>'`, come fa
  `dev-agent.yml` per `agente`.
- `strumenti_permessi` viene passato a `--allowedTools` **tra virgolette**, unito da
  virgole (ADR `2026-09-05-0900-allowedtools-virgolette.md`).
- Se `pm.strumenti_permessi` contiene uno strumento di mutazione (`gh pr merge`, `gh pr
  close`, `gh pr comment`, `gh pr edit`, `gh issue comment`, `gh issue edit`, `gh issue
  create`, `git commit`, `git push`, `Bash(gh:*)`, `Bash(git:*)`, `Bash`), il workflow si
  ferma con un errore esplicito prima di chiamare il modello (REQ-270). Il controllo è nel
  passo di configurazione, in bash, su corrispondenza di sottostringa.
- `endpoint` e `secret_auth` della spec 001 valgono anche per il PM: stesso fornitore,
  stesso token.
