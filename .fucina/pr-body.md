## Cosa ho fatto

Il dettaglio che si apre, e che viene ricordato — T004 della spec 006.

- `ui/lib.js`:
  - `tabellaAvanzamento(classificazione, issueInCoda)`: il secondo parametro è opzionale,
    retrocompatibile con l'unico uso esistente (`vociAvanzamento`) e con il test protetto
    `ui/avanzamento.test.js`. Passandolo, aggiunge la settima colonna «In coda» con titolo
    e url di ogni issue, sullo stesso modello delle altre sei — è il dato che mancava per
    mostrare il dettaglio di quel conteggio, dato che `vociAvanzamento` non porta titoli
    per contratto (il test `ui/conteggi-avanzamento.test.js` lo verifica esplicitamente).
  - `idDettaglioAvanzamento`, `dettagliApertiDaTesto`, `testoDettagliAperti`,
    `alternaDettaglioAperto`, `dettagliApertiValidi`: le funzioni pure della memoria dei
    dettagli aperti — costruzione dell'id, (de)serializzazione JSON tollerante a memoria
    assente o malformata, apertura/chiusura, e l'oblio di un id che punta a un conteggio
    tornato a zero.
- `ui/index.html`:
  - ogni conteggio apribile è ora un `<details>` con dentro un `<ul class="dettaglio-conteggio">`
    di link a GitHub (titolo + url), scrollabile nel proprio riquadro (`max-height` +
    `overflow-y: auto`) invece di allungare la pagina.
  - lo stato aperto/chiuso si legge e si scrive nella chiave `fucina.dettagliAperti`, con lo
    stesso prefisso di `fucina.token` e `fucina.repoTesto`; lettura e scrittura sono avvolte
    in try/catch, così una finestra privata che rifiuta la memoria non produce errori e la
    pagina parte compatta.
  - a ogni giro di `caricaAvanzamento`, i dettagli ricordati del repo appena caricato che non
    sono più fra i conteggi apribili vengono dimenticati (non solo mostrati chiusi); i
    dettagli di repo non ancora caricati in questo giro non vengono toccati, perché non si sa
    ancora se sono validi.
  - «Dimentica il token» ora azzera anche questa memoria.
  - un dettaglio da tenere presente: impostare `details.open = true` per ripristinare uno
    stato ricordato *aggiunge* l'attributo `open`, e questo — per specifica HTML — accoda
    comunque un evento `toggle` nativo, anche senza alcun clic dell'utente. Senza una
    guardia, quell'eco avrebbe cancellato la memoria appena ripristinata al primo giro di
    event loop dopo il caricamento. La guardia scatta solo quando il dettaglio parte aperto
    (l'unico caso che genera una mutazione dell'attributo, quindi l'unico che accoda
    l'evento): i conteggi che partono chiusi rispondono al primo clic normalmente.
- Test in `ui/dettaglio-apribile.test.js` (nuovo): 14 casi, su tutte le funzioni pure sopra.

## Come l'ho verificato

- `node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 333 test, tutti verdi
  (280+ preesistenti, invariati, più i 14 nuovi di questo task).
- `node --check` sul contenuto di `ui/lib.js` e dello script di `ui/index.html`.
- Il comportamento del `toggle` nativo di `<details>` descritto sopra è stato confermato
  contro la specifica HTML (l'attributo `open` che cambia accoda sempre un evento,
  indipendentemente da un clic); non è stato possibile un giro completo in un browser reale
  con dati GitHub live in questo ambiente (nessun token configurato).

## Decisioni

Nessun ADR nuovo: le scelte di questo task (formato della chiave di memoria, separatore
dell'id, ambito della potatura per repo) sono dettagli di implementazione già coperti dalla
Fase 0 del piano («la memoria della vista sta accanto alle altre preferenze del browser, con
lo stesso prefisso»), senza alternative con conseguenze da confrontare.

Closes #93

## Non fatto

Nulla dei criteri di accettazione della issue: apertura/chiusura con titoli e link,
persistenza al ricarico, azzeramento con «Dimentica il token», nessun errore in finestra
privata, oblio del dettaglio a conteggio zero, e scorrimento del riquadro sono tutti
implementati e coperti da test dove la logica è pura. La verifica visiva in un browser reale
(schermo 1280×800, finestra privata, molti titoli) resta da fare da chi ha un token e un repo
di prova, come già per gli altri task di questa fase.

## Fatto in più

Nulla: solo i tre file indicati dalla issue (`ui/index.html`, `ui/lib.js`,
`ui/dettaglio-apribile.test.js`).
