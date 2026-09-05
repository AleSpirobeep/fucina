T006 (`specs/006-registro-leggibile`): il Registro è usabile da 360 px in su, con un'unica
serie di regole CSS valida a ogni larghezza — nessuna "versione telefono" separata da
mantenere.

In `ui/index.html`:

- Aggiunto `<meta name="viewport" content="width=device-width, initial-scale=1" />` in
  `<head>`. Senza questo meta i browser dei telefoni impaginano su un viewport virtuale di
  ~980 px e poi rimpiccioliscono tutto: nessuna delle regole sotto avrebbe effetto reale su
  un telefono, solo restringendo la finestra di un browser desktop (dove il meta non serve,
  perché lì il viewport coincide già con la finestra).
- Tolta la `min-width: 1200px` dal `body` — causa diretta dello scorrimento orizzontale su
  schermi stretti.
- `.griglia-secondaria` (Avanzamento + Agenti attivi) collassa a una colonna sotto i 700 px
  con una media query.
- `button`, inclusi «Ferma» e «Avvia», hanno `min-height`/`min-width: 44px`.
- `input`/`textarea` prendono `width: 100%; max-width: 30rem`, così il campo repo
  (`cols="40"`) non sfora più a schermi stretti.
- I conteggi (`.conteggi-avanzamento`) avevano già `flex-wrap: wrap`: coperto da REQ-532
  senza bisogno di altro codice, solo di un test che lo verifichi.
- Un nome di repo lungo va già a capo grazie a `overflow-wrap: anywhere` ereditato dal
  `body`, mai spento da regole più specifiche: verificato, non serviva altro codice.

Nessuna funzione di `ui/lib.js` toccata: il task è quasi interamente foglio di stile
(REQ-552 rispettato).

Nuovo file `ui/telefono.test.js` (8 test) che legge il vero `<style>`/`<head>` di
`index.html`, sullo stesso schema di `contrasto.test.js`: meta viewport presente e con
`width=device-width`, nessuna `min-width` fissa su `body`, nessuna regola del foglio con
`min-width` oltre 44px, area toccabile dei pulsanti, soglia e presenza della media query
sulla griglia, `flex-wrap: wrap` sui conteggi, larghezza dei campi, ereditarietà di
`overflow-wrap`.

Suite completa: `node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` →
**355/355 verdi** (347 preesistenti invariati + 8 nuovi).

Closes #95

## Non fatto

La verifica visiva in un vero browser ridimensionato a 360×740 (assenza reale di
scorrimento orizzontale, leggibilità del testo). L'ambiente dell'agente non ha un browser
da pilotare, e per dichiarazione esplicita del piano della spec 006 (sezione «Rischi») è
una verifica di Alessio, non della suite — la CI non può restringere una finestra.

## Fatto in più

Il meta viewport (`<meta name="viewport" ...>`) e il suo test: non nominato esplicitamente
nella issue, ma senza di esso nessuna regola CSS di questo task si applicherebbe su un vero
telefono (il dispositivo dello scenario 3 della spec), solo restringendo una finestra
desktop — dove il difetto non si vedrebbe. È lo stesso criterio di accettazione
(«raggiungibili e toccabili», «nessuna sezione provoca scorrimento orizzontale») applicato
al dispositivo reale invece che alla sua unica approssimazione controllabile dalla CI.

Fix di `input`/`textarea` (`width: 100%; max-width: 30rem`) — non nominato esplicitamente
nella issue, ma necessario perché il campo repo della configurazione non sforasse lo
schermo a 360 px, violando lo stesso criterio di accettazione sullo scorrimento
orizzontale.
