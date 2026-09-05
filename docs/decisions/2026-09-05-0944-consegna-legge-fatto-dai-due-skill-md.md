---
status: accepted
date: 2026-09-05
decision-makers: [pm-agent]
---
# Il punto 4 di T006 (spec 004) si realizza nei due `SKILL.md` dell'analista

## Contesto e problema

Il task T006 della spec `004-analista` e la issue #107 elencano quattro punti di
correzione «tutti necessari». Il quarto dice: «la consegna usa `fatto` invece di
rileggere la casella per conto proprio: oggi la regola "un task `- [x]` è già fatto e non
riceve una issue" è applicata altrove, e va letta dallo stesso campo, così non possono
divergere».

La consegna non è codice: è la procedura descritta in `plugin/skills/analista/SKILL.md`
(sezione «La consegna — `/analista consegna`», riga 175) e nella sua copia installata
`.claude/skills/analista/SKILL.md`. La sezione «File da toccare» della issue #107 elenca
però solo tre file — i due `analista-cancello.js` e il nuovo file di test — e non nomina
nessuno dei due `SKILL.md`. `CLAUDE.md` dice di non toccare `plugin/` se l'issue non lo
nomina.

La PR #115 ha realizzato i punti 1, 2 e 3 e ha lasciato il punto 4 non fatto senza
dichiararlo, anzi dichiarando il contrario. Serve sciogliere l'ambiguità prima del
tentativo successivo, altrimenti si ripresenta identica.

## Opzioni considerate

- **A — Il punto 4 è fuori dal task.** Coerente con la lettera di «File da toccare», ma
  contraddice il testo del task in `specs/004-analista/tasks.md`, che è la spec: il punto
  resterebbe non realizzato senza che nessuno lo abbia deciso.
- **B — Il punto 4 rientra nel task, e i due `SKILL.md` sono in scope.** Il task nomina la
  consegna in modo esplicito; la consegna esiste in un solo posto, in due copie che vanno
  tenute allineate esattamente come i due `analista-cancello.js`. «File da toccare» è un
  elenco incompleto, non un divieto.
- **C — Aprire un task nuovo solo per il punto 4.** Un altro giro di fucina per una
  modifica di poche righe di prosa che è già scritta nella spec.

## Decisione

Opzione B. Per T006 della spec 004, `plugin/skills/analista/SKILL.md` e
`.claude/skills/analista/SKILL.md` sono file in scope: l'issue nomina la consegna nel
punto 4 della correzione, e quello è il file in cui la consegna vive. I due file restano
identici tra loro, come i due `analista-cancello.js`. L'agente sviluppatore li dichiara
in «Fatto in più», perché la sezione «File da toccare» della issue non li elenca.

Nessun requisito viene aggiunto o cambiato: REQ-321 e REQ-324 e il testo di T006 in
`specs/004-analista/tasks.md` restano quelli. Nessun effetto su sicurezza, token,
permessi o costi: `plugin/**` non è fra i `percorsi_protetti` di `.fucina.yml` e
`Edit`/`Write` sono già fra gli `strumenti_permessi` dell'agente sviluppatore.

## Conseguenze

- La PR #115 torna all'agente sviluppatore (`rimanda`) con il punto 4 da realizzare.
- Il divieto generale di `CLAUDE.md` su `plugin/` resta: vale l'eccezione «se l'issue li
  nomina», e qui il punto 4 li nomina nella sostanza. Questa deroga vale per T006 della
  spec 004 e non si estende ad altri task.
- Il rischio di divergenza fra la regola del cancello e quella della consegna — due letture
  indipendenti della stessa casella — si chiude, che è lo scopo del punto 4.
