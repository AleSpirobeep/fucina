---
status: accepted
date: 2026-09-02
decision-makers: [Alessio]
---
# La PR la apre il workflow, con il corpo scritto dall'agente in un file

## Contesto e problema
Al secondo ciclo (fucina-lab#3) l'agente ha prodotto codice e test corretti ma non ha
aperto la PR, nonostante il ruolo glielo chiedesse e `Bash(gh pr create:*)` fosse fra gli
strumenti permessi. Il passo di ripiego l'ha aperta con un corpo minimo, perdendo le
sezioni "Non fatto" e "Fatto in più".

Il log mostra la causa: il prompt di sistema che `claude-code-action` antepone al ruolo
elenca esplicitamente, fra le cose che l'agente **non può** fare, *"Create pull requests"*,
*"Post multiple comments"* e *"Perform branch operations"*. Il prompt di sistema prevale
sul ruolo: l'agente non ha nemmeno tentato.

Il disegno dell'action è che l'agente lavori sul branch e qualcun altro apra la PR.
Il ruolo stava contraddicendo lo strumento.

Un secondo effetto, scoperto sulla stessa PR: aperta tramite il `FUCINA_PAT`, la PR
risulta creata da Alessio, e GitHub non consente di approvare le proprie PR. La regola
"una approvazione obbligatoria" bloccava proprio l'unica persona che poteva fondere.

## Opzioni considerate
- Sovrascrivere il prompt di sistema dell'action per togliere il divieto: fragile,
  dipende da input non documentati, e va contro il modello di sicurezza dell'action.
- Far scrivere all'agente il corpo come commento sull'issue e leggerlo dal workflow:
  anche "Post multiple comments" è nella lista dei divieti.
- Far scrivere all'agente il corpo in un file sul branch, e far aprire la PR al workflow.

## Decisione
La terza. L'agente termina scrivendo `.fucina/pr-body.md` nel branch; il workflow lo
legge con `git show origin/<branch>:.fucina/pr-body.md`, apre la PR con quel corpo e
aggiunge `Closes #N`. Se il file manca, apre comunque la PR con un corpo che dichiara
la mancanza e un `::warning::` nel run.

`Bash(gh pr create:*)` e `Bash(gh pr edit:*)` escono dagli strumenti permessi: non
servono più, e meno superficie è meglio.

La protezione del branch mantiene "PR obbligatoria" e "check obbligatori" ma porta le
approvazioni richieste a zero: con una sola persona, il cancello è il click su merge
(principio P4), e l'approvazione formale era un lucchetto che si chiudeva su chi lo
teneva.

## Conseguenze
Il file `.fucina/pr-body.md` entra nel diff della PR e, al merge, in `main`. È un
compromesso accettato in v1: il corpo dell'ultima PR resta versionato accanto al codice
che descrive. Registrato come debito D-03: alternativa più pulita è leggere il report
dall'ultimo commento dell'action, che però dipende da un formato non garantito.

Il ruolo dell'agente si chiude un passo prima: branch spinto e corpo scritto. Aprire la
PR, etichettarla e chiudere lo stato dell'issue sono del workflow — che è deterministico,
mentre l'agente non lo è.
