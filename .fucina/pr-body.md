Implementa T001 della spec `006-registro-leggibile`: la tavolozza Ardesia e il contrasto come test. Il colore va per primo, da solo: la struttura della pagina non cambia in questo task.

## Cosa ho fatto

- In `ui/index.html`, sostituiti i sedici token di colore di entrambi i temi con i valori esatti di `contracts/palette.md`, e aggiunto il token nuovo `--colore-ok`.
- Tolto lo sfondo ambra dal pulsante `.rispondi-form button`: era l'unico punto in cui un colore semantico faceva da sfondo a un pulsante d'azione (REQ-543). Il pulsante ora eredita lo stile d'azione di `button` (sfondo accento).
- In `ui/lib.js`, `luminanza(colore)` e `contrasto(a, b)` secondo la formula WCAG 2.1 del contratto, e `COPPIE_CONTRASTO` con le quattordici coppie.
- Test nuovi in `ui/contrasto.test.js`: token letti dal vero foglio di stile e confrontati col contratto (nei due sensi), le 14 coppie ≥ 4,5:1 in entrambi i temi con minimo verificato a 5,23, una controprova che un valore degradato scende sotto soglia, uso corretto di accento (solo su link e pulsanti) e dei tre semantici (mai sfondo di un pulsante d'azione), assenza di comando di tema.

Questo è un secondo tentativo sulla stessa issue: un tentativo precedente aveva lo stesso contenuto ma un bug nel test che verifica il quinto criterio. La regex di scansione delle regole CSS usava `(^|\})` come gruppo di apertura senza il flag `m`: consumava la graffa di chiusura della regola precedente insieme a quella della regola corrente, e visitava una regola sì e una no — saltando `button:disabled` proprio nell'unico test che doveva coprirlo. Ho scritto la scansione con un solo pattern (`([^{}]+)\{([^{}]*)\}`) che visita tutte le regole senza saltarne, verificato aggiungendo temporaneamente `background: var(--colore-errore)` a `button:disabled` e controllando che il test diventasse rosso (poi rimosso).

Ho generalizzato anche il test sull'uso dell'accento: invece di una lista scritta a mano di selettori "di stato" (fragile ai task successivi che riscrivono la struttura), il test cerca ogni regola che usa l'accento e verifica che il suo selettore sia un link o un pulsante — non serve conoscere in anticipo quali selettori esistono.

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 292 test, tutti verdi (280 esistenti invariati + 12 nuovi).

Closes #90

## Decisioni

Nessun ADR: la rimozione dello sfondo ambra dal pulsante e la scelta della scansione CSS generale sono applicazioni dirette dei criteri della issue, non scelte discrezionali che cambiano comportamento visibile.

## Non fatto

Nulla: tutti i criteri di accettazione sono coperti, incluso il quinto che nel tentativo precedente aveva un buco nel test.

## Fatto in più

Nulla oltre ai tre file indicati dalla issue (`ui/index.html`, `ui/lib.js`, `ui/contrasto.test.js`) più questo corpo della PR.
