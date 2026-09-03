## Cosa ho fatto

Installazione del PM (REQ-260, REQ-261), come richiesto da T007 e aggiornato dal
commento dell'issue (T002 ha introdotto `template/scripts/raccogli-stato.sh`, non
elencato nel testo originale della issue né in `tasks.md`, ma richiamato a runtime
da `pm-agent.yml`):

- `init.sh`: la funzione `copia` ora installa cinque file — oltre a
  `template/.github/workflows/pm-agent.yml` → `.github/workflows/pm-agent.yml`,
  `template/scripts/pm-coda.js` → `scripts/pm-coda.js`,
  `template/scripts/pm.ps1` → `scripts/pm.ps1` e
  `plugin/skills/pm-agent/SKILL.md` → `.claude/skills/pm-agent/SKILL.md`, anche
  `template/scripts/raccogli-stato.sh` → `scripts/raccogli-stato.sh`. `crea_label`
  crea `in-coda` (`5A6E8C`) e `rapporto-pm` (`2C6E49`). Il blocco dei passi manuali
  finali guadagna un quinto punto: scope `workflow` sul login `gh` locale (con
  `gh auth refresh -s workflow` se manca), il PM installato spento e acceso con
  `scripts/pm.ps1 avvia`, e la convenzione `in-coda` + titolo `T001: …` per le
  issue dei task.
- `template/.fucina.yml`: chiave `pm` con i default di `contracts/fucina-yml.md`
  (modello, `max_turns`, `max_budget_usd`, `attesa_check_minuti`,
  `titolo_rapporto`, `strumenti_permessi`), commentata riga per riga.
- `template/CLAUDE.md`: una sezione breve su `scripts/pm-coda.js` e
  `scripts/pm.ps1`, e sul fatto che l'issue `rapporto-pm` non va mai presa in
  carico dall'agente sviluppatore.
- `README.md`: sezione «Il PM a cicli» (22 righe) — cosa fa, come si accende e si
  spegne, dove legge la configurazione, cosa costa.

**Tentativo 2**: il paragrafo sul costo è stato riscritto dopo la revisione del
tentativo 1 (PR #64, chiusa). Il difetto: diceva che il PM costa una chiamata
anche «per ogni giro sulla coda», mentre avviare il task successivo è l'azione
deterministica `avvia-task` del workflow, a costo zero (SC-202, P9); e diceva «per
ogni PR aperta» invece di «per ogni PR **revisionata**» — una PR con check rossi o
senza le due sezioni obbligatorie è rimandata senza chiamare il modello (REQ-213,
214), e con check in corso il PM attende, sempre senza modello (REQ-215). Il nuovo
paragrafo elenca anche il costo zero a lavoro fermo (SC-201, REQ-201, REQ-242).

Closes #49

## Come l'ho verificato

`bash -n init.sh`:
```
(nessun output — exit 0)
```

`yq '.pm.max_turns' template/.fucina.yml`:
```
40
```

`yq '.pm.strumenti_permessi | length' template/.fucina.yml`:
```
13
```

Verificato esplicitamente, leggendo `template/.github/workflows/pm-agent.yml`, che
sia `scripts/pm-coda.js` (righe 179, 675, 700) sia `scripts/raccogli-stato.sh`
(righe 148, 674, 699) — gli unici due file che il workflow richiama a runtime con
`node`/`bash` — sono fra i cinque installati da `init.sh`.

Suite completa: `node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` →
150/150 verdi. Nessun test nuovo: questa issue tocca solo `init.sh` (bash,
verificato con `bash -n`), YAML e Markdown, nessuna funzione JS nuova.

Nessun token o valore di secret in nessun file toccato (solo nomi di secret già
presenti: `CLAUDE_CODE_OAUTH_TOKEN`, `FUCINA_PAT`).

Tutte le verifiche sono state rieseguite identiche per il tentativo 2, con lo
stesso esito: `bash -n init.sh` esce 0, i due `yq` stampano 40 e 13, i cinque file
sono copiati e i due richiamati a runtime sono fra questi, la suite è 150/150
verde.

## Decisioni

Nessun ADR nuovo: tutte le scelte erano già coperte dal testo della issue, dal
commento di chiarimento su `raccogli-stato.sh`, e da `contracts/fucina-yml.md`.

## Non fatto

Nulla dei criteri della issue (aggiornati dal commento). `template/.github/workflows/
dev-agent.yml` (REQ-262, task T006) non è toccato: non è nell'ambito di questa
issue ed è già stato applicato in precedenza.

## Fatto in più

Nulla: solo i file nominati dalla issue (`init.sh`, `template/.fucina.yml`,
`template/CLAUDE.md`, `README.md`).
