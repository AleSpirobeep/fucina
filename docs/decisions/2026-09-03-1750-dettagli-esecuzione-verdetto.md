---
status: accepted
date: 2026-09-03
decision-makers: [dev-agent]
---
# Due dettagli implementativi dell'esecuzione del verdetto (T003) non coperti dai contratti

## Contesto e problema
`contracts/verdetto.md` definisce lo schema del verdetto e cosa rende un file
non valido, ma lascia due punti minori all'implementazione del passo 9 di
`plan.md`, incontrati scrivendo `template/.github/workflows/pm-agent.yml` (T003).

## Opzioni considerate e decisione

**1. Da dove viene il "tipo" con cui si valida `esito`.**
Il contratto dice che un "esito non ammesso per il tipo" rende il verdetto
`umano`, ma `oggetto.tipo` è scritto dal modello nello stesso file che si sta
validando: un verdetto che si autodichiara del tipo sbagliato potrebbe
scegliersi la tabella di esiti più permissiva. **Decisione**: il workflow
deriva il tipo atteso dal contesto della richiesta (`revisione` → `pr`,
`domanda` → `issue`, note già al momento del dispatch) e lo usa per validare
`esito`, ignorando `oggetto.tipo` ai fini del controllo. Il campo resta nello
schema per leggibilità del file da parte di chi lo ispeziona a mano.

**2. Estrazione dell'issue collegata (`Closes #`) dal corpo della PR nell'esito `rimanda`.**
`pm-coda.js` ha già una funzione equivalente (`issueDaCorpo`, con la stessa
regex `CLOSES_RE`), ma non è tra le funzioni esportate dal contratto di T001
(`decidi`, `estraiSezioniMancanti`, `identificativoTask`), e T003 può toccare
solo `pm-agent.yml`. **Decisione**: la stessa regex (`closes\s*#\d+`,
case-insensitive) è reimplementata in bash con `grep -ioP` nel passo
"Verdetto: rimanda". Duplicazione minima e consapevole; se in futuro serve un
terzo punto di riuso, la funzione va esportata da `pm-coda.js`.

## Conseguenze
Nessun requisito cambia. Un modello che scrivesse `oggetto.tipo` sbagliato non
riesce comunque a far eseguire un esito non ammesso per l'oggetto realmente
lavorato. La regex per l'issue collegata vive in due posti (`pm-coda.js` e
`pm-agent.yml`): se diverge, i comportamenti di `rimanda-check-rossi` /
`rimanda-corpo-incompleto` (scansione) e `rimanda` (verdetto del modello)
potrebbero riconoscere issue diverse dallo stesso corpo di PR.
