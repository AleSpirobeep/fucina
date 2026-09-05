Implementa T002 della spec `006-registro-leggibile`: la riga di stato sopra ogni sezione.

## Cosa ho fatto

- In `ui/lib.js`, `rigaStato(repos, statoPmRepo, statoAgentiAttiviRepo, statoAvanzamentoRepo)`: per ogni repo compone stato del PM, agenti al lavoro e lavoro in attesa (totale) dai dati che la pagina ha già caricato, senza chiamate nuove. Un dato è affidabile solo se l'ultimo giro per quella voce è andato a buon fine (`!nonAggiornato`): questo copre sia un repo mai caricato con successo sia un repo che ha smesso di rispondere dopo un giro riuscito (REQ-122 della spec 002, non emendato dalla 006) — in entrambi i casi il dato vecchio o assente non viene mostrato come fresco. Con un repo parzialmente affidabile (es. solo il PM non risponde), la funzione riporta comunque i conteggi che ha (agenti e lavoro) e segnala solo la parte incompleta, invece di scartare tutto o di sommare uno zero finto. Senza repo configurati restituisce `{ configurato: false }`. Con tutti i dati presenti — anche a zero — il testo lo dice esplicitamente ("nessun agente al lavoro", "niente in attesa").
- In `ui/index.html`, `#rigaStato` in cima alla dashboard, prima della sezione «Aspettano te» (ordine: riga di stato, «Aspettano te», «Avanzamento», «Agenti attivi»). `renderRigaStato()` si richiama ovunque cambino i dati da cui dipende — a fine `caricaPm()`, `caricaAvanzamento()`, `caricaAgentiAttivi()`, e nei rami d'errore di `gestisciFermaPm`/`gestisciAvviaPm` — così la riga non resta indietro rispetto ai comandi del PM. Prima che un repo completi il proprio primo giro, `rigaStato` restituisce testo ed errore nulli: la pagina mostra "In caricamento…", non un allarme, perché non è ancora un guasto. Senza repo configurati mostra un rimando alla configurazione invece di tre zeri.
- Test nuovi in `ui/riga-stato.test.js`: nessun repo configurato, repo del tutto a riposo, pluralizzazioni, PM non installato, repo mai caricato, un repo che smette di rispondere dopo un giro riuscito (costruito con `aggiornaStatoRepo` reale, non con dati letterali), un repo che risponde e uno no (i conteggi del primo non spariscono, solo il secondo è segnalato incompleto), un repo affidabile solo in parte (mostra ciò che ha), nessuna chiamata `fetch`.

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 303 test verdi (292 esistenti invariati + 11 nuovi).

Closes #91

## Decisioni

Nessun ADR: trattare `nonAggiornato` come dato non affidabile è la lettura diretta di REQ-122 (spec 002, non emendato dalla 006); mostrare i conteggi disponibili di un repo parzialmente affidabile invece di scartarli tutti è la lettura diretta del caso limite della spec 006 ("riporta i conteggi che ha... non somma dati parziali fingendo che siano totali"). Nessuna delle due è una scelta discrezionale che introduce comportamento nuovo.

## Non fatto

Nulla: tutti i criteri di accettazione della issue sono coperti.

## Fatto in più

Nulla oltre ai tre file indicati dalla issue (`ui/lib.js`, `ui/index.html`, `ui/riga-stato.test.js`) più questo corpo della PR.
