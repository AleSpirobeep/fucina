---
status: accepted
date: 2026-09-03
decision-makers: [Alessio]
---
# Il terzo ruolo è l'analista: gira in locale, e un cancello meccanico separa l'analisi dalla coda

## Contesto e problema
La fucina ha due ruoli — `dev-agent` scrive il codice da una issue, `pm-agent` giudica la PR e
la fonde — e un buco a monte: trasformare un'idea in specifica, piano, task e issue è ancora
lavoro manuale di Alessio, con i comandi di Spec Kit lanciati uno per uno. Serve un ruolo che
lo faccia, che si fermi a chiedere quando l'idea ha buchi invece di riempirli, e che non lasci
partire la fucina finché la specifica non è matura.

## Opzioni considerate
1. **Skill locale di Claude Code**, invocata dal PC nel repo: la conversazione è immediata,
   costa zero quando non la si usa, e lo stato vive nei file del repo.
2. **Workflow GitHub Actions che dialoga via commenti su una issue**: utilizzabile dal
   telefono e con la traccia interamente su GitHub, ma paga un run e un turno di modello per
   ogni domanda, e un'analisi di venti domande diventa venti giri lenti.
3. **Nessun ruolo nuovo**: continuare con i comandi Spec Kit a mano, aggiungendo al più una
   checklist. Non risolve la parte che Alessio chiede — l'agente che *si ferma e chiede*.

Sul cancello, due opzioni: (a) è il modello a giudicare quando la spec è pronta; (b) è uno
script deterministico, e il modello non può aggirarlo.

## Decisione
Opzione 1 per il ruolo, opzione (b) per il cancello.

L'analista è una skill locale (`plugin/skills/analista/SKILL.md`, installata da `init.sh` come
gli altri due ruoli). Orchestra i comandi di Spec Kit già presenti invece di riscriverli (P6),
scrive i documenti in `specs/<NNN>-*/` e li porta su `main` con una PR (P1). Fa domande chiuse
con opzioni, al più cinque per giro, e scrive ogni coppia domanda/risposta nella sezione
«Chiarimenti» della spec; ciò che non sa e non gli viene detto resta un punto aperto marcato,
mai un requisito inventato (P5).

Fra l'analisi e la coda c'è una verifica eseguibile e testata, indipendente dal modello (P9):
punti aperti, requisiti senza verifica (P2), task senza criteri o senza rimando a un requisito,
requisiti che nessun task copre, `test_command` vuoto, task su percorsi che l'agente
sviluppatore non può scrivere. Finché non è verde, nessuna issue viene creata. Verde non basta:
serve anche la conferma esplicita di Alessio sul riepilogo.

L'analista **non accende il PM**: la consegna termina stampando `scripts/pm.ps1 avvia`. P4
resta intatto — l'atto umano che fa partire il lavoro è di Alessio.

L'ambito è un repo esistente e già preparato con `init.sh`. Creare repository, secret e
protezioni del branch resta fuori: sono i passi che `init.sh` lascia esplicitamente ad Alessio.

## Conseguenze
Buone: il ciclo idea → codice si chiude dentro la fucina, con tre ruoli distinti e nessuno che
giudica il proprio lavoro (P3); l'analisi costa zero quando non è in corso; il cancello rende
verificabile una qualità — «la spec è pronta» — che finora era un'impressione.

Cattive: il ruolo si usa solo davanti al PC (niente telefono); un analista che dialoga via
issue resta possibile come spec successiva. Il cancello può essere severo su spec piccole:
il rimedio è dichiarare esplicitamente i punti rinviati, non allentarlo.

Rischio: l'ordine di invocazione dei comandi Spec Kit dipende da un progetto pre-1.0. È lo
stesso rischio già registrato in `2026-08-30-1000-estendere-spec-kit.md`, con la stessa
mitigazione (pinnare la versione di `specify-cli`).
