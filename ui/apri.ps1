<#
Avvia un server HTTP locale sulla cartella ui/ e apre il browser predefinito sulla
dashboard. Se un server è già attivo su una porta nota, non ne avvia un secondo:
apre solo il browser.

Richiede Python (usato per `python -m http.server`); senza, spiega cosa manca.
#>

$ErrorActionPreference = 'Stop'

$cartellaUi = $PSScriptRoot
$fileStato = Join-Path $cartellaUi '.apri-stato.json'

function Test-Porta {
    param([int]$Porta)

    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $risultato = $client.BeginConnect('127.0.0.1', $Porta, $null, $null)
        $connesso = $risultato.AsyncWaitHandle.WaitOne(200)
        return ($connesso -and $client.Connected)
    } catch {
        return $false
    } finally {
        $client.Close()
    }
}

function Trova-PortaLibera {
    for ($porta = 8000; $porta -lt 8100; $porta++) {
        if (-not (Test-Porta -Porta $porta)) {
            return $porta
        }
    }
    throw 'Nessuna porta libera trovata tra 8000 e 8099.'
}

function Trova-Python {
    foreach ($nome in @('python', 'py', 'python3')) {
        $comando = Get-Command $nome -ErrorAction SilentlyContinue
        if ($comando) {
            return $comando.Source
        }
    }
    return $null
}

$portaAttiva = $null

if (Test-Path $fileStato) {
    try {
        $stato = Get-Content $fileStato -Raw | ConvertFrom-Json
        if ($stato.porta -and (Test-Porta -Porta $stato.porta)) {
            $portaAttiva = $stato.porta
        }
    } catch {
        $portaAttiva = $null
    }
}

if (-not $portaAttiva) {
    $python = Trova-Python
    if (-not $python) {
        Write-Error 'Python non trovato. Installa Python (da python.org) per avviare il server locale, oppure avvia a mano un server HTTP sulla cartella ui/.'
        exit 1
    }

    $porta = Trova-PortaLibera
    Start-Process -FilePath $python -ArgumentList @('-m', 'http.server', $porta) -WorkingDirectory $cartellaUi -WindowStyle Hidden | Out-Null

    $tentativi = 0
    while (-not (Test-Porta -Porta $porta) -and $tentativi -lt 50) {
        Start-Sleep -Milliseconds 100
        $tentativi++
    }

    if (-not (Test-Porta -Porta $porta)) {
        Write-Error 'Il server locale non ha risposto entro 5 secondi.'
        exit 1
    }

    @{ porta = $porta } | ConvertTo-Json | Set-Content $fileStato
    $portaAttiva = $porta
}

Start-Process "http://localhost:$portaAttiva/index.html"
