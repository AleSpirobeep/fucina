Crea `template/scripts/pm-coda.js` (T001, spec 003): decide cosa deve fare il PM a ogni
ciclo, secondo `specs/003-pm-a-cicli/contracts/pm-coda.md` e la forma dati di
`data-model.md` (§1 input, §2 output). Nessuna dipendenza, CommonJS.

## Cosa ho fatto

- `template/scripts/pm-coda.js` esporta `decidi(stato)`, `estraiSezioniMancanti(corpo)`,
  `identificativoTask(titolo)`. Applica le regole 1a–1d (PR `needs-review` senza
  `needs-human` e non ancora vista: check rosso → `rimanda-check-rossi`, check in corso →
  `attendi-check`, sezioni mancanti → `rimanda-corpo-incompleto`, altrimenti `revisione`),
  2 (issue `needs-human` non ancora vista → `domanda`), 3 (nessuna PR/issue attiva e almeno
  un task `in-coda` con identificativo valido → `avvia-task` con l'identificativo più basso,
  ordinato numero poi suffisso: `T004` < `T004a` < `T004b` < `T005`), 4 (`niente`).
  `estraiSezioniMancanti` reimplementa (non importa da `ui/lib.js`, che nel repo di
  destinazione non esiste) il riconoscimento di `## Non fatto` / `## Fatto in più`,
  insensibile a maiuscole, `###` e spazi. `identificativoTask` accetta `T` seguita da
  almeno tre cifre e al più una lettera minuscola come parola intera (`ST001` non è
  valido).
- CLI: eseguito da riga di comando (`node scripts/pm-coda.js < stato.json`) legge lo stato
  da stdin e stampa la decisione in JSON su stdout con exit 0; input non JSON o senza le
  chiavi `pr`/`issue` → messaggio su stderr, exit 2. Eseguito come modulo (`require`) non
  registra alcun listener su stdin.
- `template/scripts/pm-coda.test.js` (`node:test`/`node:assert`, 37 test): una per ogni
  regola del contratto, le 12 fixture della tabella con la decisione attesa, l'ordine di
  priorità (PR verde batte issue `needs-human` batte task in coda), l'ordine dei task in
  coda con i suffissi, `ST001` non valido, la nota su issue `in-coda` con un'altra label di
  stato (non parte), la nota su PR `needs-review`+`needs-human` (blocca la coda),
  `estraiSezioniMancanti` sui corpi delle PR #6 e #9 di fucina-lab (entrambe complete) e sul
  corpo minimo del workflow (entrambe mancanti), e il comportamento della CLI (stdin/stdout,
  errori, nessuna lettura di stdin come modulo).
- `template/scripts/fixtures/`: le 12 fixture JSON della tabella del contratto, più le
  copie letterali di `ui/fixtures/pr-body-6.md` e `pr-body-9.md` (già coperte da
  `.gitattributes` come `-text`, nessuna conversione CRLF).

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` → 150/150 verdi (150 = 113
esistenti in `ui/` + 37 nuovi in `template/scripts/`), nessun test esistente modificato.
Nessun file `.github/workflows/**` toccato: solo `template/scripts/`.

## Non fatto

Il workflow che chiama questo script (`template/.github/workflows/pm-agent.yml`, T002) e
tutto ciò che segue (T003–T008): fuori dal perimetro di questa issue, che copre solo la
parte decisionale (REQ-210–216).

## Fatto in più

Nulla oltre a quanto richiesto dal contratto e dai criteri di accettazione.
