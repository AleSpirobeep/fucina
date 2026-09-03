Implementa la configurazione iniziale del Registro (REQ-101, REQ-102, REQ-103):
al primo avvio la pagina mostra un modulo per l'elenco dei repo e il token, li
salva in `localStorage` e passa alla dashboard; ai successivi avvii parte
direttamente dalla dashboard; un pulsante "Configurazione" riapre il modulo, uno
"Dimentica il token" cancella solo il token e torna al modulo.

La validazione del formato `proprietario/nome` (righe vuote ignorate) è in
`ui/lib.js` (`parseElencoRepo`, `validaRepo`, `validaElencoRepo`,
`configurazioneValida`), testata in un nuovo file `ui/configurazione.test.js`
senza toccare `ui/lib.test.js`. `ui/index.html` importa queste funzioni e fa solo
rendering/localStorage, come richiesto da `CLAUDE.md`.

Il token non viene mai scritto in `console.log` né inserito in `innerHTML`: il
campo del modulo parte sempre vuoto (vedi ADR) e viene letto/scritto solo tramite
`localStorage` e la proprietà `.value` dell'input.

Closes #14.

**Come l'ho verificato:** `node --test "ui/**/*.test.js"` è verde (12 test, 12
pass). Ho anche riletto manualmente il flusso nel file `index.html`: prima
apertura senza dati in `localStorage` → modulo; salvataggio con repo/token validi
→ dashboard; "Dimentica il token" → torna al modulo con l'elenco repo ancora
precompilato ma il token vuoto; un elenco repo con una riga non valida mostra
l'errore e non salva nulla.

## Decisioni

- [`docs/decisions/2026-09-03-1059-token-mai-precompilato.md`](../docs/decisions/2026-09-03-1059-token-mai-precompilato.md):
  il campo token nel modulo non è mai precompilato con il valore salvato, per
  rispettare alla lettera il criterio "il token non compare mai nell'HTML" anche
  quando si riapre il modulo da "Configurazione". Vuoto al salvataggio = mantieni
  il token attuale.

## Non fatto

Nulla di quanto chiesto dai criteri di accettazione di T2. Non ho toccato REQ-110
e successivi (coda, avanzamento, comando): sono altre issue, fuori dal perimetro
di questa.

## Fatto in più

Nulla oltre ai file necessari: modificato `ui/lib.js` (nuove funzioni pure),
aggiunto `ui/configurazione.test.js`, riscritto `ui/index.html` (era solo un
titolo statico), aggiunto l'ADR sopra e questo `.fucina/pr-body.md`. Non ho
toccato `ui/lib.test.js`, né `specs/`, né i workflow.
