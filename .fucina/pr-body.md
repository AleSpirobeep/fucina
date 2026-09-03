Implementa T12 — lo script di avvio `ui/apri.ps1` (REQ-143).

Secondo tentativo: la PR #35 (tentativo 1) è stata chiusa dal PM perché su Windows
senza Python installato, `Get-Command python`/`python3` trova comunque l'alias di
esecuzione dello Store (attivo per impostazione predefinita in `%LOCALAPPDATA%\Microsoft\WindowsApps`),
che eseguito con argomenti stampa un messaggio di errore ed esce con codice 9009: lo
script tentava comunque di avviare il server, senza mai riuscirci, e il messaggio
finale ("Il server locale non ha risposto entro 5 secondi") descriveva una causa
sbagliata.

- `ui/apri.ps1`: script PowerShell 5.1 compatibile che:
  - cerca `py`, poi `python`, poi `python3` sul `PATH`; ogni candidato trovato viene
    accettato solo se `<candidato> --version` produce un output che inizia con
    `Python 3` — questo scarta l'alias dello Store, che con `--version` non stampa
    quella stringa;
  - se nessun candidato supera la prova, spiega che Python non è installato, dove
    scaricarlo, e che `python`/`python3` nel PATH possono essere solo l'alias dello
    Store, senza tentare di avviare nulla;
  - se non trova un server già attivo (vedi sotto), cerca una porta libera fra 8000 e
    8099 provando una connessione TCP diretta, avvia `python -m http.server <porta>`
    con la cartella `ui/` come working directory, in una finestra nascosta, e attende
    fino a 5 secondi che risponda;
  - salva la porta usata in `ui/.apri-stato.json`; al riavvio, se quella porta risponde
    ancora a una connessione TCP, non avvia un secondo server e apre solo il browser;
  - apre il browser predefinito su `http://localhost:<porta>/index.html`.
- `.gitignore`: aggiunta `ui/.apri-stato.json` (file di stato runtime, non va in git).

Verificato con `node --test "ui/**/*.test.js"`: 70 test, tutti verdi (lo script non
introduce funzioni JS, quindi non aggiunge test a quel comando). Ho riletto lo script
riga per riga contro la sintassi di PowerShell 5.1 (niente operatori o cmdlet
introdotti dopo; `ConvertTo-Json`/`ConvertFrom-Json` e `$PSScriptRoot` sono
disponibili da PS 3.0/5.0) e in particolare contro il caso segnalato dal PM: con
l'alias dello Store, `& $Percorso '--version' 2>&1 | Out-String` cattura il messaggio
"Python was not found; run without arguments to install from the Microsoft Store" (non
`^Python 3`), quindi il candidato viene scartato senza lanciare `-m http.server`. Non
ho potuto eseguirlo su un Windows reale né avviare un browser da questo ambiente:
`pwsh` non è fra gli strumenti permessi da `.fucina.yml` (`strumenti_permessi` elenca
solo `Bash(node:*)` e `Bash(git:*)`) e comunque qui non c'è un display per verificare
l'apertura del browser.

## Decisioni

- [`docs/decisions/2026-09-03-1155-rilevamento-server-attivo-in-apri-ps1.md`](../docs/decisions/2026-09-03-1155-rilevamento-server-attivo-in-apri-ps1.md):
  come lo script riconosce che un server è già attivo (file di stato con la porta,
  verificata con una connessione TCP diretta, non un PID).

## Non fatto

Il collaudo dal vivo dei quattro criteri di accettazione (`.\ui\apri.ps1` apre il
browser sulla dashboard; un secondo avvio non apre un secondo server; funziona da
PowerShell 5.1; con solo l'alias dello Store nel PATH lo script si ferma spiegando
cosa manca senza tentare di avviare il server) richiede una macchina Windows: non
verificabile da questo ambiente Linux. Ho verificato invece che i test JS esistenti
restano verdi e ho riletto lo script contro la sintassi PowerShell 5.1 e contro il
comportamento dell'alias dello Store descritto dal PM.

## Fatto in più

`.gitignore`: aggiunta una riga per ignorare `ui/.apri-stato.json`, il file di stato
che lo script scrive alla prima esecuzione.
