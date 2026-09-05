Implementa T002 della spec `006-registro-leggibile`: la riga di stato sopra ogni sezione.

## Cosa ho fatto

- In `ui/lib.js`, `rigaStato(repos, statoPmRepo, statoAgentiAttiviRepo, statoAvanzamentoRepo)`: per ogni repo configurato compone stato del PM (`statoPmRepo`, già caricato da `caricaPm`), numero di agenti al lavoro (`statoAgentiAttiviRepo`, già caricato da `caricaAgentiAttivi`) e lavoro in attesa come totale (`statoAvanzamentoRepo[repo].dati.lavoro.totale`, lo stesso oggetto usato da `avvisoPmSpento` — così il totale della riga di stato e la ripartizione dell'avviso non possono contraddirsi). Nessuna chiamata nuova: la funzione legge soltanto gli stati che la pagina tiene già in memoria.
  - Senza repo configurati restituisce `{ configurato: false, voci: [] }`.
  - Per ogni repo manca anche uno solo dei tre dati (PM, agenti o lavoro), quel repo è marcato `completo: false` con un testo che segnala l'incompletezza, invece di trattare il dato assente come zero; gli altri repo della lista restano indipendenti — un repo che risponde non viene contaminato da uno che non risponde.
  - Con tutti e tre i dati presenti, anche a zero, il testo li nomina esplicitamente (`testoAgentiRigaStato`, `testoLavoroRigaStato`: "nessun agente al lavoro", "niente in attesa") invece di restare vuoto.
- In `ui/index.html`, il contenitore `#rigaStato` (nuovo blocco di stile, coerente con i token della tavolozza) inserito prima della sezione «Aspettano te» — che resta prima di «Avanzamento», che resta prima di «Agenti attivi», ordine già garantito dalla struttura esistente. `renderRigaStato()` è chiamata all'apertura della dashboard e a ogni ciclo di `aggiorna()`, dopo che `caricaPm`, `caricaAgentiAttivi` e `caricaAvanzamento` hanno aggiornato i tre stati da cui `rigaStato` legge. Senza repo configurati mostra un messaggio e un pulsante che apre la configurazione, invece di tre zeri.
- Test nuovi in `ui/riga-stato.test.js`: nessun repo configurato, un repo del tutto a riposo (testo esplicito, non vuoto), un repo con un dato mancante (incompletezza segnalata, nessuno zero finto), due repo di cui uno risponde e uno no (i dati del primo non sono toccati da chi fallisce), pluralizzazione di `testoAgentiRigaStato`/`testoLavoroRigaStato`, e una controprova che la funzione non chiama `fetch`.

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 303 test, tutti verdi (280 esistenti invariati + 23 nuovi).

Closes #91

## Decisioni

Nessun ADR: la scelta di comporre un testo unico per repo (invece di tre campi separati da assemblare nel DOM) è un dettaglio di forma della funzione pura richiesta dalla issue, non una scelta che cambia comportamento visibile o contraddice una decisione esistente.

## Non fatto

Nulla: tutti i criteri di accettazione della issue sono coperti — visibilità senza scorrere (demandata al posizionamento in cima, in cima alla dashboard), repo a riposo dichiarato esplicitamente, nessun repo configurato rimandato alla configurazione, incompletezza segnalata senza somme fittizie, ordine del documento rispettato, nessuna richiesta di rete nella funzione pura.

## Fatto in più

Nulla oltre ai tre file indicati dalla issue (`ui/lib.js`, `ui/index.html`, `ui/riga-stato.test.js`) più questo corpo della PR.
