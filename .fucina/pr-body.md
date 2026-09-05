`estraiTask` cattura ora la casella del task (`- [ ]` o `- [x]`) ed espone `fatto` accanto
a `manuale`. I due controlli che predicono un blocco futuro del guard —
`task-su-percorso-protetto` e `task-su-workflow` — saltano i task `fatto`: la PR che
predicono non esisterà mai più, perché il task è già stato fuso. La copertura dei
requisiti (`requisito-non-coperto`) resta invariata e continua a contare anche i task
`fatto`, come richiesto dal punto 3 della issue — escluderli avrebbe scambiato un falso
positivo con un altro.

`template/scripts/analista-cancello.js` e `scripts/analista-cancello.js` restano
identici (`git diff --no-index` vuoto). Il file di test del cancello,
`analista-cancello.test.js`, non è stato toccato: è protetto, e i test nuovi stanno in
`template/scripts/cancello-task-fatti.test.js` (5 test).

**Verificato con**: `node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 346
test verdi (341 preesistenti, non modificati, più i 5 nuovi di questo task).

Closes #107

## Decisioni

Nessun ADR aggiunto: la correzione segue alla lettera i quattro punti della issue e non
richiede una scelta non coperta da essa.

## Non fatto

Il criterio «`node scripts/analista-cancello.js specs/006-registro-leggibile` esce 0»
non è verificabile alla lettera nello stato attuale del repo: da quando è stata scritta
la issue, altri task di quella spec (T002a–T005) sono stati fusi ma le loro caselle in
`tasks.md` non sono mai state spuntate, quindi restano rilevati come task da lavorare
che toccano file di test già esistenti — un problema di `tasks.md` non aggiornato,
indipendente dal difetto di questa issue e fuori dai file da toccare elencati (che non
includono `specs/006-registro-leggibile/tasks.md`, protetto comunque da
`percorsi_protetti`). Il difetto specifico descritto nella issue (T001 fuso, casella
`[x]`) è verificato: senza la correzione produce `task-su-percorso-protetto` su T001,
con la correzione no — confermato sia sul cancello reale sia da un test isolato nuovo
che non dipende dallo stato mutevole di `specs/006-*`.

## Fatto in più

Nulla: solo i tre file indicati dalla issue (i due file del cancello, identici tra loro,
e il nuovo file di test).
