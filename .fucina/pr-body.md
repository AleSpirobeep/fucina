## Cosa ho fatto

Implementata la lettura dello stato del PM (`L1` del contratto `specs/005-interruttore-nel-registro/contracts/comandi-pm.md`):

- `ui/lib.js`: `urlStatoPm(repo)` costruisce l'URL `GET /repos/REPO/actions/workflows/pm-agent.yml`; `riduciStatoPm(state)` è la funzione pura che riduce il campo `state` ai tre soli valori `acceso`, `spento`, `non-installato` (`null` rappresenta il 404).
- `ui/github.js`: `statoPm(token, repo)` esegue la lettura riusando l'helper `richiesta` già presente, cattura un `ErroreGitHub` con `codice === 404` e lo traduce in `non-installato` invece di rilanciarlo; ogni altro errore risale invariato.
- Fixture `ui/fixtures/workflow-pm-attivo.json` (`state: "active"`) e `ui/fixtures/workflow-pm-disabilitato.json` (`state: "disabled_manually"`), forma della risposta reale dell'endpoint "Get a workflow".
- Test in `ui/stato-pm.test.js`: costruzione URL, riduzione pura per `active`/`disabled_manually`/`disabled_inactivity`/`null`, e `statoPm` per i quattro casi di `github.js` (200 acceso, 200 spento, 404 → non-installato senza eccezione, altro codice → `ErroreGitHub`).

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 197 test, tutti verdi.

## Decisioni

Nulla: nessuna decisione fuori dal contratto, quindi nessun ADR.

## Non fatto

Nulla rispetto ai criteri di accettazione della issue: tutti e quattro sono coperti dai test elencati sopra. Il resto della spec 005 (L2-L4, S1-S3, l'interruttore in `index.html`, `lavoroInAttesa`) è fuori perimetro di questo task, come da issue.

## Fatto in più

Nulla: solo i cinque file elencati nella issue sono stati toccati.

Closes #72
