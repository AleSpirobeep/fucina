Aggiunge `classifica(issues, prs, oggi)` in `ui/lib.js`: una funzione pura che smista issue
e PR nelle sei colonne dell'avanzamento (REQ-120, REQ-141, OP-204).

- `backlog`: issue aperte senza label di stato (`ready-for-dev`, `in-progress`, `needs-human`).
- `pronte`: issue aperte con `ready-for-dev`.
- `inLavorazione`: issue aperte con `in-progress`.
- `inRevisione`: PR aperte con `needs-review`.
- `bloccate`: issue aperte con `needs-human`.
- `fatte`: issue chiuse negli ultimi 14 giorni (finestra da OP-204), inclusa la chiusura
  esattamente 14 giorni fa.

Se un'issue ha più label di stato, vince la più avanzata nell'ordine
`needs-human > in-progress > ready-for-dev`. Le PR non finiscono mai in backlog, nemmeno
se compaiono mischiate nell'elenco `issues` (come fa l'endpoint `/issues` di GitHub, che
include anche le PR con la chiave `pull_request`).

Nessun accesso alla rete, nessun DOM: solo trasformazione di array in ingresso.

Verificato con: `node --test "ui/**/*.test.js"` — 26 test verdi, 13 nuovi in
`ui/classifica.test.js` (uno per colonna, il caso delle due label, i due casi limite sui
14 giorni, la PR mischiata nell'elenco issue, la PR chiusa, l'issue chiusa senza
`closed_at`).

Closes #16.

## Decisioni
Nessun ADR aggiunto: la spec 002 e la issue definivano già le sei colonne, l'ordine di
priorità delle label e la finestra dei 14 giorni (OP-204), senza punti ambigui da
decidere.

## Non fatto
Nulla rispetto ai criteri di accettazione della issue.

## Fatto in più
Nulla: solo `ui/lib.js` (la funzione `classifica` e i suoi helper privati) e il nuovo file
di test `ui/classifica.test.js`.
