Implementa T2 della spec 002 (REQ-101, REQ-102, REQ-103): la configurazione iniziale
del Registro (elenco repo e token in `localStorage`), con le due correzioni chieste
dal PM dopo la revisione della PR #27.

- `ui/lib.js`: nuove funzioni pure `parseElencoRepo`, `validaRepo`, `validaElencoRepo`,
  `configurazioneValida`. `validaElencoRepo` rifiuta esplicitamente l'elenco vuoto e un
  testo di sole righe vuote/spazi, restituendo `{ ok: false, repos: [], errore }`.
- `ui/configurazione.test.js` (nuovo file, non ho toccato `ui/lib.test.js`): 13 test
  per le nuove funzioni, inclusi i due casi di elenco vuoto richiesti dal PM.
- `ui/index.html`: al primo avvio mostra il modulo di configurazione; dopo un
  salvataggio valido (repo validi + token) mostra la dashboard; ai successivi avvii
  parte dalla dashboard perché la condizione è la presenza del token in
  `localStorage`. Un elenco repo vuoto o di sole righe vuote non salva nulla e mostra
  "Inserisci almeno un repo." in italiano. Il pulsante "Configurazione" riapre il
  modulo, "Dimentica il token" cancella solo il token e torna al modulo. Il campo
  token non è mai precompilato (vedi ADR) e il suo segnaposto è calcolato ogni volta
  che il modulo si apre: con un token già salvato invita a lasciarlo vuoto per non
  cambiarlo, senza token dice solo "Token personale di GitHub". Il token non è mai
  scritto in `console.log` né in `innerHTML`.

Verificato con `node --test "ui/**/*.test.js"`: 14/14 verdi (13 nuovi + 1 esistente).

Closes #14

## Decisioni
- [`docs/decisions/2026-09-03-1105-token-mai-precompilato.md`](../docs/decisions/2026-09-03-1105-token-mai-precompilato.md):
  il campo token nel modulo non è mai precompilato con il valore salvato, per
  rispettare alla lettera "il token non compare mai nell'HTML"; vuoto al salvataggio
  = mantieni il token attuale; il segnaposto riflette la presenza effettiva del
  token al momento in cui il modulo si apre, così resta corretto anche subito dopo
  "Dimentica il token".

## Non fatto
Nulla dei criteri di T2, inclusi i due punti aggiuntivi del PM. REQ-110 e successivi
(coda, avanzamento, comando) sono fuori dal perimetro di questa issue.

## Fatto in più
Nulla oltre ai file necessari: `ui/lib.js`, `ui/configurazione.test.js`,
`ui/index.html`, l'ADR e questo file.
