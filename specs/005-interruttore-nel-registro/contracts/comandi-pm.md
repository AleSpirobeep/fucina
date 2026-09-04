# Contratto — i comandi del PM dal Registro

L'interfaccia fra la pagina e l'API di GitHub per leggere e comandare `pm-agent.yml`. Il
Registro non ha un backend: questo contratto è ciò che sostituisce un'API propria.

## Le chiamate

`WF` è il nome del file del workflow, sempre `pm-agent.yml`. `REPO` è `proprietario/nome`.

| # | scopo | metodo e percorso | REQ |
| - | ----- | ----------------- | --- |
| L1 | stato del PM | `GET /repos/REPO/actions/workflows/WF` | REQ-401, 404 |
| L2 | ultima esecuzione | `GET /repos/REPO/actions/workflows/WF/runs?per_page=1` | REQ-402 |
| L3 | esecuzioni in corso | `GET /repos/REPO/actions/workflows/WF/runs?status=in_progress` | REQ-412 |
| L4 | ramo di default | `GET /repos/REPO`, campo `default_branch` | REQ-414 |
| S1 | ferma | `PUT /repos/REPO/actions/workflows/WF/disable` | REQ-411 |
| S2 | avvia | `PUT /repos/REPO/actions/workflows/WF/enable` | REQ-414 |
| S3 | giro di recupero | `POST /repos/REPO/actions/workflows/WF/dispatches` con `{"ref": "<ramo di default>"}` | REQ-414 |

`S1`, `S2` e `S3` sono le **uniche** scritture nuove (REQ-443). `L1`, `L2`, `L3` richiedono
`Actions: read`; `S1`, `S2`, `S3` richiedono `Actions: write`; `L4` non richiede `Actions`.

`L4` si esegue **solo** al click su «Avvia», non a ogni aggiornamento: l'API dei dispatch
esige un `ref` e non ne ha uno di default, mentre `gh workflow run` — usato da `pm.ps1` — lo
risolve da sé. Leggerlo invece di fissare `main` è ciò che tiene i due interruttori
indistinguibili; la scelta e le alternative stanno in
`docs/decisions/2026-09-04-1900-ramo-del-giro-di-recupero.md`.

## Gli stati letti

`L1` restituisce un campo `state`. La pagina lo riduce a tre valori, e solo a questi:

| valore | quando | cosa mostra |
| ------ | ------ | ----------- |
| `acceso` | `state` è `active` | «PM: acceso», pulsante «Ferma» |
| `spento` | `state` è qualunque altro valore (`disabled_manually`, `disabled_inactivity`, …) | «PM: spento», pulsante «Avvia» |
| `non-installato` | `L1` risponde 404 | «PM non installato», nessun pulsante (REQ-404) |

Un 404 su `L1` **non** è un errore: è uno stato. Ogni altro codice diverso da 200 è un
errore e finisce nel canale di REQ-403.

## Gli esiti dei comandi

`Ferma` è una sola chiamata (`S1`) seguita da `L3` per elencare ciò che finirà il ciclo.

`Avvia` è `L4` per ottenere il ramo, poi due chiamate in ordine fisso (REQ-414): prima `S2`,
poi `S3`. Un fallimento di `L4` ferma tutto prima di abilitare, quindi vale come
`non-abilitato`. Gli esiti possibili
sono tre, e la pagina li distingue (REQ-415):

| esito | cosa è successo | stato risultante |
| ----- | --------------- | ---------------- |
| `riuscito` | `S2` e `S3` riuscite | PM acceso, giro di recupero avviato |
| `solo-abilitato` | `S2` riuscita, `S3` fallita | PM acceso, nessun giro: un secondo «Avvia» rimedia |
| `non-abilitato` | `S2` fallita | PM spento, `S3` **non** viene tentata |

L'ordine è ciò che rende innocuo il fallimento parziale: non esiste un esito in cui parte un
giro di recupero su un PM spento.

## I messaggi d'errore

Sono in italiano e nominano la causa, mai il token (REQ-430, REQ-431).

| codice HTTP | messaggio |
| ----------- | --------- |
| `403` su `S1`, `S2` o `S3` | dice che al token manca il permesso `Actions: read and write` e dove si concede |
| `404` su `S1`, `S2` o `S3` | dice che `pm-agent.yml` non risulta installato su quel repo |
| `401` | dice che il token non è valido, e rimanda a «Configurazione» |
| altro | il messaggio già usato dalla pagina (`messaggioErroreHttp`), con il nome del repo |

Gli stessi messaggi valgono per le letture `L2`, `L3` e `L4`, che finiscono nel canale di
REQ-403. Fa eccezione `L1`, dove il 404 è lo stato `non-installato` e non un errore.

## Il lavoro in attesa

`lavoroInAttesa` è una funzione pura dei dati che il Registro **ha già scaricato** per la
tabella di REQ-120, non una chiamata nuova:

```js
lavoroInAttesa(issues, prs) -> { prDaRevisionare, domande, inCoda, totale }
```

- `prDaRevisionare`: PR aperte con `needs-review`;
- `domande`: issue aperte con `needs-human` **escluse** quelle con `rapporto-pm`;
- `inCoda`: issue aperte con `in-coda`.

L'avviso di REQ-420 compare quando lo stato è `spento` **e** `totale > 0`. Con lo stato
`acceso` o `non-installato` non compare mai (REQ-421).
