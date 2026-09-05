Implementa T002 della spec `006-registro-leggibile`: la riga di stato sopra ogni sezione.

## Cosa ho fatto

- In `ui/lib.js`, `rigaStato(repos, statoPmRepo, statoAgentiAttiviRepo, statoAvanzamentoRepo)`: per ogni repo compone stato del PM, agenti al lavoro e lavoro in attesa (`lavoro.totale`, lo stesso oggetto letto da `avvisoPmSpento`, così i due non possono contraddirsi) dai dati che la pagina ha già caricato, senza chiamate nuove. Un repo entra nella somma solo se le sue tre voci di stato sono affidabili: dati presenti **e** non marcati `nonAggiornato` — quindi un repo che smette di rispondere dopo un giro riuscito (dati vecchi tenuti, `nonAggiornato: true`, per REQ-122 spec 002) conta come incompleto quanto uno che non ha mai risposto, invece di far passare i suoi numeri vecchi come freschi. Senza repo configurati la funzione dà `{ configurato: false }`. Con tutti i repo affidabili ma a riposo il testo lo dice esplicitamente ("nessun agente al lavoro", "niente in attesa") invece di restare vuoto; con più repo affidabili somma agenti e lavoro e aggrega lo stato del PM (es. "PM: 1 acceso, 1 spento").
- In `ui/index.html`, `#rigaStato` in cima alla dashboard, prima della sezione «Aspettano te» (che resta prima di «Avanzamento», che resta prima di «Agenti attivi»). `renderRigaStato()` si chiama a fine di `aggiorna()`, dopo che i tre cicli di caricamento hanno già scritto il proprio esito (riuscito o fallito) negli stati che legge — mai prima: renderla prima del primo ciclo avrebbe marcato come "incompleto" (in rosso, `role="alert"`) uno stato semplicemente non ancora caricato, scambiando un caricamento in corso per un guasto. Senza repo configurati mostra un messaggio con un pulsante verso la configurazione invece di tre zeri.
- Test nuovi in `ui/riga-stato.test.js`: nessun repo configurato, repo a riposo, repo mai caricato, PM non installato, un repo che risponde e uno mai caricato, un repo che *smette* di rispondere dopo un giro riuscito (costruito con `aggiornaStatoRepo` reale, non con `dati: undefined`) — in entrambi i casi la riga segnala l'incompletezza e non somma i dati del repo inaffidabile a quelli dell'altro, pluralizzazioni di agenti e cose in attesa, aggregazione su più repo, nessuna chiamata `fetch`.

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 305 test verdi (280 esistenti invariati + 15 nuovi).

Closes #91

## Decisioni

Nessun ADR: la definizione di "dato affidabile" (presente e non `nonAggiornato`) applica REQ-122 della spec 002, non emendato dalla 006, senza introdurre un comportamento nuovo; il momento in cui chiamare `renderRigaStato()` (a fine `aggiorna()`, non prima) è una conseguenza diretta di quella stessa regola, non una scelta discrezionale.

## Non fatto

Nulla: tutti i criteri di accettazione della issue sono coperti, incluso trattare come inaffidabile un repo che smette di rispondere dopo un giro riuscito.

## Fatto in più

Nulla oltre ai tre file indicati dalla issue (`ui/lib.js`, `ui/index.html`, `ui/riga-stato.test.js`) più questo corpo della PR.
