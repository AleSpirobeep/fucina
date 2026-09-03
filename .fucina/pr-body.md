Crea la cartella `ui/` con l'impalcatura minima richiesta dalla issue: `index.html`
(pagina con titolo "Registro" che importa `lib.js` come modulo ES), `lib.js` (esporta
`versione()` che restituisce `"0.1.0"`) e `lib.test.js` (test con `node:test` che la
verifica).

Closes #13.

**Come l'ho verificato:** `node --test "ui/**/*.test.js"` e `node --test` (senza
argomenti, che fa la scansione automatica della directory corrente) escono entrambi
verdi. Vedi però la nota sotto: il comando letterale `node --test ui/` fallisce in
questo ambiente per un motivo che non riguarda questi file.

## Decisioni

Nessun ADR aggiunto: nessuna delle scelte di questo task era mia da prendere, ho
seguito alla lettera il testo della issue.

**Attenzione — possibile problema di ambiente sul comando dei test:** nel sandbox in
cui ho lavorato, il comando letterale `node --test ui/` (quello indicato in
`.fucina.yml` alla chiave `test_command`, e usato in `.github/workflows/ci.yml`)
fallisce con `Cannot find module '.../ui'` invece di eseguire i test. Ho verificato che
non è un problema del codice appena scritto: la stessa identica eccezione compare
passando *qualsiasi* directory come argomento posizionale a `node --test`, comprese
directory vuote e una chiamata letteralmente `test/` — sembra che in questa build di
Node (`v22.23.2`) il runner non faccia la scansione ricorsiva quando riceve un
argomento-directory nudo, solo quando non riceve argomenti (scansione automatica dalla
cwd) o quando riceve un pattern glob esplicito come `"ui/**/*.test.js"`. Entrambe
queste alternative, sullo stesso codice, escono verdi.

Non ho toccato `.fucina.yml` né `.github/workflows/ci.yml` per non uscire dal
perimetro della issue (e perché `ci.yml` è comunque un percorso protetto). Chi
revisiona dovrebbe verificare se lo stesso comando fallisce anche sul runner reale di
GitHub Actions (la versione di Node lì potrebbe differire da quella del sandbox) prima
di dare per buono il check CI di questa PR: se fallisce anche lì, serve un intervento
umano su `ci.yml` (fuori dal mio perimetro) o una decisione su come cambiare
`test_command` in `.fucina.yml`.

## Non fatto

Nulla di quanto chiesto dalla issue: i tre file esistono con esattamente il contenuto
richiesto e i criteri di accettazione su struttura/contenuto sono soddisfatti. L'unico
punto aperto è la nota sopra sul comando `node --test ui/`, che è una scoperta
sull'ambiente, non un requisito lasciato incompleto.

## Fatto in più

Nulla: solo i tre file richiesti dalla issue (`ui/index.html`, `ui/lib.js`,
`ui/lib.test.js`) e questo `.fucina/pr-body.md`.
