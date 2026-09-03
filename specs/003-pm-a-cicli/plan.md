# Piano di implementazione: Il PM a cicli

**Cartella**: `specs/003-pm-a-cicli` | **Data**: 2026-09-03 | **Spec**: [spec.md](spec.md)

**Input**: la specifica in `specs/003-pm-a-cicli/spec.md`; la costituzione; la spec 001
(`specs/001-dev-loop/spec.md`) e il workflow `template/.github/workflows/dev-agent.yml`,
di cui questo piano riusa la struttura passo per passo.

## Sintesi

Il PM smette di essere una sessione desktop che interroga GitHub ogni minuto e diventa un
**workflow GitHub Actions a cicli** (`pm-agent.yml`), svegliato dagli eventi del repo. Ogni
esecuzione rilegge lo stato da GitHub, lo passa a uno **script di decisione puro e testato**
(`scripts/pm-coda.js`) che sceglie *una* azione, e:

- se l'azione è deterministica (avviare il task successivo, rimandare una PR con check
  rossi o corpo incompleto), la esegue con `gh` e termina — zero token;
- se richiede giudizio (revisionare una PR, rispondere a una domanda), rilancia sé stesso in
  modalità `workflow_dispatch` con l'oggetto da lavorare; quella esecuzione chiama il modello
  con il ruolo `pm-agent`, che produce **solo un file di verdetto** (e, se decide, file ADR);
  il workflow esegue il verdetto (fusione, chiusura, commenti, label) e pubblica gli ADR su
  `main`.

L'interruttore è l'abilitazione del workflow (`gh workflow enable | disable`), incapsulata in
`scripts/pm.ps1 avvia | ferma | stato`; `avvia` lancia anche un giro di recupero.

## Contesto tecnico

**Linguaggio/versione**: YAML di GitHub Actions; bash nei passi del workflow (`gh`, `yq`,
`jq`); JavaScript su Node ≥ 20 (preinstallato sui runner `ubuntu-latest`) per lo script di
decisione, senza dipendenze; PowerShell 5.1 per `pm.ps1`.

**Dipendenze principali**: `anthropics/claude-code-action@v1` (già in uso), `gh` CLI (sul
runner e sul PC di Alessio), `FUCINA_PAT` e `CLAUDE_CODE_OAUTH_TOKEN` (già presenti).

**Stato**: nessuno oltre GitHub — label, commenti, issue di rapporto. Il file di verdetto e
gli ADR scritti dal modello vivono in `$RUNNER_TEMP` durante l'esecuzione.

**Test**: `node --test` sui file `template/scripts/*.test.js` con fixture JSON in
`template/scripts/fixtures/`; i workflow si verificano con `yq` (YAML valido) e con i
collaudi manuali elencati in `quickstart.md`.

**Piattaforma**: runner `ubuntu-latest`; PC Windows con PowerShell 5.1 per i comandi.

**Tipo di progetto**: automazione di repository (workflow + script), dentro il toolkit
`template/` della fucina, installata da `init.sh`.

**Obiettivi di costo**: zero esecuzioni a lavoro fermo; una chiamata al modello per PR
revisionata e per domanda; tetti in `.fucina.yml` (`pm.max_turns`, `pm.max_budget_usd`).

**Vincoli**: nessuno strumento di mutazione al modello (REQ-270); il workflow del PM è
serializzato per repo (REQ-204); una esecuzione = un oggetto (REQ-205); l'agente
sviluppatore non può modificare `.github/workflows/` del repo, quindi tutto vive in
`template/` ed è installato da un umano.

**Scala**: un repo alla volta, poche decine di issue, PR di poche centinaia di righe.

## Verifica della costituzione

*Cancello: da superare prima della fase 0 e di nuovo dopo la fase 1.*

