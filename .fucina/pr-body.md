T006 della spec `006-registro-leggibile`: il Registro si usa da 360 px di larghezza in su,
senza una seconda pagina da mantenere per il telefono.

In `ui/index.html`:

- Tolta la `min-width: 1200px` dal `body`, che da sola bastava a forzare lo scorrimento
  orizzontale su qualunque schermo più stretto.
- `.griglia-secondaria` (Avanzamento + Agenti attivi) si riduce a una colonna sotto i 700 px
  con una media query, invece di restare a due colonne compresse.
- I pulsanti (`button`) hanno ora `min-height: 44px` e `min-width: 44px`, «Ferma» e «Avvia»
  compresi: l'unica regola vale a ogni larghezza, non solo sotto i 700 px.
- `input` e `textarea` (compreso il campo repo della configurazione, che aveva `cols="40"` e
  poteva sforare uno schermo stretto) prendono `width: 100%` con `max-width: 30rem`.
- Il nome di un repo lungo va già a capo grazie a `overflow-wrap: anywhere`, ereditato dal
  `body` fino all'`h3` del titolo: nessuna regola più specifica lo spegneva, quindi non serve
  aggiungere altro perché non spinga fuori il pulsante del PM, che sta comunque su una riga
  di blocco separata e successiva, non affiancata al titolo.

Nessuna funzione di `ui/lib.js` è cambiata: la spec 006 qui riorganizza solo la resa (REQ-552),
e infatti non c'era logica nuova da estrarre in funzioni pure — il lavoro di T006 è quasi
interamente il foglio di stile.

**Verificato con**: `node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` →
353/353 verdi (280 preesistenti, invariati, più le nuove). Nuovo file `ui/telefono.test.js`,
8 test: legge il vero `<style>` di `index.html` (stesso metodo di `contrasto.test.js` e
`riga-pm.test.js`) e verifica ciò che la CI può verificare senza un browser — l'assenza di
una `min-width` fissa sul `body`, l'area toccabile dei pulsanti, l'esistenza e la soglia della
media query che riduce la griglia a una colonna, `flex-wrap: wrap` sui conteggi, l'ereditarietà
di `overflow-wrap: anywhere` fino al titolo del repo, e `width: 100%` su `textarea`. Come nota
il piano della spec (sezione «Rischi»), lo scorrimento orizzontale vero e il "va a capo"
effettivo restano una verifica di Alessio restringendo una finestra del browser a 360 px: non
sono provabili dalla CI, e la suite non finge il contrario.

Closes #95

## Decisioni

Nessun ADR aggiunto: le scelte di questo task (soglia dei 700 px per la griglia, 30rem come
larghezza massima dei campi, il modo di verificare in CI ciò che è verificabile) non cambiano
comportamento visibile oltre a quanto la issue chiedeva, e la spec/il piano di 006 coprono già
il principio guida («una sola serie di regole, non una seconda pagina»).

## Non fatto

Nulla dei criteri di accettazione della issue: a 360×740 nessuna sezione ha più una larghezza
minima che forzi lo scorrimento; «Ferma» e «Avvia» restano gli stessi pulsanti con la stessa
conferma su «Avvia» (nessuna logica toccata) e hanno ora un'area toccabile di almeno 44×44 px;
i conteggi continuano ad andare a capo (`flex-wrap: wrap`, invariato) invece di scorrere; un
nome di repo lungo va a capo senza spingere fuori il pulsante del PM.
Non verificato a occhio in un vero browser ridimensionato a 360 px: l'ambiente di questo
agente non ha un browser da pilotare, e il piano della spec dichiara esplicitamente che questa
verifica finale spetta ad Alessio, non alla suite.

## Fatto in più

`ui/index.html`: oltre alle regole richieste esplicitamente dalla issue (griglia a una
colonna, pulsanti toccabili, conteggi a capo, repo lunghi), ho aggiunto `width: 100%` e
`max-width: 30rem` su `input`/`textarea` — il campo repo della configurazione (`cols="40"`)
poteva altrimenti restare più largo dello schermo a 360 px, violando lo stesso criterio «nessuna
sezione provoca scorrimento orizzontale» su una sezione che la issue non nominava per nome.
