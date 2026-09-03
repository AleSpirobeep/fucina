---
status: accepted
date: 2026-09-03
decision-makers: [dev-agent]
---
# Due dettagli implementativi di `pm-agent.yml` non coperti dai contratti

## Contesto e problema
`data-model.md` e `contracts/fucina-yml.md` definiscono il comportamento del PM ma
lasciano scoperti due casi minori, incontrati scrivendo `template/.github/workflows/
pm-agent.yml` (T002).

## Opzioni considerate e decisione

**1. `check` quando `gh pr checks` non riporta ancora nessun controllo.**
`data-model.md` §1 definisce `verde`/`rosso`/`in-corso` a partire dai `bucket`, ma non
dice cosa fare quando l'elenco è vuoto (PR appena aperta, i check non sono ancora in
coda). Trattarlo come `verde` farebbe rivedere o rimandare una PR prima che i check
siano partiti, contro lo spirito di R8. **Decisione**: elenco vuoto → `in-corso`, come
se un check fosse ancora in sospeso.

**2. Corrispondenza di sottostringa per REQ-270.**
`contracts/fucina-yml.md` dice che il controllo su `strumenti_permessi` avviene "su
corrispondenza di sottostringa", ed elenca `Bash` fra gli strumenti vietati. Una
sottostringa cercata sull'intera stringa unita da virgole avrebbe bloccato anche
`Bash(node:*)` o `Bash(gh pr view:*)` (contengono "Bash" come sottostringa), cioè la
configurazione di default. **Decisione**: la stringa viene divisa per elemento
(`strumenti_permessi` è una lista); `Bash`, `Bash(gh:*)` e `Bash(git:*)` sono
confrontati per uguaglianza esatta con ciascun elemento; gli altri vietati (`gh pr
merge`, `git commit`, …) restano un confronto di sottostringa su ciascun elemento. Il
risultato pratico non cambia per i casi che il contratto vuole vietare, ma non blocca
gli strumenti di sola lettura con pattern.

## Conseguenze
Nessun requisito cambia. Il comportamento osservabile per gli scenari di accettazione
di `spec.md` e i collaudi di `quickstart.md` resta quello descritto; l'unica differenza
è nella granularità del controllo su `strumenti_permessi` (per elemento invece che
sull'intera stringa).

## Nota

Un terzo punto — se rilanciare sempre una scansione di recupero dopo un'azione
deterministica o solo quando resta lavoro — era inizialmente registrato qui come
decisione, ma non lo è: `plan.md` (passo 6) lo copre già esplicitamente ("rieseguire
lo script sullo stato aggiornato e, se c'è ancora lavoro, `gh workflow run`"). La
raccolta dello stato è ora fattorizzata in `template/scripts/raccogli-stato.sh`,
richiamato sia prima della prima decisione sia dopo un'azione deterministica, cosa
che rende il ricalcolo pratico senza duplicare la logica.