| Principio | Esito | Come |
|---|---|---|
| P1 repo unica fonte di verità | ✅ | stato in label/commenti/issue; nessun servizio esterno; verdetto e ADR finiscono in git o in commenti GitHub |
| P2 requisiti testabili | ✅ | ogni REQ ha una verifica; la logica di decisione è una funzione pura testata su fixture |
| P3 nessun agente giudica il proprio lavoro | ✅ | il PM (istanza distinta) giudica; non scrive codice; il workflow è l'arbitro finale sulla fusione (check obbligatori) |
| P4 il merge è umano | ⚠️ eccezione già in vigore | ADR `2026-09-02-2100-pm-agent-fonde.md` limitava l'eccezione alla spec 002: **va emendato** per estenderla a ogni spec lavorata dal PM a cicli. È una decisione di Alessio, registrata nell'ADR `2026-09-03-1600-pm-a-cicli.md` e con la riga di P4 aggiornata (atto umano, nel pacchetto di installazione) |
| P5 ogni decisione lascia traccia | ✅ | ADR scritti dal ruolo, pubblicati dal workflow; rapporto per ogni azione |
| P6 affittare, non costruire | ✅ | Actions, label, issue, `gh workflow enable/disable`; niente scheduler, niente servizio |
| P7 ogni esecuzione ha un tetto | ✅ | `pm.max_turns`, `pm.max_budget_usd`, `timeout-minutes`, attesa massima check |
| P8 init idempotente | ✅ | stesse funzioni `copia`/`crea_label` di `init.sh` |
| P9 il deterministico lo fa il workflow | ✅ | è il cuore del piano: lo script decide, il workflow agisce, il modello solo giudica |

Nessuna violazione da giustificare. Un solo emendamento (P4), umano, prima dell'installazione.

## Struttura del progetto

### Documentazione (questa spec)

```text
specs/003-pm-a-cicli/
├── spec.md              # specifica
├── plan.md              # questo file
├── research.md          # fase 0: decisioni tecniche e alternative scartate
├── data-model.md        # fase 1: stato del repo, decisione, verdetto
├── quickstart.md        # fase 1: collaudo passo per passo
├── contracts/
│   ├── pm-coda.md       # contratto dello script di decisione (input/output, tabella)
│   ├── verdetto.md      # contratto del file di verdetto scritto dal ruolo
│   └── fucina-yml.md    # chiave `pm` di .fucina.yml
├── checklists/requirements.md
└── tasks.md             # fase 2 (/speckit-tasks)
```

### Codice (radice del repo)

```text
template/
├── .fucina.yml                       # + chiave `pm`
├── .github/workflows/
│   ├── dev-agent.yml                 # REQ-262: riavvio automatico su run fallito; salta rapporto-pm
│   └── pm-agent.yml                  # NUOVO: il PM a cicli
├── scripts/
│   ├── pm-coda.js                    # NUOVO: decisione pura + CLI (stdin JSON → stdout JSON)
│   ├── pm-coda.test.js               # NUOVO: test su fixture
│   ├── fixtures/                     # NUOVO: stati del repo di prova (JSON)
│   └── pm.ps1                        # NUOVO: avvia | ferma | stato
└── CLAUDE.md                         # una riga sul PM

plugin/skills/pm-agent/SKILL.md       # RISCRITTO: ruolo a ciclo singolo, produce verdetto
init.sh                               # copia i nuovi file, crea le label in-coda e rapporto-pm
docs/decisions/2026-09-03-1600-pm-a-cicli.md   # ADR (umano)
.fucina.yml                           # fucina su sé stessa: test_command con il nuovo glob (umano)
```

**Decisione di struttura**: tutto ciò che deve girare nel repo di destinazione sta in
`template/` ed è copiato da `init.sh` (come per la spec 001). Lo script di decisione vive
in `template/scripts/` con i suoi test accanto, e il comando dei test della fucina su sé
stessa aggiunge il glob `template/scripts/**/*.test.js`. Nel repo della fucina i file
installati (`.github/workflows/pm-agent.yml`, `scripts/pm-coda.js`, `scripts/pm.ps1`) sono
copie fatte da Alessio con `init.sh`, come oggi per `dev-agent.yml`.

