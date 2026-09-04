# Piano di implementazione: L'analista

**Cartella**: `specs/004-analista` | **Data**: 2026-09-03 | **Spec**: [spec.md](spec.md)

**Input**: la specifica in `specs/004-analista/spec.md`; la costituzione; l'ADR
`docs/decisions/2026-09-03-2320-agente-analista.md`; i due ruoli esistenti in
`plugin/skills/`, di cui questo piano riusa forma e vincoli.

## Sintesi

L'analista è il terzo ruolo della fucina e il primo del ciclo: idea → `specs/<NNN>-*/` →
issue `in-coda`. Si compone di due pezzi soltanto, e questo è il punto del piano:

- un **ruolo** in prosa, `plugin/skills/analista/SKILL.md`, che gira in una sessione locale
  di Claude Code. È lui a fare le domande, a orchestrare i comandi di Spec Kit già
  installati, a scrivere i documenti e ad aprire la PR della spec;
- un **cancello** deterministico, `template/scripts/analista-cancello.js`, funzione pura più
  riga di comando, che dice se una cartella di spec è consegnabile. Il ruolo lo esegue e non
  lo giudica.

Tutto ciò che si può decidere da fatti osservabili sta nel cancello (P9); al modello restano
le domande e la scrittura. Ciò che i comandi di Spec Kit già fanno non viene riscritto (P6):
il ruolo li invoca in ordine e aggiunge solo i controlli che la fucina richiede.

## Contesto tecnico

**Linguaggio/versione**: JavaScript su Node ≥ 20 (preinstallato sui runner e presente sul PC),
senza dipendenze, per il cancello; Markdown per il ruolo; bash per `init.sh`.

**Dipendenze principali**: i comandi di Spec Kit installati in `.claude/skills/speckit-*`;
`gh` CLI per la PR della spec e le issue della consegna; nessuna libreria di terze parti.

**Stato**: nessuno fuori dal repo (P1). Un'analisi interrotta si riprende leggendo i file
già scritti: non esiste un file di sessione, una cache, o una memoria dell'analista.

**Test**: `node --test` su `template/scripts/analista-cancello.test.js`, con fixture in
`template/scripts/fixtures/`. Un caso verde e un caso negativo per ciascun problema
bloccante di REQ-321, più i test delle funzioni pure e i quattro codici di uscita.

**Piattaforma**: PC di Alessio (Windows, sessione Claude Code). Il cancello non dipende dal
sistema operativo: legge file e stampa righe.

**Tipo di progetto**: un ruolo e uno script dentro il toolkit `template/` + `plugin/` della
fucina, installati da `init.sh` nel repo di destinazione.

**Obiettivi di costo**: zero quando l'analista non è invocato (non è un workflow, non c'è
niente in ascolto). Il costo di un'analisi è proporzionale ai giri di domande: `max_turns`,
`max_budget_usd` e `max_domande_per_giro` in `.fucina.yml`, chiave `analista` (P7).

**Vincoli**: il ruolo non scrive codice e non tocca file fuori da `specs/`,
`docs/decisions/`, `.fucina/` (REQ-350); non ha strumenti per accendere workflow, applicare
`ready-for-dev`, fondere o chiudere (REQ-351); il cancello non chiama il modello.

**Scala**: una spec alla volta, poche decine di requisiti e di task per spec.

## Verifica della costituzione

*Cancello: da superare prima della fase 0 e di nuovo dopo la fase 1.*

- **P1** — I documenti stanno in git e arrivano su `main` da una PR (REQ-316). Nessuno stato
  altrove: un'analisi si riprende dai file. ✔
- **P2** — Il cancello rifiuta ogni requisito senza riga di verifica (REQ-313, 321), e ogni
  requisito di questa spec ne ha una. ✔
- **P3** — L'analista non giudica il proprio lavoro: la verifica di consegnabilità è uno
  script che non ha scritto lui, e i suoi documenti passano dalla revisione umana della PR. ✔
- **P4** — L'analista non accende la fucina (REQ-333). L'atto umano resta intatto: fondere
  la PR della spec e dare `scripts/pm.ps1 avvia`. ✔
- **P5** — Le domande e le risposte finiscono in «Chiarimenti» (REQ-304); le decisioni prese
  dall'analista in un ADR con `decision-makers: [analista]` (REQ-315); ciò che non gli spetta
  lo chiede (REQ-307). ✔
- **P6** — Spec Kit non viene riscritto: il ruolo invoca `speckit-specify`, `clarify`, `plan`,
  `tasks`, `checklist`, `analyze` (REQ-310). Il cancello aggiunge solo ciò che Spec Kit non
  sa: le convenzioni della fucina. ✔
- **P7** — Tetti espliciti in `.fucina.yml`, chiave `analista` (REQ-341). ✔
- **P8** — `init.sh` copia i due file con la funzione `copia` esistente, che non sovrascrive
  (REQ-340). ✔
- **P9** — La consegnabilità è un fatto osservabile e la decide lo script, non il modello
  (REQ-320, 322). ✔

Nessuna deroga richiesta.

## Struttura

    plugin/skills/analista/SKILL.md          il ruolo (prosa)
    template/scripts/analista-cancello.js    il cancello: funzione pura + riga di comando
    template/scripts/analista-cancello.test.js   i suoi test
    template/scripts/fixtures/analista-*     le fixture: una spec sana da cui derivano i casi
    template/.fucina.yml                     chiave analista con i default
    init.sh                                  copia i due file, aggiorna i passi manuali

Nel repo di destinazione, dopo `init.sh`: `.claude/skills/analista/SKILL.md` e
`scripts/analista-cancello.js`. Nel repo della fucina stessa il sorgente resta
`template/scripts/analista-cancello.js`, come per `pm-coda.js`.

## Fase 0 — Decisioni già prese

Sono nell'ADR `2026-09-03-2320-agente-analista.md` e nella sessione di chiarimenti in
`spec.md`: skill locale invece di workflow a commenti; cancello deterministico invece del
giudizio del modello; ambito fino alle issue `in-coda`; repo esistente già preparato.

Restano fissate qui due scelte minori, di forma:

1. **Il cancello legge documenti, non il disco.** `verifica()` prende una mappa nome → testo
   e una configurazione già letta; l'accesso al filesystem sta tutto in `leggiCartella()` e
   nella riga di comando. È ciò che rende i casi negativi di REQ-321 testabili con una
   fixture sana e un solo difetto per volta.
2. **La lettura di `.fucina.yml` è mirata.** Solo `test_command` e `percorsi_protetti`, con
   una funzione pura testata. Un parser YAML sarebbe una dipendenza, e CLAUDE.md non ne
   ammette.

## Fase 1 — Ordine di costruzione

1. Il cancello, con i suoi test: è ciò che il ruolo esegue, e va prima di chi lo usa.
2. Il ruolo, che quel comando lo nomina.
3. L'installazione e la configurazione, che copiano ciò che esiste.
4. Il collaudo su un'idea vera, a cura di Alessio.

## Rischi

- **Il cancello troppo severo.** Una spec piccola potrebbe non superarlo per un requisito
  che non serve. Il rimedio è dichiarare il punto come rinviato, non allentare il cancello:
  un cancello che si aggira non è un cancello.
- **Il ruolo troppo lungo.** Un SKILL.md che nessuno rilegge diventa decorativo. Tetto: sta
  in meno di 250 righe, come `pm-agent`.
- **I comandi di Spec Kit cambiano a monte.** Rischio già registrato in
  `2026-08-30-1000-estendere-spec-kit.md`; cambia l'ordine nel ruolo, non i documenti.
