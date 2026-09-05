Implementa T003 della spec `006-registro-leggibile`: l'avanzamento come riga di sette conteggi (spec.md REQ-510, 513; tasks.md T003).

## Cosa ho fatto

- In `ui/lib.js`, `vociAvanzamento(classificazione, inCoda)`: pura, senza rete. Riusa `tabellaAvanzamento` per le sei colonne esistenti, tenendo solo `chiave`, `etichetta` e `conteggio` (nessun titolo), e aggiunge una settima voce `inCoda` col conteggio passato come parametro (calcolato altrove da `contaInCoda`, nessuna chiamata nuova). Ogni voce porta `apribile: conteggio > 0`.
- `testoConteggioAvanzamento(voce)`: compone `"Etichetta numero"` (es. `"Fatte 7"`, `"Backlog 0"`), il formato usato dagli scenari della spec.
- In `ui/index.html`, `costruisciConteggiAvanzamento` sostituisce `costruisciTabellaRepo`: rende una `<ul class="conteggi-avanzamento">` di sette voci. Una voce apribile è un `<details><summary>` — l'indicatore d'apertura e la reazione al clic sono quelli nativi del browser, senza JavaScript su misura; una voce a zero è un `<span>` semplice, che non ha né l'uno né l'altro (REQ-513). Il contenuto del `<details>` resta vuoto: i titoli con link sono il dettaglio di T004, fuori dal perimetro di questa issue.
- Tolto il paragrafo del conteggio in-coda da `costruisciRigaPm`: la riga del PM torna a mostrare solo stato, ultima esecuzione e comando. La funzione pura `rigaPm()` continua a calcolare `testoInCoda` (il suo test in `ui/riga-pm.test.js` è un percorso protetto e non l'ho toccato) ma quel valore non viene più letto per il rendering: il numero dei task in coda compare una volta sola nella pagina, nella riga dei sette conteggi.
- Rimossi gli stili `table`/`th`/`td` non più usati da nessun altro punto della pagina (l'unico impiego era la tabella che ho sostituito), aggiunto lo stile per `.conteggi-avanzamento`.
- Test nuovi in `ui/conteggi-avanzamento.test.js`: le sette chiavi ed etichette nell'ordine giusto; sette issue chiuse di recente e tre in coda → sette conteggi, nessuna voce porta `elementi` o `titolo`; il conteggio in-coda arriva dal parametro e non dalla classificazione; ogni voce a zero ha `apribile: false`; una voce con conteggio maggiore di zero ha `apribile: true`; nessuna chiamata `fetch`; `testoConteggioAvanzamento` compone etichetta e numero.

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 319 test verdi (312 esistenti invariati + 7 nuovi). Nessun file di test esistente toccato.

Closes #92

## Decisioni

Nessun ADR: l'uso di `<details>`/`<summary>` per l'indicatore e la reazione al clic è la lettura più diretta di "una voce a zero non reagisce al clic e non mostra l'indicatore di apertura che hanno le altre" — comportamento nativo del browser, niente da testare con `node:test` oltre al flag `apribile` che lo determina, e niente da costruire in anticipo per T004 (apertura, titoli, memoria), che resta libero di riempire il `<details>` come vuole.

## Non fatto

Nulla: i criteri di accettazione della issue (sette conteggi senza titoli, il numero in-coda una sola volta e fuori dalla riga del PM, una voce a zero non apribile, nessuna richiesta di rete) sono coperti tutti.

## Fatto in più

Rimossi gli stili `table`, `th`, `td` e `td ul` dal foglio di stile: diventati inutilizzati nello stesso cambio che toglie l'unica tabella della pagina, lasciarli sarebbe stato CSS morto.
