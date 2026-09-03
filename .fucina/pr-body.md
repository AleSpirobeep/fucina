Implementa T12 — lo script di avvio `ui/apri.ps1` (REQ-143).

- `ui/apri.ps1`: script PowerShell 5.1 compatibile che:
  - cerca `python`/`py`/`python3` sul `PATH`; se nessuno è disponibile, spiega cosa
    manca e si ferma senza avviare nulla;
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
introdotti dopo, `ConvertTo-Json`/`ConvertFrom-Json` e `$PSScriptRoot` sono
disponibili da PS 3.0/5.0). Non ho potuto eseguirlo su un Windows reale né avviare un
browser da questo ambiente: `pwsh` non è fra gli strumenti permessi da `.fucina.yml`
(`strumenti_permessi` elenca solo `Bash(node:*)` e `Bash(git:*)`) e comunque qui non
c'è un display per verificare l'apertura del browser.

## Decisioni

- [`docs/decisions/2026-09-03-1200-rilevamento-server-attivo-in-apri-ps1.md`](../docs/decisions/2026-09-03-1200-rilevamento-server-attivo-in-apri-ps1.md):
  come lo script riconosce che un server è già attivo (file di stato con la porta,
  verificata con una connessione TCP diretta, non un PID).

## Non fatto

Il collaudo dal vivo dei tre criteri di accettazione (`.\ui\apri.ps1` apre il
browser sulla dashboard; un secondo avvio non apre un secondo server; funziona da
PowerShell 5.1) richiede una macchina Windows con Python installato: non verificabile
da questo ambiente Linux. Ho verificato invece che i test JS esistenti restano verdi e
ho riletto lo script contro la sintassi PowerShell 5.1.

## Fatto in più

`.gitignore`: aggiunta una riga per ignorare `ui/.apri-stato.json`, il file di stato
che lo script scrive alla prima esecuzione.
