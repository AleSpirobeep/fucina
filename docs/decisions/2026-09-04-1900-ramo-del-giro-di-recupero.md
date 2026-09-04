---
status: accepted
date: 2026-09-04
decision-makers: [analista]
---
# Il giro di recupero lanciato dal Registro usa il ramo di default letto da GitHub

## Contesto e problema
La spec 005 fa lanciare al Registro il giro di recupero del PM con
`POST /repos/REPO/actions/workflows/pm-agent.yml/dispatches`. Quella chiamata **richiede** un
campo `ref`: l'API non ha un default. Lo script equivalente, `pm.ps1 avvia`, non ha il
problema perché usa `gh workflow run` senza `--ref`, e `gh` risolve da sé il ramo di default
del repo. La pagina non ha quel comodo: oggi `ui/github.js` non legge alcun metadato del
repo, quindi il ramo va preso da qualche parte.

L'analisi di coerenza sulla spec 005 ha trovato che né la spec, né il piano, né il contratto
dicevano quale. Un task lasciato così avrebbe tirato a indovinare.

## Opzioni considerate
- **Fissare `main` nel codice**: nessuna chiamata in più, ma sbagliato su qualunque repo il
  cui ramo di default non si chiami `main`, e sbagliato in silenzio — il dispatch fallisce
  con un 422 che non spiega niente.
- **Chiedere il ramo ad Alessio nella configurazione**: nessuna chiamata in più e nessun
  indovinello, ma un campo in più da compilare per ogni repo, che GitHub già conosce.
- **Leggere `default_branch` da `GET /repos/REPO`** (scelta): una chiamata di sola lettura in
  più, con il permesso che il token ha già.

## Decisione
Il Registro legge `default_branch` da `GET /repos/REPO` e lo passa come `ref` del dispatch.
La lettura avviene al momento del comando «Avvia», non a ogni aggiornamento: costa una
chiamata per click, non una al minuto per repo.

Questo rende il Registro e `pm.ps1` indistinguibili nel comportamento — entrambi lanciano il
giro di recupero sul ramo di default del repo — che è la proprietà che conta: i due
interruttori non devono poter divergere.

## Conseguenze
Una chiamata di lettura in più per ogni «Avvia», con un permesso già concesso. Se quella
lettura fallisce, «Avvia» si ferma prima di abilitare il workflow: l'esito è
`non-abilitato` del contratto, quello che per costruzione non lascia stati misti. Nessun
repo con un ramo di default diverso da `main` è escluso dal Registro.
