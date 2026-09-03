Implementa la sezione **"Aspettano te"** (REQ-110, REQ-111, REQ-112, REQ-113) in cima alla dashboard: per ogni repo configurato, le issue con `needs-human` (con in linea l'ultimo commento) e le PR con `needs-review` (con le sezioni **Non fatto**/**Fatto in più** estratte dal corpo e lo stato dei check verde/rosso/in attesa). Se la coda è vuota su tutti i repo, la sezione mostra "Niente aspetta te".

Due nuove funzioni pure in `ui/lib.js`, che riusano quanto fatto da T3 (client GitHub) e T5 (`estraiSezioni`, `classifica`):
- `ultimoCommento(commenti)`: corpo dell'ultimo commento di un elenco, o `null` se vuoto.
- `elementoPrCoda(pr)`: numero, titolo, url e le due sezioni (`nonFatto`, `fattoInPiu`) estratte dal corpo della PR con `estraiSezioni`.

`ui/index.html` aggiunge la sezione `#aspettanoTe`: per repo, chiama `classifica()` su issue aperte e PR aperte per ottenere `bloccate`/`inRevisione`, poi per ogni issue bloccata recupera i commenti (`commentiIssue`) e per ogni PR in revisione lo stato dei check (`statoCheckPr` sulla `head.sha`). Ogni elemento porta il link a GitHub (REQ-111). Un errore su un repo mostra il messaggio d'errore invece di lasciar intendere una coda vuota; "Niente aspetta te" compare solo quando nessun repo ha elementi e nessuno è andato in errore.

**Verificato con:** `node --test "ui/**/*.test.js"` — 83/83 verdi. I nuovi test sono in `ui/aspettano-te.test.js`:
- `ultimoCommento` su elenco vuoto/assente (`null`), su un elenco semplice, e sui commenti reali della issue 1 di `fucina-lab` (fixture `ui/fixtures/issue-1-fucina-lab-commenti.json`, presi da `gh issue view 1 --repo AleSpirobeep/fucina-lab --comments`): restituisce il commento sui tentativi esauriti, non il primo della lista;
- `elementoPrCoda` sul corpo reale della PR #6 di `fucina-lab` (fixture già esistente `ui/fixtures/pr-body-6.md`), e su un corpo senza sezioni (`nonFatto`/`fattoInPiu` a `null`);
- `classifica` su elenchi vuoti conferma `bloccate`/`inRevisione` vuoti (base della coda vuota).

La combinazione con `statoCheckPr` (che richiede una chiamata di rete per il check status) e il rendering non sono testabili senza browser/rete: verificati leggendo il codice contro REQ-112 (tre soli stati, nessun check elencato) e REQ-113.

## Decisioni

Nessun ADR nuovo: la divisione `lib.js`/`github.js` e gli endpoint da usare erano già decisi nell'ADR `2026-09-03-1131-client-github-check-run-e-struttura.md` (T5); qui la coda riusa semplicemente `commentiIssue` e `statoCheckPr` senza toccare `fetch`.

## Non fatto

Nulla: i tre criteri di accettazione della issue sono coperti (issue 1 di `fucina-lab` con il suo ultimo commento, PR `needs-review` con le due sezioni, messaggio "Niente aspetta te" a coda vuota).

## Fatto in più

Nulla: solo `ui/lib.js`, `ui/index.html`, il nuovo file di test `ui/aspettano-te.test.js` e la nuova fixture `ui/fixtures/issue-1-fucina-lab-commenti.json` sono stati toccati.

Closes #18
