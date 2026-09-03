Crea `template/scripts/pm.ps1` con i tre comandi `avvia`, `ferma`, `stato` (T005, REQ-250,
251, 252; sezione «`pm.ps1`» di `plan.md`).

## Cosa ho fatto

- `avvia`: `gh workflow enable pm-agent.yml` seguito da `gh workflow run pm-agent.yml`
  (giro di recupero), con un messaggio per ciascun passo.
- `ferma`: `gh workflow disable pm-agent.yml`, poi elenca con
  `gh run list --workflow pm-agent.yml --status in_progress` le esecuzioni ancora in corso
  (o dice che non ce ne sono), spiegando che finiranno il ciclo.
- `stato`: legge acceso/spento da
  `gh api repos/{owner}/{repo}/actions/workflows/pm-agent.yml --jq .state` (owner/repo da
  `gh repo view --json nameWithOwner -q .nameWithOwner`); stampa sei righe di conteggio —
  PM acceso/spento, PR `needs-review`, issue `needs-human` (escluse quelle con
  `rapporto-pm`, filtrate leggendo le etichette), issue `in-coda`, issue `ready-for-dev`,
  issue `in-progress` — più una riga per l'ultima esecuzione
  (`gh run list --workflow pm-agent.yml --limit 1 --json status,conclusion,createdAt,url`)
  con esito e link.
- Comando assente o sconosciuto: stampa l'uso ed esce con codice 1 (`default` dello
  `switch`, gestisce sia `$args[0]` vuoto sia un valore non riconosciuto).
- Ogni chiamata `gh` controlla `$LASTEXITCODE` e lancia un errore descrittivo; il
  dispatcher centrale li cattura con `try`/`catch`, li stampa con `Write-Error` ed esce
  con codice 1 — così anche un errore (workflow non installato, non autenticato) è
  chiaro invece di uno stack trace grezzo.

Vincoli PowerShell 5.1 rispettati: nessun `&&`, nessun operatore ternario, nessun `??`,
`$ErrorActionPreference = "Stop"` in testa, solo `gh` (nessuna chiamata diretta ad API con
credenziali proprie).

## Come l'ho verificato

- **Test automatici**: `node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` →
  150/150 verdi. Non ho aggiunto un file di test per `pm.ps1`: non c'è logica pura da
  estrarre in una funzione testabile con `node:test` (è uno script PowerShell che chiama
  `gh`), e CLAUDE.md riserva quel meccanismo a `template/scripts/<argomento>.test.js` per
  script Node; per `pm.ps1` `tasks.md` (T005) indica come verifica l'esecuzione dei tre
  comandi, non un file di test.
- **BOM**: `head -c 3 template/scripts/pm.ps1 | od -An -tx1` → `ef bb bf`.
- **Assenza di "token"**: `grep -io token template/scripts/pm.ps1` → nessuna occorrenza.
- **Ordine `avvia`**: `gh workflow enable` precede testualmente `gh workflow run` dentro
  `Invoca-Avvia` (unica occorrenza di ciascuno nel file).
- **Sei conteggi + ultima esecuzione in `stato`**: `Invoca-Stato` scrive sette righe con
  `Write-Host`, nell'ordine dell'issue.

## Non fatto

**Non ho eseguito i tre comandi dal vivo nel repo della fucina.** L'ho tentato, ma
`strumenti_permessi` in `.fucina.yml` per questo agente elenca solo `Edit`, `Write`,
`Bash(node:*)`, `Bash(yq:*)`, `Bash(git:*)`, `Bash(gh issue view:*)`,
`Bash(gh pr view:*)`: sia `pwsh` (qualunque invocazione, anche solo `pwsh -Version`) sia
i sottocomandi `gh` che lo script usa (`gh workflow …`, `gh api …`, `gh run list …`,
`gh pr list …`, `gh issue list …`) sono stati rifiutati con «richiede approvazione», e non
c'è un umano in questa esecuzione non presidiata che possa concederla. Non ho aggirato il
limite (niente `--allowedTools` esteso, niente riscrittura di `.fucina.yml`).

Di conseguenza non ho nemmeno potuto far analizzare la sintassi del file dal parser di
PowerShell (`pwsh` è bloccato allo stesso modo). Il file è stato scritto e riletto a
mano; resta da verificare dal vivo. Per farlo su una macchina con `pwsh`/PowerShell 5.1 e
login `gh` con scope `workflow` (come indicato in REQ-251 e nella nota di installazione
T007):

```powershell
scripts\pm.ps1
scripts\pm.ps1 stato
scripts\pm.ps1 avvia
scripts\pm.ps1 ferma
```

Poiché `pm-agent.yml` non è ancora installato nel repo della fucina (T007, non ancora
fatto), l'atteso è: `stato` e `ferma` falliscono con l'errore descrittivo definito in
`Invoca-Stato`/`Invoca-Ferma` (workflow non trovato) e codice di uscita 1; `avvia` fallisce
allo stesso modo su `gh workflow enable`. Il comando senza argomenti stampa l'uso ed esce
con codice 1, e quello è verificabile ovunque giri PowerShell, incluso questo sandbox se
`pwsh` fosse permesso — non lo è stato.

Segnalo questo per Alessio/PM: se il criterio "output dei tre comandi nel corpo della PR"
va soddisfatto prima della fusione, serve o un'esecuzione manuale da aggiungere qui in un
commento, o un ampliamento di `strumenti_permessi` per questo agente (fuori dal mio
perimetro deciderlo: è un cambio di sicurezza/permessi, non mio da prendere).

## Fatto in più

Nessuno. Ho toccato solo `template/scripts/pm.ps1` e questo file.

Closes #47
