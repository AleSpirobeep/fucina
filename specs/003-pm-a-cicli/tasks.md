# Task: Il PM a cicli

**Input**: `specs/003-pm-a-cicli/` — `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/`, `quickstart.md`.

**Test**: richiesti dalla spec (P2): la logica di decisione ha test su fixture; i workflow
si verificano con `yq` e con il collaudo in `quickstart.md`.

**Stato** (3/9/2026): T001–T007 fusi dal loop (PR #51–#65). Questa spec è nata prima del
cancello dell'analista (spec 004): passata al cancello a posteriori segnala, oltre ai
difetti corretti, un falso positivo atteso su T001 (`pm-coda.test.js` oggi esiste, ma il
task lo creava). Resta T008.

**Organizzazione**: un task = una issue = una PR, lavorata dall'agente sviluppatore e
revisionata dal PM. Ordine sequenziale (il loop lavora una issue per volta); `[P]` indica
che il task non dipende dal precedente e potrebbe andare in parallelo.

## Formato: `[ID] [P?] [Scenario] Descrizione`

- **[P]**: file diversi, nessuna dipendenza
- **[US1..US4]**: scenario d'uso della spec (1 lavoro a eventi, 2 interruttore, 3 rapporto,
  4 costo zero)

## Fase 0: preparazione (a cura di Alessio, nel pacchetto di installazione — non sono issue)

- [ ] T000 Aggiornare `.fucina.yml` della fucina: `test_command` con il glob
      `template/scripts/**/*.test.js`, `template/scripts/*.test.js` tra i percorsi protetti,
      `Bash(yq:*)` tra gli strumenti permessi; aggiornare `CLAUDE.md` con la cartella
      `template/scripts/`; committare l'ADR `docs/decisions/2026-09-03-1600-pm-a-cicli.md`
      ed emendare la riga di P4 nella costituzione; committare `specs/003-pm-a-cicli/` e
      `.specify/` di Spec Kit; creare le issue con `scripts/crea-issue-003.ps1`.

## Fase 1: fondamenta

- [ ] T001 [US1][US4] Script di decisione `template/scripts/pm-coda.js` con test
      `template/scripts/pm-coda.test.js` e le 12 fixture di `contracts/pm-coda.md` in
      `template/scripts/fixtures/` (comprese le copie di `ui/fixtures/pr-body-6.md` e
      `pr-body-9.md`). Esporta `decidi`, `estraiSezioniMancanti`, `identificativoTask`;
      CLI su stdin/stdout. Nessuna dipendenza. Copre REQ-210, 211, 212, 213 (decisione),
      214 (decisione), 215 (decisione), 216. Verifica: `node --test
      "template/scripts/**/*.test.js"` verde; ogni fixture della tabella del contratto
      produce la decisione attesa; la CLI esce 2 su input non valido e 0 altrimenti.

## Fase 2: il workflow

- [ ] T002 [US1][US4] Workflow `template/.github/workflows/pm-agent.yml`, prima parte:
      trigger e filtri (REQ-202), concurrency (REQ-204), configurazione con default e
      controllo degli strumenti di mutazione (`contracts/fucina-yml.md`, REQ-270),
      issue di rapporto (REQ-240), raccolta dello stato (`data-model.md` §1), decisione
      con `node scripts/pm-coda.js`, azioni deterministiche `avvia-task`,
      `attendi-check`, `rimanda-check-rossi`, `rimanda-corpo-incompleto` (REQ-211, 213,
      214, 215), commento sul rapporto (REQ-241, 242), rilancio in `scansione` se resta
      lavoro e rilancio in `workflow_dispatch` per `revisione`/`domanda` (REQ-205, R3).
      Per costruzione copre REQ-201 (nessun processo tra gli eventi) e REQ-203 (stato
      riletto a ogni esecuzione).
      In questa parte le esecuzioni `revisione`/`domanda` terminano con un messaggio nel
      log «modello: T003». Verifica: `yq '.' file` esce 0; il file dichiara i permessi
      `contents: write, issues: write, pull-requests: write, actions: write`.
- [ ] T003 [US1][US3] Workflow `pm-agent.yml`, seconda parte: passo «Esegui il PM» con
      `anthropics/claude-code-action@v1` solo in `workflow_dispatch` con `azione` diversa da
      `scansione` (REQ-220, 230), prompt con `CARTELLA_FUCINA`, `claude_args` da
      `.fucina.yml` (`--allowedTools` tra virgolette); esecuzione del verdetto secondo
      `contracts/verdetto.md` (REQ-222, 223, 224, 231, 232, 233), pubblicazione degli ADR su
      `main` con il PAT (REQ-234), commento sul rapporto, passo di fallimento con link al
      log (REQ-271: nessun `--admin`, nessun bypass). Verifica: `yq '.' file` esce 0;
      nessuna stringa `--admin`; il passo del modello ha `if:` sull'evento e sull'azione.

## Fase 3: il ruolo

