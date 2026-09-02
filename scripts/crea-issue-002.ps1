# Crea le 12 issue della spec 002 (il Registro) nel repo corrente.
# Da eseguire dentro la cartella del repo fucina, con gh autenticato.
# Solo T1 riceve ready-for-dev: le altre si etichettano una alla volta,
# nell'ordine, quando la precedente e' stata fusa.

$ErrorActionPreference = "Stop"

$issues = @(
  @{
    t = "T1 - Impalcatura della UI e test runner"
    b = @'
Crea la cartella `ui/` con tre file: `index.html` (pagina vuota con titolo "Registro" e l'import di `lib.js` come modulo ES), `lib.js` (esporta una funzione `versione()` che restituisce la stringa "0.1.0") e `lib.test.js` (un test con `node:test` che la verifica).

Requisiti: REQ-140, REQ-141 (vedi `specs/002-registro/spec.md`).

Criteri di accettazione:
- `node --test ui/` esce verde
- nessun `package.json`, nessuna dipendenza
- `index.html` si apre senza errori in console se servita da un server locale
'@
  },
  @{
    t = "T2 - Configurazione: repo, token, localStorage"
    b = @'
Al primo avvio la pagina mostra un modulo con: un'area di testo per l'elenco dei repo (`proprietario/nome`, uno per riga) e un campo per il token. Al salvataggio li scrive in `localStorage` e mostra la dashboard (per ora vuota, con la scritta "Dashboard"). Ai successivi avvii parte dalla dashboard. Un pulsante "Configurazione" riapre il modulo; un pulsante "Dimentica il token" cancella il token e riporta al modulo.

Requisiti: REQ-101, REQ-102, REQ-103.

Criteri di accettazione:
- prima apertura → modulo; dopo salvataggio e ricarico → dashboard
- "Dimentica il token" + ricarico → di nuovo il modulo
- la validazione dell'elenco repo (formato `x/y`, righe vuote ignorate) sta in `lib.js` ed e' testata
- il token non compare mai in `console.log` ne' nell'HTML
'@
  },
  @{
    t = "T3 - Estrazione delle sezioni dal corpo di una PR"
    b = @'
In `lib.js` una funzione pura `estraiSezioni(corpo)` che, dato il corpo markdown di una PR, restituisce un oggetto con le chiavi `nonFatto`, `fattoInPiu`, `decisioni` (testo della sezione, o `null` se assente). Le intestazioni da riconoscere sono `## Non fatto`, `## Fatto in più`, `## Decisioni`, in qualsiasi ordine.

Requisiti: REQ-110 (parte), REQ-141.

Criteri di accettazione:
- testata su almeno tre corpi: quello della PR #6 di fucina-lab, quello della #9, e uno senza sezioni
- una sezione vuota ("Nulla") viene restituita come testo, non come `null`
- nessun accesso alla rete, nessun DOM
'@
  },
  @{
    t = "T4 - Classificazione di issue e PR nelle colonne"
    b = @'
In `lib.js` una funzione pura `classifica(issues, prs, oggi)` che, dati gli elenchi come li restituisce l'API di GitHub e la data corrente, restituisce un oggetto con sei array: `backlog` (issue aperte senza label di stato), `pronte` (`ready-for-dev`), `inLavorazione` (`in-progress`), `inRevisione` (PR aperte con `needs-review`), `bloccate` (`needs-human`), `fatte` (issue chiuse negli ultimi 14 giorni). Le PR non vanno mai nel backlog.

Requisiti: REQ-120 (parte), REQ-141, OP-204.

Criteri di accettazione:
- testata con un insieme di issue e PR che copre ogni colonna, piu' un caso al limite dei 14 giorni
- una issue con due label di stato finisce nella colonna piu' avanzata (ordine: needs-human > in-progress > ready-for-dev)
- nessun accesso alla rete, nessun DOM
'@
  },
  @{
    t = "T5 - Client per l'API di GitHub"
    b = @'
In `lib.js` (o in un modulo `github.js` importato da `index.html`) le funzioni che leggono da un repo: issue aperte e chiuse di recente, PR aperte, commenti di una issue, stato combinato dei check di una PR, run del workflow `dev-agent`. Ogni funzione riceve il token, gestisce gli errori HTTP restituendo un errore con codice e messaggio leggibile, e non fa nulla di silenzioso.

Requisiti: REQ-122 (parte), REQ-102.

Criteri di accettazione:
- il token viaggia solo nell'header `Authorization` verso `api.github.com`
- un 401 produce un errore che dice "token non valido o scaduto"; un 404 dice quale repo non esiste o non e' raggiungibile
- la parte pura (costruzione delle URL, interpretazione degli stati dei check) e' in `lib.js` e testata; le chiamate `fetch` sono isolate in funzioni sottili
'@
  },
  @{
    t = "T6 - Sezione 'Aspettano te'"
    b = @'
In cima alla dashboard, per tutti i repo configurati: le issue con `needs-human`, ciascuna con l'ultimo commento dell'agente in linea; le PR con `needs-review`, ciascuna con le sezioni "Non fatto" e "Fatto in più" e un indicatore verde/rosso/in attesa dei check. Ogni elemento ha il link a GitHub. Se non c'e' nulla, la sezione dice "Niente aspetta te".

Requisiti: REQ-110, REQ-111, REQ-112, REQ-113. Dipende da T3 e T5.

Criteri di accettazione:
- con lo stato attuale di fucina-lab, la issue 1 compare con il suo ultimo commento
- una PR etichettata `needs-review` compare con le due sezioni estratte
- con coda vuota compare il messaggio
'@
  },
  @{
    t = "T7 - Tabella di avanzamento per repo"
    b = @'
Per ogni repo configurato, una tabella con le sei colonne di T4 e i conteggi in intestazione. Ogni cella elenca i titoli con link a GitHub. I repo sono in sezioni separate con il nome in evidenza.

Requisiti: REQ-120. Dipende da T4 e T5.

Criteri di accettazione:
- i conteggi coincidono con `gh issue list --label <label>` e `gh pr list --label needs-review`
- una colonna vuota mostra un trattino, non scompare
'@
  },
  @{
    t = "T8 - Sezione 'Agenti attivi'"
    b = @'
Una sezione che elenca i run del workflow `dev-agent` in stato `in_progress` o `queued`, per repo, con: la issue su cui lavorano (dal titolo del run), il tempo trascorso dall'avvio in forma leggibile ("3 min"), e il link al run. Se non ci sono run attivi, dice "Nessun agente al lavoro".

Requisiti: REQ-121. Dipende da T5.

Criteri di accettazione:
- avviando un run su fucina-lab compare entro un aggiornamento; alla fine scompare
- la formattazione del tempo trascorso e' una funzione pura in `lib.js`, testata
'@
  },
  @{
    t = "T9 - Aggiornamento automatico ed errori visibili"
    b = @'
La dashboard si aggiorna da sola ogni 60 secondi e con un pulsante "Aggiorna". Mostra l'ora dell'ultimo aggiornamento riuscito. Se una chiamata fallisce, un riquadro in cima lo dice (quale repo, quale errore) e i dati precedenti restano visibili ma marcati come non aggiornati.

Requisiti: REQ-122. Dipende da T6, T7, T8.

Criteri di accettazione:
- l'ora cambia ogni minuto senza interazione
- con un token revocato compare l'errore e i dati vecchi sono marcati
- l'aggiornamento manuale durante uno automatico non produce richieste doppie
'@
  },
  @{
    t = "T10 - Comando 'Rispondi e riavvia'"
    b = @'
Su ogni elemento `needs-human` della sezione "Aspettano te": un campo di testo e un pulsante "Rispondi e riavvia". Al click, una finestra di conferma mostra il testo e la issue; alla conferma esegue in ordine: pubblica il commento, toglie `needs-human`, mette `ready-for-dev`. Se una chiamata fallisce, dice quale e si ferma li'.

Requisiti: REQ-130, REQ-131, REQ-132. Dipende da T6.

Criteri di accettazione:
- su una issue di prova: commento pubblicato, label cambiate, workflow avviato
- annullando la conferma non parte nessuna chiamata
- con un token senza permesso di scrittura sulle issue: errore sulla prima chiamata, nessun cambio di stato
- campo vuoto → pulsante disabilitato
'@
  },
  @{
    t = "T11 - Identita' visiva e impaginazione desktop"
    b = @'
Applica alla dashboard l'identita' visiva della fucina: palette con neutri freddi a base verde-grigia, accento petrolio per gli elementi automatici e ambra per tutto cio' che richiede una persona, tipografia Archivo per i titoli e Newsreader per il testo, JetBrains Mono per etichette e dati. Tema chiaro e scuro secondo le preferenze del sistema. Impaginazione per schermi da 1200 px in su.

Requisiti: REQ-142, OP-203. Dipende da T9 e T10.

Criteri di accettazione:
- a 1280 px nulla scorre orizzontalmente
- la sezione "Aspettano te" e' visivamente distinta dal resto (ambra)
- entrambi i temi leggibili
- nessun font caricato da fuori se non da fonts.googleapis.com; fallback dichiarati
'@
  },
  @{
    t = "T12 - Script di avvio ui/apri.ps1"
    b = @'
Uno script PowerShell `ui/apri.ps1` che avvia un server HTTP locale sulla cartella `ui/` (con `python -m http.server` se Python e' disponibile, altrimenti spiega cosa manca) su una porta libera e apre il browser predefinito sulla pagina. Rilanciato con il server gia' attivo, non ne avvia un secondo.

Requisiti: REQ-143. Dipende da T1.

Criteri di accettazione:
- `.\ui\apri.ps1` → browser aperto sulla dashboard
- eseguito due volte → un solo server
- funziona da PowerShell 5.1
'@
  }
)

foreach ($i in $issues) {
  $url = gh issue create --title $i.t --body $i.b
  Write-Host "+ $($i.t)  ->  $url"
}

Write-Host ""
Write-Host "Create. Etichetta solo la prima:"
Write-Host "  gh issue edit <numero-di-T1> --add-label ready-for-dev"
