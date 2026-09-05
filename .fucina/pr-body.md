Implementa T002b della spec `006-registro-leggibile`: i tre stati della riga di stato.

## Cosa ho fatto

- In `ui/lib.js`, `situazioneRigaStato(pmVoce, agentiVoce, avanzamentoVoce)`: dato lo stato per repo delle tre fonti da cui dipende la riga (PM, agenti attivi, avanzamento), dice in quale delle tre situazioni si trova quel repo — `"caricamento"` finché anche una sola delle tre fonti non ha mai completato un giro (voce `undefined`), `"incompleto"` se almeno una fonte ha fallito il proprio giro più recente (`nonAggiornato` o nessun dato), `"riuscito"` solo quando tutte e tre sono fresche. Un dato marcato `nonAggiornato` non è mai trattato come fresco anche se resta in memoria da un giro precedente riuscito (REQ-122, spec 002): la funzione non lo confonde con `"riuscito"`. Due funzioni di testo, `testoRigaStatoCaricamento(repo)` e `testoRigaStatoIncompleto(repo)`, producono la sintesi da mostrare — la seconda nomina solo il repo, senza ripetere il testo integrale dell'errore, che sta già nel banner e nella sezione Avanzamento. Nessuna delle tre chiama `fetch`: leggono solo le voci già in memoria.
- In `ui/index.html`, `renderRigaStato()` ora produce sempre una riga per ciascun repo configurato, mai un vuoto in mezzo agli altri: per ognuno calcola la situazione con `situazioneRigaStato` e sceglie il testo di conseguenza — i conteggi di `rigaStato` (invariata, T002a) per `"riuscito"`, `testoRigaStatoIncompleto` con `role="alert"` per `"incompleto"`, `testoRigaStatoCaricamento` senza `role="alert"` per `"caricamento"`. Il colore d'errore in questa pagina è legato esclusivamente a `[role="alert"]` nel foglio di stile: non impostarlo per lo stato di caricamento è già sufficiente a rispettare "tono neutro, senza il colore d'errore" senza bisogno di una classe nuova.
- `rigaStato` (T002a) non è toccata: resta la sola fonte dei tre testi per il caso riuscito, e i suoi test esistenti restano validi così come sono.
- Test nuovi in `ui/stati-riga-stato.test.js`: nessuna fonte completata, una sola fonte mancante, tutte e tre riuscite, una fonte mai riuscita, una fonte che ha smesso di rispondere dopo un giro riuscito (costruita con `aggiornaStatoRepo` reale, verificando che il dato vecchio resti in memoria ma non sia mai letto come `"riuscito"`), i testi di caricamento e di incompletezza (quest'ultimo verificato per non contenere il testo dell'errore originale), nessuna chiamata `fetch`.

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 312 test verdi (301 esistenti invariati + 11 nuovi).

Closes #104

## Decisioni

Nessun ADR: la scelta di rappresentare i tre stati a livello di intero repo (non per singola fonte, cioè PM/agenti/avanzamento) segue alla lettera i criteri di accettazione della issue e il caso limite della spec 006 ("un repo risponde e un altro no"), che parlano sempre di un repo nel suo complesso. È anche la lezione delle tre revisioni precedenti di T002 (#91): un tentativo che mescolava affidabilità per singola fonte dentro un solo repo è quello per cui la issue #104 dice esplicitamente "ora sono nominati" i tre stati, in numero fisso. Riusare il colore d'errore già legato a `[role="alert"]` invece di introdurre una classe CSS nuova non è una scelta discrezionale: è l'unico modo già esistente nella pagina per marcare/non marcare un testo come errore.

## Non fatto

Nulla: tutti i criteri di accettazione della issue sono coperti.

## Fatto in più

Nulla oltre ai tre file indicati dalla issue (`ui/lib.js`, `ui/index.html`, `ui/stati-riga-stato.test.js`) più questo corpo della PR.
