## Cosa ho fatto

Implementata la lettura `L2` del contratto `specs/005-interruttore-nel-registro/contracts/comandi-pm.md` e il conteggio dei task in coda.

- `ui/lib.js`:
  - `contaInCoda(issues)` conta, **dai dati già scaricati per la tabella di REQ-120** (nessuna chiamata nuova), le issue aperte con l'etichetta `in-coda`, escludendo le PR mischiate nell'elenco issue e le issue chiuse.
  - `urlUltimaEsecuzionePm(repo)` costruisce l'URL `GET /repos/REPO/actions/workflows/pm-agent.yml/runs?per_page=1` (`L2`).
  - `riduciUltimaEsecuzionePm(runs)` è la funzione pura che estrae `esito`, `data` e `url` dal primo run: un run concluso (`status === "completed"`) espone `conclusion`, uno ancora in corso espone `status`; un elenco vuoto o assente dà `{ esito: "nessuna", data: null, url: null }`, senza sollevare errore.
- `ui/github.js`: `ultimaEsecuzionePm(token, repo)` esegue la lettura `L2` e applica `riduciUltimaEsecuzionePm`. A differenza di `statoPm` (`L1`), qui un 404 **non** è uno stato speciale: risale come `ErroreGitHub`, come da contratto ("Fa eccezione `L1`...").
- Fixture `ui/fixtures/run-pm-ultima.json`: forma reale della risposta "List workflow runs" con un run concluso.
- Test in `ui/ultima-esecuzione.test.js`: `contaInCoda` (etichettate, chiuse escluse, PR mischiate escluse, elenco vuoto/assente), costruzione dell'URL `L2`, `riduciUltimaEsecuzionePm` (concluso, in corso, assenza di run) e `ultimaEsecuzionePm` (concluso via fixture, assenza di run senza eccezione).

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 207 test, tutti verdi.

## Decisioni

Nulla: nessuna decisione fuori dal contratto, quindi nessun ADR.

## Non fatto

Nulla rispetto ai criteri di accettazione della issue: i quattro sono coperti dai test elencati sopra. La riga del PM nell'interfaccia (`ui/index.html`) è T003, fuori da questo task; `lavoroInAttesa` e l'interruttore stesso restano fuori perimetro come da issue.

## Fatto in più

Nulla: solo i quattro file elencati nella issue sono stati toccati.

Closes #73
