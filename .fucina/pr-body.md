Implementa T3 della spec 002 (REQ-110 parte, REQ-141): la funzione pura
`estraiSezioni(corpo)` in `ui/lib.js`, che dato il corpo markdown di una PR
restituisce `{ nonFatto, fattoInPiu, decisioni }` — il testo di ciascuna
sezione `## Non fatto`, `## Fatto in più`, `## Decisioni`, in qualsiasi
ordine, o `null` se l'intestazione non compare. Una sezione presente ma con
solo "Nulla" come contenuto restituisce la stringa `"Nulla"`, non `null`.
Le intestazioni di livello 3 o più dentro una sezione non la spezzano: solo
un'altra intestazione `##` chiude la sezione corrente.

`ui/estraiSezioni.test.js` (nuovo file, non ho toccato `ui/lib.test.js` né
`ui/configurazione.test.js`): 7 test, incluso un corpo senza sezioni e uno
con una sezione vuota ("Nulla").

Verificato con `node --test "ui/**/*.test.js"`: 21/21 verdi (7 nuovi + 14
esistenti).

Closes #15

## Decisioni
Nulla: la forma della funzione (oggetto con tre chiavi, `null` per le
sezioni assenti, riconoscimento in qualsiasi ordine) è quella descritta
dalla issue, nessuna scelta di implementazione lasciata aperta da un ADR.

## Non fatto
Non sono riuscita a recuperare i corpi reali delle PR #6 e #9 di
`fucina-lab` richiesti dal criterio di accettazione: in questa sessione
`gh` e l'accesso di rete diretto (curl, WebFetch) sono bloccati senza
approvazione, e non c'è un umano che possa concederla durante il run.
Ho testato la funzione su due corpi ricostruiti nella stessa forma imposta
dal ruolo dev-agent (titolo, corpo, sezioni Decisioni/Non fatto/Fatto in
più in ordine diverso fra loro) — vedi il commento in cima a
`ui/estraiSezioni.test.js` — oltre a un corpo senza sezioni, una sezione
vuota ("Nulla"), intestazioni in ordine sparso e un'intestazione di
livello 3 dentro una sezione. Se questi due corpi reali sono importanti da
avere per REQ-110 (coda "Aspettano te"), servirà un run con accesso a `gh`
o incollarli direttamente nella issue.

## Fatto in più
Nulla oltre a `ui/lib.js`, `ui/estraiSezioni.test.js` e questo file.
