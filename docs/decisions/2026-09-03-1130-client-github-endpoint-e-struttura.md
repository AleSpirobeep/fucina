---
status: accepted
date: 2026-09-03
decision-makers: [dev-agent]
---
# Il client per l'API di GitHub: endpoint usati e divisione dei file

## Contesto e problema
La issue #17 chiede funzioni che leggano issue aperte e chiuse di recente, PR aperte,
commenti di una issue, stato combinato dei check di una PR e run del workflow
`dev-agent`, con la parte pura (URL, interpretazione degli stati) testata in `lib.js` e
le chiamate `fetch` isolate in funzioni sottili. La spec non indica quali endpoint REST
usare né come dividere i file.

## Opzioni considerate
- Un'unica funzione che chiede tutte le issue con `state=all` e lascia al chiamante il
  filtro tra aperte e chiuse di recente: meno chiamate, ma mescola "aperte" (nessun
  limite temporale) e "chiuse di recente" (limite di 14 giorni) in un solo risultato,
  spostando la responsabilità di filtrare su chi consuma il client.
- Due chiamate separate — issue aperte (`state=open`) e issue chiuse con `since` uguale
  a 14 giorni fa (`state=closed&since=...`) — che rispecchiano direttamente il
  linguaggio della issue e della REQ-120 (colonna "Fatte" con finestra di 14 giorni).
- Per lo stato dei check: l'endpoint "Combined status" (`/commits/{ref}/status`), che
  restituisce già uno stato aggregato (`success`/`failure`/`error`/`pending`), contro
  l'endpoint dei check-runs, che restituirebbe i singoli check e sposterebbe
  l'aggregazione lato client — più lavoro per lo stesso risultato, dato che la REQ-112
  vuole solo verde/rosso/in attesa senza elencare i singoli check.
- Dividere la parte pura e quella con `fetch` nello stesso file `lib.js`, oppure in due
  file: `lib.js` per URL e interpretazione, `github.js` per le funzioni sottili che
  chiamano `fetch`. La issue permette esplicitamente questa seconda opzione.

## Decisione
Due chiamate separate per le issue (aperte e chiuse di recente), l'endpoint "Combined
status" per i check, e la divisione in due file: le funzioni pure (costruzione delle
URL, interpretazione dello stato combinato e degli errori HTTP, calcolo della data di
`N` giorni fa) restano in `lib.js` e sono testate lì; le funzioni che chiamano `fetch`
vivono in `ui/github.js`, un file nuovo, con test che sostituiscono `fetch` globale
(nessuna chiamata di rete vera) per verificare URL, header `Authorization` e gestione
degli errori. L'header usato è `Authorization: Bearer <token>`, la forma raccomandata
attualmente da GitHub per entrambi i tipi di token.

## Conseguenze
Chi userà questo client nei task successivi (T6-T8) riceve già liste separate per
"aperte" e "fatte di recente", pronte per `classifica()`, e uno stato dei check già
ridotto a verde/rosso/in attesa. `ui/github.js` non è ancora importato da
`index.html`: la issue #17 costruisce solo il client, il collegamento alla dashboard è
compito dei task che la usano (T6, T7, T8 in `specs/002-registro/tasks.md`).
