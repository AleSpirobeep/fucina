---
status: accepted
date: 2026-09-05
decision-makers: [pm-agent]
---
# «Fatto in più» risponde delle modifiche dell'agente, non dei commit che Alessio aggiunge al ramo

## Contesto e problema

Il punto 4 della lista di revisione del PM (`.claude/skills/pm-agent/SKILL.md`) dice:
«Confrontalo con `gh pr diff <n> --name-only`. Se ha toccato file che l'issue non nominava
e non li ha dichiarati, è da rimandare — non per il contenuto, per la mancata
dichiarazione.» È scritto senza eccezioni.

Sulla PR #116 quel confronto dà un file in più rispetto a «Fatto in più»:
`.claude/skills/analista/SKILL.md`. Ma quel file non l'ha toccato l'agente sviluppatore.
L'agente ha dichiarato in «Non fatto» di non poterlo scrivere — il sistema di permessi
respinge ogni scrittura sotto `.claude/`, con `Edit`, `Write` e `Bash` allo stesso modo — e
il verdetto `umano` del giro precedente ha chiesto ad Alessio come procedere. Alessio ha
scelto l'opzione A e ha sincronizzato il file a mano, commit `483a045` sul ramo della PR,
con un messaggio di commit che spiega cosa e perché, più un commento sulla PR che lo
dichiara e restituisce la PR al PM per la fusione.

Applicando il punto 4 alla lettera, quella PR va rimandata. Ma il rimando riporta il lavoro
all'agente sviluppatore, che riparte da `main` senza il commit di Alessio e ricade sullo
stesso muro di permessi: riscriverebbe la stessa dichiarazione in «Non fatto», e il PM si
troverebbe davanti la stessa PR. È un ciclo che non termina.

La situazione non è rara: ogni volta che un verdetto `umano` chiede ad Alessio di sbloccare
qualcosa che l'agente non può fare, la risposta arriva come commit sul ramo della PR, e il
corpo della PR — scritto prima, dall'agente — resta indietro.

## Opzioni considerate

- **A — Il punto 4 si applica a tutti i file del diff, senza distinzione.** Coerente con la
  lettera della lista, ma su questa PR produce un ciclo: l'agente non può fare ciò che
  servirebbe per uscirne, e ogni giro costa un run senza cambiare niente.
- **B — Il punto 4 si applica alle modifiche dell'agente sviluppatore.** I commit che
  Alessio aggiunge al ramo in risposta a un verdetto `umano` si giudicano sul contenuto —
  vanno letti riga per riga come tutto il resto — ma non contro «Fatto in più», che è la
  dichiarazione dell'agente su ciò che ha fatto lui.
- **C — Rimandare chiedendo solo di aggiornare il corpo della PR.** Un run intero per una
  correzione di prosa, che l'agente peraltro non potrebbe scrivere in modo diverso: il
  blocco su `.claude/` c'è ancora dal suo lato.

## Decisione

Opzione B. Il punto 4 della lista di revisione confronta «Fatto in più» con i file toccati
**dall'agente sviluppatore**. Quando un commit sul ramo è di Alessio — riconoscibile dal
messaggio di commit e da un commento sulla PR che lo dichiara — il PM lo legge e lo giudica
nel merito come ogni altra riga del diff, ma la sua assenza da «Fatto in più» non è motivo
di rimando: l'agente non poteva dichiarare una modifica che non ha fatto e che non esisteva
quando ha scritto il corpo.

Ne segue che il corpo della PR può restare indietro su ciò che il commit di Alessio ha
risolto: la sezione «Non fatto» della PR #116 dichiara ancora `.claude/skills/analista/SKILL.md`
non aggiornato, mentre sul ramo lo è. Il PM verifica lo stato del ramo, non il racconto, e
il racconto non aggiornato in questo caso non è un difetto da rimandare.

Un commit non riconducibile ad Alessio e non dichiarato da nessuno resta invece un motivo
di rimando pieno, com'era.

## Conseguenze

- La PR #116 si fonde: tutti e quattro i punti della correzione di T006 sono realizzati sul
  ramo, i due `SKILL.md` dell'analista sono identici e i due `analista-cancello.js` pure.
- Il ciclo `rimanda` → stesso muro di permessi → stessa PR non si apre.
- Nessun permesso cambia. Il blocco in scrittura su `.claude/` per l'agente sviluppatore
  resta esattamente com'è: questa decisione riguarda solo come il PM legge un diff, non chi
  può scrivere cosa. La scelta di non allargare i permessi dell'agente è di Alessio
  (opzione A del verdetto precedente), e resta sua.
- Nessun requisito viene aggiunto o cambiato.
- Vale da qui in avanti per ogni PR, non solo per T006 della spec 004.
