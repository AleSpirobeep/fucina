Implementa la funzione pura `estraiSezioni(corpo)` in `ui/lib.js` (REQ-110 parte, REQ-141): dato il corpo markdown di una PR, restituisce `{ nonFatto, fattoInPiu, decisioni }` con il testo di ciascuna sezione o `null` se l'intestazione (`## Non fatto`, `## Fatto in più`, `## Decisioni`, in qualsiasi ordine) non compare.

Il testo di ogni sezione va da dopo l'intestazione fino alla prossima intestazione di livello 2 (o alla fine del corpo); un'intestazione di livello 3+ dentro una sezione non la interrompe. Prima di riconoscere le sezioni, il corpo viene ripulito della coda che il workflow accoda dopo l'ultima sezione (ADR `2026-09-02-1700-pr-aperta-dal-workflow.md`): righe finali `Closes #N` e `Generated with Claude Code ...`. Un `Closes #N` che compare *prima* delle sezioni riconosciute non viene toccato.

**Verificato con:** `node --test "ui/**/*.test.js"` — 77/77 verdi. I nuovi test sono in `ui/estraiSezioni.test.js`, su:
- il corpo reale della PR #6 di `fucina-lab` (salvato in `ui/fixtures/pr-body-6.md`), sezioni in ordine Decisioni/Non fatto/Fatto in più, coda `Closes #5` esclusa;
- il corpo reale della PR #9 di `fucina-lab` (salvato in `ui/fixtures/pr-body-9.md`), con `Closes #8` a metà corpo (non tocca le sezioni) e la coda finale `Generated with Claude Code ...` + `Closes #8` esclusa dall'ultima sezione;
- un corpo senza sezioni (tutte e tre le chiavi `null`);
- una sezione con solo "Nulla" restituita come testo, non `null`;
- intestazioni in ordine sparso;
- un'intestazione di livello 3 dentro una sezione che non la interrompe;
- coda finale (`Closes #N` + riga "Generated with Claude Code") esclusa dall'ultima sezione, caso isolato.

## Decisioni

Nessun ADR nuovo: le regole sulla coda del workflow e sull'ordine delle sezioni erano già decise nei commenti della issue e nell'ADR `2026-09-02-1700-pr-aperta-dal-workflow.md`; l'unica scelta implementativa (livello 3+ non interrompe una sezione) era già stata validata nel tentativo precedente su questa stessa issue.

## Non fatto

Nulla: tutti i criteri di accettazione della issue, inclusi quelli aggiunti nei commenti del PM (fixture reali, esclusione della coda `Closes #N`/`Generated with Claude Code`), sono coperti.

## Fatto in più

Nulla: solo `ui/lib.js`, il nuovo file di test `ui/estraiSezioni.test.js` e le due nuove fixture `ui/fixtures/pr-body-6.md` e `ui/fixtures/pr-body-9.md` sono stati toccati.

Closes #15
