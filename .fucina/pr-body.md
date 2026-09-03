## Cosa ho fatto

La specifica del terzo ruolo della fucina — l'**analista**: da un'idea di due righe a una coda
di task `in-coda`, fermandosi a chiedere ogni volta che l'idea ha un buco, e senza far partire
niente finché la spec non regge una verifica meccanica e Alessio non conferma.

- `specs/004-analista/spec.md` — Input di Alessio, sessione di chiarimenti con le quattro
  domande poste e le risposte date, cinque scenari d'uso con priorità e verifica indipendente,
  dodici casi limite, 33 requisiti `REQ-3xx` ciascuno con la propria riga di verifica (P2),
  cinque entità, sei criteri di successo `SC-30x`, assunzioni.
- `docs/decisions/2026-09-03-2320-agente-analista.md` — l'ADR delle due decisioni di fondo:
  il ruolo è una skill locale (non un workflow che dialoga via commenti) e il cancello fra
  analisi e coda è uno script deterministico, non il giudizio del modello (P9).

Le quattro decisioni raccolte dalla sessione di chiarimenti, in breve: skill locale di Claude
Code; ambito fino alle issue `in-coda`, con l'accensione del PM che resta un gesto di Alessio
(P4); repo esistente già preparato con `init.sh`; cancello in due tempi — verifica eseguibile,
poi conferma esplicita.

## Come l'ho verificato

Lettura completa prima di scrivere: costituzione, `specs/001-dev-loop/spec.md`,
`specs/002-registro/spec.md`, `specs/003-pm-a-cicli/` (spec, piano, contratti), tutti i file
in `docs/decisions/`, `CLAUDE.md`, `init.sh`, `.fucina.yml`, i due ruoli in `plugin/skills/`.

- Numerazione: `REQ-3xx` e `SC-30x` non collidono con 001 (`REQ-0xx`), 002 (`REQ-1xx`) né 003
  (`REQ-2xx`, `SC-20x`).
- Costituzione: nessun requisito la contraddice. REQ-333 e REQ-351 preservano P4 (l'analista
  non accende il PM e non applica `ready-for-dev`); REQ-320 e REQ-324 applicano P9 (il cancello
  è deterministico); REQ-310 applica P6 (i comandi Spec Kit si invocano, non si riscrivono);
  REQ-313 applica P2; REQ-305/307/315 applicano P5; REQ-340 applica P8; REQ-341 applica P7.
- ADR esistenti: nessuno contraddetto. `2026-08-30-1000-estendere-spec-kit.md` è citato e
  la sua mitigazione ripresa; l'estensione di P4 decisa in `2026-09-03-1600-pm-a-cicli.md`
  resta intatta perché l'analista non fonde nulla.
- Suite di test invariata e verde: `node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"`
  → 150/150. Nessun file di codice toccato.

## Decisioni

Un ADR nuovo, `2026-09-03-2320-agente-analista.md`, per le due scelte che la richiesta di
Alessio non copriva esplicitamente e che le sue risposte hanno fissato: la forma del ruolo
(skill locale) e la natura del cancello (script, non giudizio del modello).

## Non fatto

- `plan.md`, `contracts/`, `tasks.md` e `checklists/requirements.md` della spec 004: sono i
  comandi successivi di Spec Kit (`/speckit-plan`, `/speckit-tasks`, `/speckit-checklist`), da
  lanciare quando la spec è considerata stabile.
- Nessuna issue creata, nessun task in coda: la spec 003 ha ancora T008 (collaudo su
  `fucina-lab` e su `fucina`) aperto, e la 004 non deve sovrapporsi.
- `CLAUDE.md` non è aggiornato: la spec attiva resta la 003 finché il suo collaudo non chiude.
- Il ruolo `plugin/skills/analista/SKILL.md` e lo script del cancello non esistono ancora:
  sono il lavoro che la spec descrive, da fare con il loop `dev-agent` + `pm-agent`.

## Fatto in più

Nulla: solo i due file nominati sopra, più questo `.fucina/pr-body.md`.