## Disegno

### Il workflow `pm-agent.yml`

```yaml
on:
  pull_request:  { types: [labeled, unlabeled, closed] }
  issues:        { types: [labeled, unlabeled, closed] }
  workflow_dispatch:
    inputs:
      azione: { type: choice, options: [scansione, revisione, domanda], default: scansione }
      numero: { type: number, required: false }
concurrency: { group: pm-agent, cancel-in-progress: false }
```

Un solo job, `ciclo`, che filtra gli eventi in `if:` (label tra `needs-review`,
`needs-human`, `in-coda`; qualsiasi `closed`; qualsiasi `unlabeled` di `needs-human`) e poi:

1. **Checkout di `main`** (mai del ref della PR: lo script e la configurazione si leggono
   dal ramo di default).
2. **Configurazione** (`yq` su `.fucina.yml`, chiave `pm`, con default).
3. **Rapporto**: trova l'issue aperta con `rapporto-pm`; se manca la crea (REQ-240).
4. **Stato**: raccoglie con `gh ... --json` le PR aperte con `needs-review` (numero, corpo,
   label, branch, check via `gh pr checks --json`), le issue aperte con label di stato,
   le issue `in-coda`, l'ultimo commento delle issue `needs-human` → un unico JSON
   (`data-model.md`).
5. **Decisione**: `node scripts/pm-coda.js < stato.json` → `{azione, numero, motivo,
   dettagli}` (contratto in `contracts/pm-coda.md`). Se `azione == niente`: fine, senza
   commenti (REQ-242).
