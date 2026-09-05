La sezione «Agenti attivi» ora compare nel documento solo quando almeno un repo
configurato ha un'esecuzione in corso o in coda; il conteggio nella riga di stato
resta sempre presente, in entrambi i casi.

- `ui/lib.js`: nuova funzione pura `sezioneAgentiAttiviVisibile(repos, statoAgentiAttiviRepo)`,
  che guarda i dati già caricati (nessuna chiamata di rete) e dice se almeno un repo ha
  agenti al lavoro.
- `ui/index.html`: la `<section id="agentiAttivi">` parte `hidden` e il suo attributo
  `hidden` viene aggiornato in `renderAgentiAttivi`, ad ogni giro di caricamento, in base
  a `sezioneAgentiAttiviVisibile`. La riga di stato (`renderRigaStato`, già esistente) non
  è toccata: continua a mostrare il conteggio degli agenti — incluso «nessun agente al
  lavoro» — indipendentemente dalla visibilità della sezione.

**Verificato con**: `node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 341
test verdi (280 preesistenti, non modificati, più i nuovi di questo task e delle PR
precedenti della spec 006).

Closes #94

## Decisioni

Nessun ADR aggiunto: l'implementazione segue alla lettera REQ-520 e non richiede una
scelta non coperta dalla spec.

## Non fatto

Nulla: tutti e tre i criteri di accettazione della issue sono coperti (sezione assente
senza esecuzioni con riga di stato che dice «nessun agente al lavoro»; sezione che
compare entro un aggiornamento; conteggio sempre presente in entrambi i casi).

## Fatto in più

Nulla: solo i due file indicati dalla issue, più il nuovo file di test.
