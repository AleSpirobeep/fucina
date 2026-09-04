---
status: accepted
date: 2026-09-04
decision-makers: [Alessio]
---
# Il corpo della PR vale solo se il branch l'ha riscritto, e il `Closes #` lo mette il workflow

## Contesto e problema
`.fucina/pr-body.md` è un file **versionato**. Ogni branch dell'agente sviluppatore lo eredita
dal ramo di default, quindi sul branch esiste sempre, con dentro il corpo dell'**ultimo task
fuso**. Il controllo di `dev-agent.yml` era «il file esiste e non è vuoto»: una condizione
sempre vera. Il ramo «corpo mancante», scritto e corretto, non poteva scattare.

Conseguenza osservata tre volte in un giorno (PR #68, #80, e una prima ancora): se l'agente
non riscrive il file, la PR viene aperta con il corpo del task precedente. Il PM la rimanda —
correttamente — perché quel corpo descrive un altro lavoro.

Il secondo sintomo è peggiore del primo. Il corpo stantio contiene già il proprio
`Closes #<vecchia issue>`; il workflow ci aggiungeva in fondo `Closes #<issue corrente>`. La
PR collegava **due** issue, e chi legge il collegamento prende la prima. Il `rimanda` del PM
ha così rimesso `ready-for-dev` sulla issue #72, già chiusa e già fusa: l'agente è ripartito
su un lavoro fatto, ha bruciato un tentativo, e la issue #73 — quella vera — è rimasta senza
alcuna label, fuori dalla coda, dove nessuna regola poteva più ripescarla.

## Opzioni considerate
- **Non versionare `.fucina/pr-body.md`**: toglie l'eredità alla radice, ma l'agente lo
  committa sul branch perché il workflow lo legga da lì. Ignorarlo in git significa che non
  arriva più: il ramo di riserva scatterebbe sempre.
- **Svuotare il file su `main` dopo ogni fusione**: un atto in più da ricordare a ogni ciclo,
  e un file vuoto versionato è una convenzione fragile che nessuno vede.
- **Chiedere al ruolo di ricordarsi di riscriverlo**: è già scritto nel ruolo
  (`dev-agent/SKILL.md`, righe 97-111). Ha fallito tre volte su tre. Un atto di stato
  affidato all'agente può non avvenire, in silenzio: è esattamente ciò che dice P9.
- **Confrontare il file con la versione del ramo di base** (scelta): il corpo vale se e solo
  se *questo* branch l'ha cambiato.

## Decisione
Due correzioni in `dev-agent.yml`, entrambe deterministiche e quindi del workflow (P9).

1. Il corpo della PR viene letto dal branch **solo se differisce da quello del ramo di base**.
   Se il branch non l'ha toccato, o l'ha lasciato identico, scatta il ramo di riserva già
   esistente: PR con corpo minimo e un `::warning::` nel log.
2. Prima di aggiungere il proprio `Closes #`, il workflow **rimuove dal testo dell'agente ogni
   parola chiave di chiusura** (`close/closes/closed`, `fix/fixes/fixed`,
   `resolve/resolves/resolved` seguite da `#numero`). La PR collega esattamente una issue, e
   quale lo decide il workflow, che il numero lo conosce dal proprio input.

La seconda vale anche da sola: nessun testo scritto da un modello può più decidere quale issue
una PR chiude.

## Conseguenze
Il difetto è impossibile, non meno probabile: la condizione «il branch ha riscritto il corpo»
è verificabile dai fatti, non dalla buona volontà dell'agente. Una PR con corpo minimo viene
comunque rimandata dal PM per le sezioni mancanti (REQ-214) — ma senza chiamare il modello, e
soprattutto senza rimettere in lavorazione la issue sbagliata.

Resta un costo: se l'agente dimentica il corpo, il task va rifatto. È il comportamento giusto,
ed è quello che la fucina credeva di avere già.

Verificato prima della fusione riproducendo il difetto su un repo di prova: con il codice
precedente e un branch che non riscrive il corpo la PR risultava con `Closes #72 Closes #73`;
con il codice corretto, solo `Closes #73` e il corpo minimo.
