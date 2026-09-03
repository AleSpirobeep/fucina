<#
Avvia un server HTTP locale sulla cartella ui/ e apre il browser predefinito sulla
dashboard. Se un server è già attivo su una porta nota, non ne avvia un secondo:
apre solo il browser.

Richiede Python (usato per `python -m http.server`); senza, spiega cosa manca. Su
Windows, `python`/`python3` nel PATH possono essere solo l'alias di esecuzione dello
Store (attivo per impostazione predefinita anche senza Python installato): eseguito
con argomenti, quell'alias stampa un messaggio e esce con codice 9009 senza avviare
nulla. Lo script lo riconosce provando `--version` su ogni candidato e lo scarta se
l'output non inizia con "Python 3".
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

function Test-CandidatoPython {
    param([string]$Percorso)

    try {
        $output = & $Percorso '--version' 2>&1 | Out-String
        return ($output -match '^Python 3')
    } catch {
        return $false
    }
}

function Trova-Python {
    foreach ($nome in @('py', 'python', 'python3')) {
        $comando = Get-Command $nome -ErrorAction SilentlyContinue
        if ($comando -and (Test-CandidatoPython -Percorso $comando.Source)) {
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
        Write-Error @'
Python non è installato (o non è raggiungibile come py/python/python3 nel PATH).
Installalo da https://www.python.org/downloads/ (spunta "Add python.exe to PATH"
durante l'installazione), poi rilancia questo script.

Nota: su Windows, "python" nel PATH può essere solo l'alias di esecuzione dello
Store, attivo per impostazione predefinita anche senza Python installato: questo
script lo riconosce e lo scarta, quindi non basta a farlo funzionare.
'@
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
