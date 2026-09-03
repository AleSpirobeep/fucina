Riscrive `plugin/skills/pm-agent/SKILL.md` come ruolo a ciclo singolo, per T004 della spec `specs/003-pm-a-cicli`.

Il nuovo ruolo, invocato dal workflow con «Revisiona la PR #N» o «Rispondi alla issue #N» più il percorso `CARTELLA_FUCINA`, lavora un solo oggetto, non aspetta nulla (niente `gh run list` in loop, niente preflight `gh auth`/`gh repo view`) e non modifica niente su GitHub: il suo unico output è `CARTELLA_FUCINA/verdetto.json` secondo `contracts/verdetto.md`, più eventuali ADR in `CARTELLA_FUCINA/decisioni/`.

Conservato dal ruolo attuale: le tre regole (adattate: gli ADR li scrive in `CARTELLA_FUCINA/decisioni/`, non li committa più direttamente), l'ordine di lettura (costituzione, spec dedotta dall'identificativo `T` nel titolo → `specs/<NNN>-*/`, ADR, `CLAUDE.md`, ruolo `dev-agent`), gli otto punti di revisione, «Quando l'agente si ferma» (decisione propria solo senza impatto su requisiti/sicurezza/token/costi), «Quando ti fermi» (diventa esito `umano` con domanda chiusa), «Cosa non fai, mai».

Tolto: preflight `gh auth`/`gh repo view`, primo e secondo atto (ADR P4 e apertura issue di rapporto — atti del workflow, non del ruolo), attesa con `gh run list`, ogni comando `gh` di scrittura, ogni `git commit`/`push` diretto, il riferimento fisso alla spec 002.

Aggiornati anche il frontmatter (`description` per il nuovo modo di invocazione, `allowed-tools: Read, Glob, Grep, Write, Bash`) e aggiunta una sezione "Il verdetto" con lo schema completo e un esempio per `rimanda` e uno per `umano`.

Verificato: `node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 150/150 verdi (nessun test nuovo: il task è solo la riscrittura di un file di ruolo in markdown, senza codice testabile). Il file è 186 righe (< 250); le stringhe `gh pr merge`, `gh pr close`, `gh pr comment`, `gh pr edit`, `gh issue edit`, `gh issue comment`, `gh issue create`, `git push`, `git commit` compaiono solo nella sezione «Cosa non fai, mai».

Closes #46

## Decisioni

Nessun ADR aggiunto: la riscrittura segue la sezione «Il ruolo `pm-agent` (riscritto)» di `plan.md` e il contratto `contracts/verdetto.md` senza scelte non coperte da questi.

## Non fatto

**`.claude/skills/pm-agent/SKILL.md` non è stato aggiornato.** L'issue chiede la stessa copia identica installata in questo repo (`diff` vuoto tra i due file), ma in questa esecuzione ogni tentativo di scrivere su quel percorso — con `Write`, `Edit`, o `cp` via `Bash`, sia con path assoluto sia relativo — è stato rifiutato dal sandbox con un errore di permesso in sospeso che nessuno poteva approvare in questa sessione non interattiva. Serve un run con i permessi di scrittura estesi a `.claude/`, oppure una copia manuale di `plugin/skills/pm-agent/SKILL.md` su `.claude/skills/pm-agent/SKILL.md` prima di fondere.

## Fatto in più

Nulla: solo `plugin/skills/pm-agent/SKILL.md` è stato toccato.
