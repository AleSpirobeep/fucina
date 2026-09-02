---
status: accepted
date: 2026-09-02
decision-makers: [Alessio]
---
# Ogni installazione deve dichiarare esplicitamente gli strumenti di scrittura

## Contesto e problema
Al primo run reale sul repo di collaudo l'agente ha esaurito i 30 turni senza produrre
nulla: nessun branch, nessuna PR, tutte le voci della sua todo list ancora da fare.

Il log rivela la causa. `claude-code-action`, invocata su un evento `issues`, concede
di default solo:

    Glob, Grep, LS, Read, mcp__github_comment__update_claude_comment,
    Bash(git add:*), Bash(git commit:*), git-push.sh, Bash(git rm:*)

Niente `Edit`, niente `Write`, nessun `Bash` generico. L'agente poteva leggere il
codice e fare commit, ma **non poteva modificare un file né eseguire i test**. Ha
speso trenta turni cercando una strada che non esisteva.

La frontmatter `allowed-tools` nella skill non ha effetto su questo: il perimetro lo
fissa l'action, e la skill può solo restringerlo.

## Decisione
`.fucina.yml` acquisisce la chiave `strumenti_permessi`, che il workflow passa a
`--allowedTools`. La lista è parte della configurazione per-progetto, come
`test_command`, perché dipende dallo stack: un repo Python vuole `Bash(pytest:*)`,
uno Node vuole `Bash(npm:*)`.

Contestualmente `max_turns` sale da 30 a 60 e il tetto di spesa da 2 a 3 dollari:
trenta turni erano comunque stretti per leggere quattro file, implementare, testare,
scrivere un ADR e aprire una PR.

## Conseguenze
Un'installazione della fucina non è completa finché `strumenti_permessi` non riflette
lo stack del progetto. Va aggiunto ai controlli di `init`.

Il fallimento è stato **silenzioso nel modo peggiore**: nessun errore di permesso, solo
un limite di turni esaurito. Il messaggio "Reached maximum number of turns" indicava una
causa sbagliata, e senza leggere il log avremmo alzato i turni bruciando il triplo per lo
stesso risultato. Conferma il principio P3: quello che l'agente riporta di sé non basta.

## Conferma
Il prossimo run deve produrre un branch `fucina/<issue>` con almeno un commit che
modifica `listino/prezzi.py`. Se non compare, la causa è un'altra.
