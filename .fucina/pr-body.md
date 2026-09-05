Implementa T002b della spec `006-registro-leggibile`: i tre stati della riga di stato (spec.md REQ-501, 502; tasks.md T002b), divisa da T002 (#91) dopo tre tentativi esauriti (PR #99, #100, #101) e già ritentata due volte (PR chiusa per fallimento del check `guard`; seconda PR chiusa perché il corpo mancava delle sezioni "Non fatto" e "Fatto in più").

## Cosa ho fatto

- In `ui/lib.js`, `situazioneRigaStato(pmVoce, agentiVoce, avanzamentoVoce)`: pura, senza rete. Dice se un repo è in `"caricamento"` (almeno una delle tre fonti — PM, agenti attivi, avanzamento — non ha mai completato un giro, voce `undefined`), `"incompleto"` (una fonte ha fallito il proprio giro più recente, `nonAggiornato`, anche se porta ancora i dati di un giro riuscito in precedenza — REQ-122 spec 002 li tiene in memoria ma non li lascia mai leggere come freschi) o `"riuscito"` (tutte e tre fresche).
- `testoRigaStatoCaricamento(repo)` e `testoRigaStatoIncompleto(repo)`: la seconda nomina solo il repo, senza ripetere il testo integrale dell'errore (già nel banner e in Avanzamento).
- In `ui/index.html`, `renderRigaStato()` ora produce sempre una riga per ogni repo configurato — mai un vuoto in mezzo agli altri: calcola la situazione con `situazioneRigaStato` e sceglie il testo di conseguenza. Per "riuscito" continua a leggere i tre testi da `rigaStato` (T002a, non toccata). Per "incompleto" imposta `role="alert"` (il colore d'errore in pagina è legato solo a quello, nessuna classe nuova); per "caricamento" non lo imposta, tono neutro.
- Test nuovi in `ui/stati-riga-stato.test.js`: nessuna fonte completata, una sola fonte mancante, tutte e tre riuscite, una fonte che fallisce al primo giro (incompleto, non caricamento), una fonte che smette di rispondere dopo un giro riuscito (costruita con `aggiornaStatoRepo` reale, verificando che il dato vecchio resti in memoria ma non sia mai letto come `"riuscito"`), i due testi (quello di incompletezza verificato per non contenere il testo integrale di un errore d'esempio), nessuna chiamata `fetch`.

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 312 test verdi (303 esistenti invariati + 9 nuovi). Nessun file di test esistente toccato.

Closes #104

## Decisioni

Nessun ADR: i tre stati sono a livello di intero repo (non per singola fonte dentro lo stesso repo), come impongono i criteri di accettazione della issue e il caso limite della spec 006 ("un repo risponde e un altro no"), sempre riferiti a un repo nel suo complesso — è la lezione delle tre revisioni precedenti di T002 (#91), che mescolavano gli stati senza nominarli. Riusare `role="alert"` invece di una classe CSS nuova non è discrezionale: è l'unico aggancio già esistente nella pagina per il colore d'errore.

## Non fatto

Nulla: tutti i criteri di accettazione della issue sono coperti.

## Fatto in più

Nulla oltre ai tre file indicati dalla issue (`ui/lib.js`, `ui/index.html`, `ui/stati-riga-stato.test.js`) più questo corpo della PR.