- [ ] T004 [P] [US1][US3] Riscrivere `plugin/skills/pm-agent/SKILL.md` per il ciclo singolo:
      invocazione «Revisiona la PR #N» / «Rispondi alla issue #N», letture nell'ordine
      (costituzione, spec dedotta dal `T` del titolo, ADR, `CLAUDE.md`, ruolo dev-agent),
      gli otto punti di revisione invariati, il verdetto come unico output
      (`contracts/verdetto.md`), gli ADR in `CARTELLA_FUCINA/decisioni/`, "Quando ti fermi"
      tradotto in esito `umano`; sezione «Cosa non fai, mai» aggiornata (nessun `gh` di
      scrittura, nessun `git`) (REQ-221, REQ-272). Verifica: il file non contiene `gh pr merge`, `gh pr close`,
      `gh issue edit`, `gh issue comment`, `git push` se non nella sezione dei divieti; è
      leggibile in meno di cinque minuti (< 250 righe).

## Fase 4: l'interruttore

- [ ] T005 [P] [US2] Script `template/scripts/pm.ps1` con i comandi `avvia`, `ferma`,
      `stato` (REQ-250, 251, 252): UTF-8 con BOM, PowerShell 5.1 (niente `&&`, niente
      operatori ternari), `$ErrorActionPreference = "Stop"`, solo `gh`; `stato` mostra
      acceso/spento, PR `needs-review`, issue `needs-human` (escluso `rapporto-pm`), issue
      `in-coda`, issue `ready-for-dev`/`in-progress`, ultima esecuzione con esito e link;
      un comando sconosciuto o assente stampa l'uso ed esce con codice 1. Verifica: il file
      inizia con il BOM (`EF BB BF`); non contiene la stringa `token`; `avvia` esegue
      `gh workflow enable` **prima** di `gh workflow run`.

## Fase 5: la spec 001 e l'installazione

- [ ] T006 [P] [US1] `template/.github/workflows/dev-agent.yml` (REQ-262): nel passo
      «Segnala il fallimento del run» usare `secrets.FUCINA_PAT || secrets.GITHUB_TOKEN` e
      aggiungere `--add-label ready-for-dev`; nel job `implementa` aggiungere alla
      condizione `!contains(github.event.issue.labels.*.name, 'rapporto-pm')`. Nient'altro
      cambia. Verifica: `yq '.' file` esce 0; il diff tocca solo quelle due righe più il
      commento che le spiega.
- [ ] T007 [US1][US2] Installazione (REQ-260, 261): `init.sh` copia
      `template/.github/workflows/pm-agent.yml`, `template/scripts/pm-coda.js`,
      `template/scripts/pm.ps1` e `plugin/skills/pm-agent/SKILL.md`
      (→ `.claude/skills/pm-agent/SKILL.md`) con la funzione `copia` esistente, crea le label
      `in-coda` (colore `5A6E8C`, «In coda: il PM la avvierà al suo turno») e `rapporto-pm`
      (colore `2C6E49`, «Issue di rapporto del PM») con `crea_label`, e aggiunge ai passi
      manuali: il login `gh` deve avere lo scope `workflow`; il PM parte disabilitato e si
      avvia con `scripts/pm.ps1 avvia`. `template/.fucina.yml` riceve la chiave `pm` con i
      default di `contracts/fucina-yml.md`; `template/CLAUDE.md` riceve una riga sul PM e
      sul rapporto; `README.md` una sezione «Il PM a cicli» di al più 30 righe. Verifica:
      `bash -n init.sh` esce 0; `yq '.pm.max_turns' template/.fucina.yml` stampa 40.

## Fase 6: collaudo (a cura di Alessio e del PM — non è una issue per l'agente)

- [ ] T008 Installare con `init.sh` su `fucina-lab` e su `fucina`, eseguire `quickstart.md`
      per intero, riportare gli esiti nella tabella di stato di verifica in `spec.md` (da
      creare, come nella spec 001), chiudere la sessione desktop del PM e ritirare il ruolo
      vecchio.

## Dipendenze e ordine

- T001 → T002 → T003 (lo script prima del workflow che lo chiama; la prima parte del
  workflow prima della seconda).
- T004 dipende solo dai contratti: può andare dopo T001. T005 e T006 sono indipendenti.
- T007 dopo T002, T003, T004, T005 (deve esistere ciò che copia).
- T008 dopo tutto, con T000 già fatto.

Ordine per il PM (una issue alla volta): **T001, T002, T003, T004, T005, T006, T007**.

## Note per l'agente sviluppatore

- I file sotto `template/` **non sono** i workflow attivi di questo repo: sono modelli
  copiati da `init.sh` nel repo di destinazione. Modificarli è il compito; il guard protegge
  `.github/workflows/**` alla radice, non `template/`.
- Ogni task ha un file di test nuovo dove la logica è testabile (T001); per i workflow e lo
  script PowerShell la verifica è quella indicata nel task, da eseguire e citare nel corpo
  della PR.
- Le decisioni non coperte dai contratti vanno in un ADR; se toccano sicurezza, token o
  permessi, fermati e chiedi.
