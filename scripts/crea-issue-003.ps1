# Crea le 7 issue della spec 003 (il PM a cicli) nel repo corrente.
# Da eseguire dentro la cartella del repo fucina, con gh autenticato.
# Nessuna label di stato: il PM etichetta ready-for-dev una alla volta, nell'ordine
# T001..T007. Titoli nella forma canonica di Spec Kit (T001: ...).
# Idempotente: non crea doppioni (confronta i titoli delle issue aperte).

$ErrorActionPreference = "Stop"

$esistenti = @(gh issue list --state open --limit 200 --json title --jq '.[].title')

function Crea-Issue($titolo, $corpo) {
  if ($esistenti -contains $titolo) {
    Write-Host "= $titolo  (esiste gia')"
    return
  }
  $tmp = [IO.Path]::GetTempFileName()
  [IO.File]::WriteAllText($tmp, $corpo, (New-Object Text.UTF8Encoding $false))
  try {
    $url = gh issue create --title $titolo --body-file $tmp
    Write-Host "+ $titolo  ->  $url"
  } finally {
    Remove-Item $tmp -ErrorAction SilentlyContinue
  }
}

$intestazione = @'
Spec: `specs/003-pm-a-cicli/spec.md` · Piano: `plan.md` · Contratti: `contracts/` · Task: `tasks.md`.
Leggi i contratti prima di scrivere codice. I file sotto `template/` sono **modelli** copiati da `init.sh` nei repo di destinazione, non i workflow attivi di questo repo: modificarli è il compito.

'@

