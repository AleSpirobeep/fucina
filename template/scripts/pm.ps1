<#
Accende, spegne e mostra lo stato del PM a cicli (workflow pm-agent.yml).
Uso: pm.ps1 avvia|ferma|stato

Usa solo l'autenticazione gia' presente in gh: nessuna credenziale letta, generata
o stampata da questo script.
#>

$ErrorActionPreference = "Stop"

$WorkflowPm = "pm-agent.yml"
$LimiteElenco = 1000

function Da-Json($testo) {
    return @((($testo -join "") | ConvertFrom-Json) | ForEach-Object { $_ })
}

function Ottieni-Repo {
    $repo = gh repo view --json nameWithOwner -q .nameWithOwner
    if ($LASTEXITCODE -ne 0) {
        throw "Impossibile determinare il repository corrente (serve 'gh repo view')."
    }
    return $repo.Trim()
}

function Conta-Pr {
    param([string]$Label)

    $json = gh pr list --label $Label --state open --limit $LimiteElenco --json number
    if ($LASTEXITCODE -ne 0) {
        throw "Impossibile elencare le PR con etichetta '$Label'."
    }
    return @(Da-Json $json).Count
}

function Conta-Issue {
    param([string]$Label)

    $json = gh issue list --label $Label --state open --limit $LimiteElenco --json number
    if ($LASTEXITCODE -ne 0) {
        throw "Impossibile elencare le issue con etichetta '$Label'."
    }
    return @(Da-Json $json).Count
}

function Conta-DomandeInAttesa {
    $json = gh issue list --label "needs-human" --state open --limit $LimiteElenco --json labels
    if ($LASTEXITCODE -ne 0) {
        throw "Impossibile elencare le issue con etichetta 'needs-human'."
    }
    $issue = @(Da-Json $json)
    $filtrate = @($issue | Where-Object {
        $nomiEtichette = @($_.labels | ForEach-Object { $_.name })
        -not ($nomiEtichette -contains "rapporto-pm")
    })
    return $filtrate.Count
}

function Invoca-Avvia {
    Write-Host "Abilito il workflow $WorkflowPm..."
    gh workflow enable $WorkflowPm
    if ($LASTEXITCODE -ne 0) {
        throw "'gh workflow enable' e' fallito: controlla che $WorkflowPm sia installato e che il login gh abbia lo scope 'workflow'."
    }
    Write-Host "Workflow $WorkflowPm abilitato: il PM torna a reagire agli eventi del repo."

    Write-Host "Lancio un giro di recupero..."
    gh workflow run $WorkflowPm
    if ($LASTEXITCODE -ne 0) {
        throw "'gh workflow run' e' fallito."
    }
    Write-Host "Giro di recupero avviato: il PM lavorera' subito su cio' che e' successo mentre era fermo."
}

function Invoca-Ferma {
    Write-Host "Disabilito il workflow $WorkflowPm..."
    gh workflow disable $WorkflowPm
    if ($LASTEXITCODE -ne 0) {
        throw "'gh workflow disable' e' fallito: controlla che $WorkflowPm sia installato."
    }
    Write-Host "Workflow $WorkflowPm disabilitato: da ora nessun evento fara' partire una nuova esecuzione."

    $json = gh run list --workflow $WorkflowPm --status in_progress --json databaseId,url
    if ($LASTEXITCODE -ne 0) {
        throw "Impossibile elencare le esecuzioni in corso."
    }
    $esecuzioni = @(Da-Json $json)
    if ($esecuzioni.Count -eq 0) {
        Write-Host "Nessuna esecuzione in corso."
    } else {
        Write-Host "Esecuzioni in corso: finiranno il ciclo che stanno facendo."
        foreach ($e in $esecuzioni) {
            Write-Host ("  - " + $e.url)
        }
    }
}

function Invoca-Stato {
    $repo = Ottieni-Repo

    $statoWorkflow = gh api "repos/$repo/actions/workflows/$WorkflowPm" --jq ".state"
    if ($LASTEXITCODE -ne 0) {
        throw "Impossibile leggere lo stato del workflow $WorkflowPm su $repo."
    }
    if ($statoWorkflow.Trim() -eq "active") {
        Write-Host "PM: acceso"
    } else {
        Write-Host "PM: spento"
    }

    $prNeedsReview = Conta-Pr -Label "needs-review"
    Write-Host "PR da revisionare (needs-review): $prNeedsReview"

    $domande = Conta-DomandeInAttesa
    Write-Host "Domande in attesa (needs-human, escluse rapporto-pm): $domande"

    $inCoda = Conta-Issue -Label "in-coda"
    Write-Host "Task in coda (in-coda): $inCoda"

    $readyForDev = Conta-Issue -Label "ready-for-dev"
    Write-Host "Task pronti (ready-for-dev): $readyForDev"

    $inProgress = Conta-Issue -Label "in-progress"
    Write-Host "Task in lavorazione (in-progress): $inProgress"

    $json = gh run list --workflow $WorkflowPm --limit 1 --json status,conclusion,createdAt,url
    if ($LASTEXITCODE -ne 0) {
        throw "Impossibile leggere l'ultima esecuzione di $WorkflowPm."
    }
    $esecuzioni = @(Da-Json $json)
    if ($esecuzioni.Count -eq 0) {
        Write-Host "Ultima esecuzione: nessuna."
    } else {
        $e = $esecuzioni[0]
        $esito = $e.status
        if ($e.status -eq "completed") {
            $esito = $e.conclusion
        }
        Write-Host "Ultima esecuzione: $esito ($($e.createdAt)) - $($e.url)"
    }
}

$comando = $args[0]

try {
    switch ($comando) {
        "avvia" { Invoca-Avvia }
        "ferma" { Invoca-Ferma }
        "stato" { Invoca-Stato }
        default {
            Write-Host "Uso: pm.ps1 avvia|ferma|stato"
            exit 1
        }
    }
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
