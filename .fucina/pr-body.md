Implementa T001 della spec `006-registro-leggibile`: la tavolozza Ardesia e il contrasto
come test. Il colore va per primo, da solo: la struttura della pagina non cambia in questo
task.

## Cosa ho fatto

- In `ui/index.html`, sostituiti i sedici token di colore di entrambi i temi con i valori
  esatti di `contracts/palette.md`, e aggiunto il token nuovo `--colore-ok` (unico nome
  nuovo rispetto a oggi).
- Nella stessa regola, tolto lo sfondo ambra dal pulsante `.rispondi-form button`: era
  l'unico punto del foglio di stile in cui un colore semantico faceva da sfondo a un
  pulsante d'azione, in contrasto con REQ-543. Il pulsante torna allo stile di default
  (accento), come tutti gli altri pulsanti della pagina.
- In `ui/lib.js`, `luminanza(colore)` e `contrasto(a, b)` secondo la formula WCAG 2.1 del
  contratto, e `COPPIE_CONTRASTO`: la tabella delle quattordici coppie da verificare.
- Test nuovi in `ui/contrasto.test.js`: i sedici token di ciascun tema letti direttamente
  da `ui/index.html` (non duplicati a mano) coincidono con il contratto; le quattordici
  coppie superano 4,5:1 in entrambi i temi con minimo 5,23; un valore ambra spostato verso
  il grigio del fondo dimostra che il test scenderebbe sotto soglia; il foglio di stile non
  usa un colore semantico come sfondo di un pulsante e non usa l'accento per indicare uno
  stato; nessun comando di tema nell'interfaccia.

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 290 test, tutti verdi
(280 esistenti invariati + 10 nuovi in `ui/contrasto.test.js`).

Closes #90

## Decisioni

Nessun ADR: la rimozione dello sfondo ambra dal pulsante `.rispondi-form button` non è una
scelta discrezionale, ma l'applicazione diretta di un criterio di accettazione della issue
("i tre colori semantici non compaiono come sfondo di un pulsante d'azione").

## Non fatto

Nulla: tutti i criteri di accettazione della issue sono coperti dai test nuovi.

## Fatto in più

Nulla: solo `ui/index.html`, `ui/lib.js` e il nuovo `ui/contrasto.test.js` sono stati
toccati, come indicato dalla issue.