6. **Azioni deterministiche** (`gh`, con `FUCINA_PAT`): `avvia-task`, `rimanda-check-rossi`,
   `rimanda-corpo-incompleto`, `attendi-check` (`gh pr checks --watch` con tetto; oltre il
   tetto → `needs-human` + rapporto). Poi commento sul rapporto e **rilancio**: se lo
   script, rieseguito sullo stato aggiornato, trova ancora lavoro, `gh workflow run
   pm-agent.yml` (con `GITHUB_TOKEN`, permesso `actions: write`: il `workflow_dispatch` è
   l'unica eccezione alla regola "il GITHUB_TOKEN non sveglia workflow").
7. **Azioni con giudizio** (`revisione`, `domanda`): se l'evento non è già un
   `workflow_dispatch` con quell'azione, il job **si rilancia** in `workflow_dispatch` con
   `azione` e `numero` e termina. Motivo: la chiamata al modello avviene sempre nel contesto
   `workflow_dispatch`, l'unico già collaudato con l'action (niente comportamento automatico
   dell'action sui branch della PR, `track_progress` spento).
8. **Modello** (solo in `workflow_dispatch` con `azione != scansione`):
   `anthropics/claude-code-action@v1`, prompt `/pm-agent` + «Revisiona la PR #N» oppure
   «Rispondi alla issue #N», `--allowedTools` = `pm.strumenti_permessi` (lettura + `gh pr
   view/diff/checks`, `gh issue view`, `gh run view`, `Write` limitato per convenzione a
   `$RUNNER_TEMP/fucina/`), `--max-turns`, `--max-budget-usd`.
9. **Esecuzione del verdetto**: legge `$RUNNER_TEMP/fucina/verdetto.json` (contratto in
   `contracts/verdetto.md`); assente o invalido → `umano` con commento standard
   (REQ-222). Per ogni ADR in `$RUNNER_TEMP/fucina/decisioni/*.md`: copia in
   `docs/decisions/`, commit e push su `main` con il PAT (REQ-234). Poi, per esito:
   - `fondi`: `gh pr merge N --squash --delete-branch`; su errore → `needs-human` sulla PR
     con l'errore (REQ-223);
   - `rimanda`: commento sulla PR, `gh pr close N --delete-branch`, stesso commento
     sull'issue collegata (`Closes #` nel corpo), `ready-for-dev` (REQ-224);
   - `rispondi`: commento, `-needs-human +ready-for-dev` (REQ-231);
   - `umano`: commento con marcatore `<!-- fucina:pm-umano -->`, `+needs-human` sulla PR
     (le issue ce l'hanno già) (REQ-232, REQ-216);
   - `riscrivi`: crea le nuove issue con `in-coda`, chiude l'originale con commento
     (REQ-233).
   Infine commento sul rapporto (REQ-241) e rilancio in `scansione` se resta lavoro.
10. **Fallimento del job**: commento sul rapporto con il link al log; nessun riavvio
    automatico (caso limite della spec).

### Lo script `pm-coda.js`

Funzione pura `decidi(stato)` esportata, più un `main` che legge JSON da stdin e scrive la
decisione su stdout. Tabella completa in `contracts/pm-coda.md`. Regole in ordine:

1. PR `needs-review` senza `needs-human`, numero più basso:
   check falliti → `rimanda-check-rossi`; check in corso → `attendi-check`;
   corpo senza una delle due sezioni → `rimanda-corpo-incompleto`; altrimenti `revisione`.
2. Issue `needs-human` (non rapporto), senza marcatore `pm-umano` nell'ultimo commento,
   numero più basso → `domanda`.
3. Se nessuna issue `ready-for-dev`/`in-progress`/`needs-human` (non rapporto) e nessuna PR
   `needs-review`: prima issue `in-coda` per identificativo `T\d{3,}[a-z]?` nel titolo →
   `avvia-task`.
4. Altrimenti `niente`.

Il riconoscimento delle sezioni del corpo riusa la stessa regola di `ui/lib.js`
(`estraiSezioni`: intestazioni `## Non fatto` e `## Fatto in più`), reimplementata in
`pm-coda.js` per non creare dipendenze tra `template/` e `ui/` (motivazione in
`research.md`).

### Il ruolo `pm-agent` (riscritto)

Stesso spirito e stessi otto punti di revisione del ruolo attuale, ma: **un ciclo, un
oggetto, nessuna attesa, nessuna mutazione**. Legge la costituzione, la spec attiva (la
deduce dal numero `T` nel titolo → `specs/<NNN>-*/`), gli ADR, `CLAUDE.md`, il ruolo
`dev-agent`; poi la PR o la issue. Scrive `verdetto.json` e, se decide, un ADR nella
cartella di lavoro. Termina. La sezione "Quando ti fermi" resta: si traduce in esito `umano`
con domanda chiusa.

### `pm.ps1`

`avvia`: `gh workflow enable pm-agent.yml`, poi `gh workflow run pm-agent.yml` (giro di
recupero). `ferma`: `gh workflow disable pm-agent.yml`, elenca le esecuzioni in corso e
dice che finiranno. `stato`: `gh api repos/{owner}/{repo}/actions/workflows/pm-agent.yml
--jq .state`, conteggi con `gh pr list`/`gh issue list --label`, ultima esecuzione con `gh
run list --workflow pm-agent.yml --limit 1`. UTF-8 con BOM, `$ErrorActionPreference =
"Stop"`, mai `&&`.

### Modifiche a `dev-agent.yml` (REQ-262)

- Nel passo "Segnala il fallimento del run": usare `FUCINA_PAT` e, oltre a togliere
  `in-progress`, rimettere `ready-for-dev`. Il contatore esistente trasforma il riavvio in
  `needs-human` quando i tentativi sono esauriti: nessun loop possibile, perché il
  tentativo viene contato prima dell'agente e questo passo gira solo se è stato contato.
- Nel job `implementa`: `if:` esteso con `!contains(github.event.issue.labels.*.name,
  'rapporto-pm')`.

## Tracciamento della complessità

Nessuna violazione della costituzione da giustificare. L'unica scelta non ovvia — il
rilancio in `workflow_dispatch` prima di chiamare il modello — è motivata in
`research.md` (R3).
