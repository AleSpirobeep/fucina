Implementa T002a della spec `006-registro-leggibile`: la riga di stato sopra ogni sezione, per il solo caso in cui il caricamento è riuscito. I tre stati (non ancora caricato, un repo non risponde, tutto a posto) sono T002b — questa issue nasce dalla divisione di T002 (#91) proprio per tenerli separati.

## Cosa ho fatto

- In `ui/lib.js`, `rigaStato(repos, statoPmRepo, statoAgentiAttiviRepo, statoAvanzamentoRepo)`: per ogni repo compone stato del PM, agenti al lavoro e lavoro in attesa (totale) dai dati che la pagina ha già caricato — nessuna chiamata nuova. Include un repo solo se tutte e tre le voci hanno concluso con successo il proprio giro; un repo il cui giro non è ancora completo resta fuori dalle righe (comportamento provvisorio: la distinzione esplicita fra "in caricamento" ed "errore" è T002b). Senza repo configurati restituisce `{ configurato: false }`. Due funzioni di testo di supporto, `testoAgentiAlLavoro(numero)` e `testoLavoroInAttesa(numero)`, dicono esplicitamente "nessun agente al lavoro" e "niente in attesa" quando il conteggio è zero, così un repo del tutto a riposo non resta muto. `messaggioNessunRepoConfigurato()` rimanda alla configurazione invece di mostrare tre zeri.
- In `ui/index.html`, la sezione `#rigaStato` in cima alla dashboard, prima di «Aspettano te» (ordine nel documento: riga di stato, «Aspettano te», «Avanzamento», «Agenti attivi», verificato con REQ-503). `renderRigaStato()` viene richiamata a fine di ciascuno dei tre caricamenti da cui dipende — `caricaAvanzamento`, `caricaPm`, `caricaAgentiAttivi` — così la riga si aggiorna via via che i dati arrivano, senza attendere che tutti i repo abbiano finito.
- Test nuovi in `ui/riga-stato.test.js`: nessun repo configurato, repo configurato ma dati non ancora arrivati, repo del tutto a riposo (testo esplicito su tutti e tre i fronti), repo con agenti e lavoro in attesa (pluralizzazione inclusa), due repo di cui uno solo caricato, nessuna chiamata `fetch`.

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 304 test verdi (292 esistenti invariati + 12 nuovi).

Closes #103

## Decisioni

Nessun ADR: l'unica scelta non scritta esplicitamente nella issue è cosa fare di un repo il cui giro non è ancora concluso (ometterlo dalle righe finché non lo è). Non è una scelta discrezionale che introduce comportamento visibile nuovo: la issue stessa dichiara che gli stati di caricamento ed errore sono T002b, quindi qualunque resa provvisoria di quel caso è dentro il perimetro che T002b sostituirà.

## Non fatto

La distinzione esplicita fra "non ancora caricato" e "un repo non risponde" — è T002b per dichiarazione esplicita della issue, non un buco di questa PR.

## Fatto in più

Nulla oltre ai tre file indicati dalla issue (`ui/lib.js`, `ui/index.html`, `ui/riga-stato.test.js`) più questo corpo della PR.