$issues = @(
  @{
    t = "T001: Script di decisione pm-coda.js con test e fixture"
    b = $intestazione + @'
Crea `template/scripts/pm-coda.js` (CommonJS, nessuna dipendenza) che esporta `decidi(stato)`, `estraiSezioniMancanti(corpo)` e `identificativoTask(titolo)` secondo `specs/003-pm-a-cicli/contracts/pm-coda.md`, con la forma dei dati di `data-model.md` (§1 input, §2 output). Eseguito da riga di comando (`node scripts/pm-coda.js < stato.json`) legge lo stato da stdin e stampa la decisione in JSON; input non valido → messaggio su stderr, exit 2. Eseguito come modulo non legge stdin.

Crea `template/scripts/pm-coda.test.js` (`node:test`, `node:assert`) e le 12 fixture elencate nel contratto in `template/scripts/fixtures/`, più le copie di `ui/fixtures/pr-body-6.md` e `ui/fixtures/pr-body-9.md` usate come corpi di PR.

Requisiti: REQ-210, 211, 212, 213, 214, 215, 216 (parte decisionale).

Criteri di accettazione:
- `node --test "template/scripts/**/*.test.js"` esce verde; ogni regola del contratto (1a–1d, 2, 3, 4) ha almeno un test, e ogni fixture della tabella produce la decisione attesa
- ordine di priorità verificato: PR verde (#40) batte issue `needs-human` (#30) e task in coda
- ordine dei task in coda verificato: `T004` < `T004a` < `T004b` < `T005`; `ST001` non è un identificativo
- una issue con `in-coda` e un'altra label di stato non viene avviata; una PR con `needs-review` e `needs-human` blocca l'avvio dei task
- `estraiSezioniMancanti` riconosce `## Non fatto` e `## Fatto in più` (anche `###`, maiuscole e spazi indifferenti) e testato sui corpi delle PR #6 e #9 di fucina-lab (entrambe complete) e sul corpo minimo del workflow (entrambe mancanti)
- nessun accesso alla rete, nessun DOM, nessun `package.json`
'@
  },
  @{
    t = "T002: Workflow pm-agent.yml, prima parte: eventi, stato, decisione, azioni deterministiche"
    b = $intestazione + @'
Crea `template/.github/workflows/pm-agent.yml` seguendo la sezione «Il workflow `pm-agent.yml`» di `plan.md` (passi 1–7) e `research.md` (R2, R3, R7, R8). In questa issue il modello **non** viene chiamato: le esecuzioni `workflow_dispatch` con `azione` `revisione` o `domanda` terminano stampando nel log «modello: T003».

Cosa deve contenere:
- trigger `pull_request` (labeled, unlabeled, closed), `issues` (labeled, unlabeled, closed), `workflow_dispatch` con input `azione` (choice: scansione, revisione, domanda; default scansione) e `numero`; `if:` del job che lascia passare solo le label `needs-review`, `needs-human`, `in-coda`, i `closed`, gli `unlabeled` di `needs-human`, e i dispatch (REQ-202)
- `concurrency: { group: pm-agent, cancel-in-progress: false }` (REQ-204); `timeout-minutes` ≥ attesa dei check + 10
- checkout del branch di default (mai del ref della PR)
- configurazione da `.fucina.yml` chiave `pm` con i default di `contracts/fucina-yml.md`; errore esplicito se `strumenti_permessi` contiene uno strumento di mutazione (REQ-270)
- issue di rapporto: trova l'issue aperta con label `rapporto-pm`, altrimenti la crea con `pm.titolo_rapporto` e quella label (REQ-240)
- raccolta dello stato con `gh pr list/view/checks` e `gh issue list/view` nel JSON di `data-model.md` §1 (`check` calcolato da `bucket`; `ultimoCommentoPm` dal marcatore `<!-- fucina:pm-umano -->` nell'ultimo commento)
- decisione con `node scripts/pm-coda.js`; `niente` → fine senza commenti (REQ-242)
- azioni deterministiche con `GH_TOKEN: ${{ secrets.FUCINA_PAT || secrets.GITHUB_TOKEN }}`: `avvia-task` (`+ready-for-dev -in-coda`, REQ-211), `attendi-check` (`gh pr checks --watch` con `timeout` di `pm.attesa_check_minuti`; oltre → `+needs-human` sulla PR e rapporto, REQ-215; poi ridecidere), `rimanda-check-rossi` e `rimanda-corpo-incompleto` (commento sulla PR con i check falliti o le sezioni mancanti, `gh pr close --delete-branch`, stesso commento sull'issue di `dettagli.issue`, `+ready-for-dev`; REQ-213, 214)
- commento sul rapporto per ogni azione: azione, link all'oggetto, motivo, link all'esecuzione (REQ-241)
- rilancio: dopo un'azione deterministica, rieseguire lo script sullo stato aggiornato e, se c'è ancora lavoro, `gh workflow run pm-agent.yml` con il `GITHUB_TOKEN` (permesso `actions: write`); per `revisione`/`domanda` in contesto evento, `gh workflow run pm-agent.yml -f azione=… -f numero=…` e fine (REQ-205, R3)
- passo finale `if: failure()` che commenta il rapporto con il link al log

Requisiti: REQ-201, 202, 203, 204, 205, 211, 213, 214, 215, 240, 241, 242, 270.

Criteri di accettazione:
- `yq '.' template/.github/workflows/pm-agent.yml` esce 0
- il job dichiara `permissions` con `contents: write`, `issues: write`, `pull-requests: write`, `actions: write`
- nessuna stringa `--admin`; nessun secret stampato; `set -euo pipefail` in ogni passo bash
- un commento in testa al file spiega il ciclo in dieci righe
- il corpo della PR elenca, per ciascun requisito sopra, il passo del workflow che lo soddisfa
'@
  },
  @{
    t = "T003: Workflow pm-agent.yml, seconda parte: modello e verdetto"
    b = $intestazione + @'
Completa `template/.github/workflows/pm-agent.yml` con i passi 8–10 di `plan.md`: la chiamata al modello e l'esecuzione del verdetto secondo `contracts/verdetto.md`.

Cosa deve contenere:
- passo «Esegui il PM» con `anthropics/claude-code-action@v1`, `if:` = evento `workflow_dispatch` **e** `azione` diversa da `scansione` (REQ-220, 230); `claude_code_oauth_token`, `env` con `ANTHROPIC_BASE_URL` da `endpoint` e `GH_TOKEN` (solo lettura di PR/issue/run: il PAT non serve, usa il `GITHUB_TOKEN`); `track_progress: false`; prompt `/pm-agent` + «Revisiona la PR #N» oppure «Rispondi alla issue #N» + `CARTELLA_FUCINA=$RUNNER_TEMP/fucina` (creata prima, con la sottocartella `decisioni/`); `claude_args` con `--model`, `--max-turns`, `--max-budget-usd` da `pm.*` e `--allowedTools "<elenco>"` **tra virgolette**
- lettura di `$RUNNER_TEMP/fucina/verdetto.json` con `jq`; assente, non valido, `versione` ≠ 1, numero diverso da quello richiesto, esito non ammesso per il tipo → esito `umano` con il commento standard «Il PM non ha concluso: <causa>. Log: <link>» (REQ-222)
- pubblicazione degli ADR: per ogni file in `decisioni/`, copia in `docs/decisions/`, `git add`, commit «ADR del PM: <nome>», push su `main` con il PAT (REQ-234); se il push fallisce, il verdetto viene comunque eseguito e il rapporto lo segnala
- esecuzione del verdetto con `GH_TOKEN` = PAT: `fondi` → `gh pr merge N --squash --delete-branch`, su errore `+needs-human` sulla PR con l'errore (REQ-223); `rimanda` → commento sulla PR, `gh pr close --delete-branch`, stesso commento sull'issue di `Closes #`, `+ready-for-dev` (REQ-224); `rispondi` → commento, `-needs-human +ready-for-dev` (REQ-231); `umano` → commento con `<!-- fucina:pm-umano -->` in coda, `+needs-human` se PR (REQ-232); `riscrivi` → `gh issue create --label in-coda` per ogni `nuove_issue`, commento e chiusura dell'originale (REQ-233)
- commento sul rapporto con esito, motivo, link (REQ-241); rilancio in `scansione` se lo script trova ancora lavoro (REQ-205)
- il passo di fallimento esistente copre anche questi passi

Requisiti: REQ-220, 221, 222, 223, 224, 230, 231, 232, 233, 234, 241, 270, 271.

Criteri di accettazione:
- `yq '.' template/.github/workflows/pm-agent.yml` esce 0
- nessuna stringa `--admin`; il modello non riceve il PAT; `--allowedTools` è tra virgolette
- il passo del modello ha una condizione che esclude ogni evento diverso da `workflow_dispatch` e l'azione `scansione`
- ogni esito della tabella di `contracts/verdetto.md` ha un ramo esplicito; un esito sconosciuto finisce nel ramo `umano`
- il corpo della PR riporta, per ogni esito, il passo che lo esegue
'@
  },
  @{
    t = "T004: Ruolo pm-agent a ciclo singolo"
    b = $intestazione + @'
Riscrivi `plugin/skills/pm-agent/SKILL.md` per il PM a cicli (sezione «Il ruolo `pm-agent` (riscritto)» di `plan.md`). Il ruolo viene invocato dal workflow con «Revisiona la PR #N» oppure «Rispondi alla issue #N» e con il percorso `CARTELLA_FUCINA`; lavora **un** oggetto, non aspetta nulla, non modifica niente su GitHub: il suo unico output è `CARTELLA_FUCINA/verdetto.json` secondo `contracts/verdetto.md`, più eventuali ADR in `CARTELLA_FUCINA/decisioni/`.

Da conservare del ruolo attuale: le tre regole, le letture nell'ordine (costituzione, spec dedotta dall'identificativo `T` nel titolo → `specs/<NNN>-*/`, ADR, `CLAUDE.md`, ruolo `dev-agent`), gli otto punti di revisione, «Quando l'agente si ferma» (risposta dalla spec/ADR; decisione propria solo senza impatto su requisiti, sicurezza, token, costi), «Quando ti fermi» (diventa esito `umano` con domanda chiusa), «Cosa non fai, mai».

Da togliere: preflight con `gh auth`/`gh repo view`, primo e secondo atto, attesa con `gh run list`, ogni comando `gh` di scrittura, ogni `git commit`/`push`, il riferimento fisso alla spec 002.

Aggiorna anche il frontmatter (`description`, `allowed-tools: Read, Glob, Grep, Write, Bash`) e copia il file in `.claude/skills/pm-agent/SKILL.md` (stesso contenuto: è la copia installata nel repo della fucina).

Requisiti: REQ-221, 222, 230, 234, 270, 272.

Criteri di accettazione:
- le stringhe `gh pr merge`, `gh pr close`, `gh pr comment`, `gh pr edit`, `gh issue edit`, `gh issue comment`, `gh issue create`, `git push`, `git commit` compaiono solo nella sezione «Cosa non fai, mai»
- il ruolo descrive lo schema del verdetto con un esempio per `rimanda` e uno per `umano`
- meno di 250 righe; italiano
- `plugin/skills/pm-agent/SKILL.md` e `.claude/skills/pm-agent/SKILL.md` sono identici (`diff` vuoto)
'@
  },
  @{
    t = "T005: Script pm.ps1 - avvia, ferma, stato"
    b = $intestazione + @'
Crea `template/scripts/pm.ps1` con tre comandi (REQ-250, 251, 252), sezione «`pm.ps1`» di `plan.md`:
- `avvia`: `gh workflow enable pm-agent.yml`, poi `gh workflow run pm-agent.yml` (giro di recupero); stampa cosa ha fatto
- `ferma`: `gh workflow disable pm-agent.yml`; elenca le esecuzioni di `pm-agent.yml` in corso (`gh run list --workflow pm-agent.yml --status in_progress`) e dice che finiranno il ciclo
- `stato`: acceso/spento da `gh api repos/{owner}/{repo}/actions/workflows/pm-agent.yml --jq .state` (`active` → acceso); conteggi: PR con `needs-review`, issue con `needs-human` escluse quelle con `rapporto-pm`, issue `in-coda`, issue `ready-for-dev`, issue `in-progress`; ultima esecuzione (`gh run list --workflow pm-agent.yml --limit 1 --json status,conclusion,createdAt,url`) con esito e link
- comando assente o sconosciuto: stampa l'uso ed esce con codice 1

Vincoli PowerShell 5.1: file UTF-8 **con BOM**; niente `&&`, niente operatore ternario, niente `??`; `$ErrorActionPreference = "Stop"`; il proprietario/repo si ricava con `gh repo view --json nameWithOwner -q .nameWithOwner`; nessun token nello script né nell'output.

Criteri di accettazione:
- i primi tre byte del file sono `EF BB BF`
- la stringa `token` non compare nel file (maiuscole indifferenti)
- in `avvia`, `gh workflow enable` precede `gh workflow run`
- `stato` stampa una riga per ciascuno dei sei conteggi e una per l'ultima esecuzione
- il corpo della PR riporta l'output dei tre comandi eseguiti nel repo della fucina (con il workflow non ancora installato è atteso un errore chiaro: anche quello va riportato)
'@
  },
  @{
    t = "T006: dev-agent.yml - riavvio automatico su run fallito e issue di rapporto esclusa"
    b = $intestazione + @'
Due modifiche minime a `template/.github/workflows/dev-agent.yml` (REQ-262, sezione «Modifiche a `dev-agent.yml`» di `plan.md`):
1. nel passo «Segnala il fallimento del run»: `GH_TOKEN: ${{ secrets.FUCINA_PAT || secrets.GITHUB_TOKEN }}` (come negli altri passi) e `gh issue edit "$ISSUE" --remove-label in-progress --add-label ready-for-dev`, con il commento esistente che dice anche «Riavvio automatico: il tentativo è già stato contato». Il contatore del passo «Conta i tentativi precedenti» trasforma il riavvio in `needs-human` quando i tentativi sono esauriti; questo passo gira solo se il tentativo è stato contato, quindi nessun loop è possibile: scrivilo nel commento YAML.
2. nel job `implementa`: aggiungere alla condizione `if:` `&& !contains(github.event.issue.labels.*.name, 'rapporto-pm')`.

Nient'altro cambia. Non copiare il file in `.github/workflows/`: lo fa `init.sh`, per mano di Alessio.

Criteri di accettazione:
- `yq '.' template/.github/workflows/dev-agent.yml` esce 0
- `git diff --stat` mostra un solo file; il diff contiene solo le due modifiche e i commenti che le spiegano
- il corpo della PR spiega in tre righe perché il riavvio non può girare all'infinito
'@
  },
  @{
    t = "T007: init.sh, template/.fucina.yml, CLAUDE.md e README per il PM"
    b = $intestazione + @'
Installazione del PM (REQ-260, 261):
- `init.sh`: con la funzione `copia` esistente, copia `template/.github/workflows/pm-agent.yml` → `.github/workflows/pm-agent.yml`, `template/scripts/pm-coda.js` → `scripts/pm-coda.js`, `template/scripts/pm.ps1` → `scripts/pm.ps1`, `plugin/skills/pm-agent/SKILL.md` → `.claude/skills/pm-agent/SKILL.md`; con `crea_label`, crea `in-coda` (colore `5A6E8C`, «In coda: il PM la avvierà al suo turno») e `rapporto-pm` (colore `2C6E49`, «Issue di rapporto del PM»); aggiungi ai passi manuali finali: il login `gh` locale deve avere lo scope `workflow` (`gh auth refresh -s workflow` se manca); il PM è installato disabilitato e si avvia con `scripts/pm.ps1 avvia`; le issue dei task vanno create con label `in-coda` e titolo `T001: …`
- `template/.fucina.yml`: chiave `pm` con i default di `contracts/fucina-yml.md`, commentata riga per riga come il resto del file
- `template/CLAUDE.md`: una riga su `scripts/pm-coda.js` e `scripts/pm.ps1`, e una sull'issue di rapporto (`rapporto-pm`: non lavorarla mai)
- `README.md`: sezione «Il PM a cicli» (≤ 30 righe): cosa fa, come si accende e si spegne, dove legge Alessio, cosa costa

Criteri di accettazione:
- `bash -n init.sh` esce 0; rieseguito su un repo già inizializzato non sovrascrive nulla (usa solo `copia` e `crea_label`)
- `yq '.pm.max_turns' template/.fucina.yml` stampa `40`; `yq '.pm.strumenti_permessi | length' template/.fucina.yml` stampa `13`
- nessun token, nessun valore di secret in nessun file
- il corpo della PR riporta l'output di `bash -n init.sh` e dei due comandi `yq`
'@
  }
)

foreach ($i in $issues) { Crea-Issue $i.t $i.b }

Write-Host ""
Write-Host "Fatto. Ora, nella sessione del PM: le issue T001..T007 della spec 003 vanno avviate una alla volta, nell'ordine."
