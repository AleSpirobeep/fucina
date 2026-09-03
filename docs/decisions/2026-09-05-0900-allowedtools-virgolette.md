---
status: accepted
date: 2026-09-05
decision-makers: [Alessio]
---
# I pattern degli strumenti con spazi vanno passati tra virgolette

## Contesto e problema
Durante T3 della spec 002 l'agente PM ha scoperto, leggendo il log del run, che l'elenco
`--allowedTools` arriva all'action **spezzato sugli spazi**. I pattern `Bash(gh issue
view:*)` e `Bash(gh pr view:*)` contengono spazi: l'elenco si tronca a `Bash(gh` e il
resto diventa argomenti spuri. Nessun comando `gh` è mai stato permesso all'agente.

Questo spiega retroattivamente il blocco di `gh issue edit` registrato nell'ADR del
2 settembre (1800), attribuito allora a un mancato match del pattern. Il match non
poteva avvenire perché il pattern non arrivava intero.

`pytest`, `python`, `git` funzionavano: i loro pattern non hanno spazi.

## Decisione
Nel workflow, il valore di `--allowedTools` è racchiuso tra virgolette doppie. È l'unica
modifica. `strumenti_permessi` in `.fucina.yml` resta com'è.

Contestualmente `CLAUDE.md` del repo fucina viene corretto: diceva "test in
`lib.test.js`", in contraddizione con il ruolo (file nuovi) e con il guard (protegge gli
esistenti). Ora dice "un file di test nuovo per task, in `ui/`", e introduce
`ui/fixtures/` per i corpi di PR e le risposte dell'API usate nei test.

## Conseguenze
Da questo momento l'agente può leggere issue e PR con `gh`, anche su altri repo che il
`FUCINA_PAT` copre. Il criterio di T3 ("testata sui corpi reali delle PR #6 e #9 di
fucina-lab") resta, ma i corpi vengono committati come fixture: un test non legge dalla
rete.

Terzo caso in cui un'azione dell'agente non avveniva "in silenzio" per una causa di
configurazione. Il PM l'ha trovata leggendo il log invece di alzare un limite: è il
comportamento che il suo ruolo prescrive, ed è la conferma che serviva.
