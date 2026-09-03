---
status: accepted
date: 2026-09-03
decision-makers: [dev-agent]
---
# Tre dettagli implementativi di `pm-agent.yml` non coperti dai contratti

## Contesto e problema
`data-model.md` e `contracts/fucina-yml.md` definiscono il comportamento del PM ma
lasciano scoperti tre casi minori, incontrati scrivendo `template/.github/workflows/
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

**3. Rilancio incondizionato dopo un'azione deterministica.**
`plan.md` (passo 6) descrive: "rieseguire lo script sullo stato aggiornato e, se c'è
ancora lavoro, `gh workflow run`". Ricalcolare lo stato una seconda volta nella stessa
esecuzione avrebbe richiesto duplicare l'intero passo "Raccogli lo stato" (raccolta
non banale, con una chiamata `gh` per PR/issue). **Decisione**: dopo ogni azione
deterministica si rilancia sempre una scansione di recupero, senza ricalcolare prima
se resta lavoro. Il costo è un'esecuzione in più quando la coda si è appena svuotata:
quella esecuzione trova `niente` e non scrive nulla (REQ-242), quindi non viola
REQ-201 (il costo zero riguarda i periodi senza eventi, non l'esecuzione immediatamente
successiva a un'azione reale).

## Conseguenze
Nessun requisito cambia. Il comportamento osservabile per gli scenari di accettazione
di `spec.md` e i collaudi di `quickstart.md` resta quello descritto; le uniche
differenze sono nel numero di esecuzioni "vuote" (un'in più per azione deterministica)
e nella granularità del controllo su `strumenti_permessi` (per elemento invece che
sull'intera stringa).
