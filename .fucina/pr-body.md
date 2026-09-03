Riscrive `plugin/skills/pm-agent/SKILL.md` per il ruolo `pm-agent` a ciclo singolo
(spec `specs/003-pm-a-cicli`, T004): invocato dal workflow con «Revisiona la PR #N» o
«Rispondi alla issue #N» più `CARTELLA_FUCINA`, lavora un solo oggetto per
invocazione, non aspetta nulla, non modifica niente su GitHub. Il suo unico output è
`CARTELLA_FUCINA/verdetto.json` secondo `contracts/verdetto.md`, più eventuali ADR in
`CARTELLA_FUCINA/decisioni/`.

## Cosa ho fatto

Ripreso il contenuto già scritto e validato nei tentativi precedenti (PR #59 e #60,
entrambe chiuse per motivi diversi dal contenuto del ruolo — corpo della PR sbagliato
o criterio di copia non ancora emendato), riproposto identico:

- **Conservato**: le tre regole (l'ADR ora si scrive in `CARTELLA_FUCINA/decisioni/`,
  con `status: accepted` oltre a `decision-makers: [pm-agent]`, non più committato
  direttamente), l'ordine di lettura (costituzione → spec dedotta dall'identificativo
  `T` nel titolo → `specs/<NNN>-*/` → ADR → `CLAUDE.md` → ruolo `dev-agent`), gli otto
  punti di revisione, «Quando l'agente si ferma» e «Quando ti fermi» (esito `umano`
  con domanda chiusa), «Cosa non fai, mai».
- **Tolto**: preflight `gh auth`/`gh repo view`, primo e secondo atto, attesa con
  `gh run list`, ogni `gh` di scrittura, ogni `git commit`/`push` diretto, il
  riferimento fisso alla spec 002.
- **Aggiunto**: frontmatter aggiornato (`description` per la nuova invocazione,
  `allowed-tools: Read, Glob, Grep, Write, Bash`) e una sezione «Il verdetto» con lo
  schema completo e un esempio per `rimanda` e uno per `umano`.

## Come l'ho verificato

- `grep` sulle otto stringhe di mutazione (`gh pr merge`, `gh pr close`,
  `gh pr comment`, `gh pr edit`, `gh issue edit`, `gh issue comment`,
  `gh issue create`, `git push`, `git commit`): compaiono solo alle righe 180-181,
  dentro «Cosa non fai, mai».
- `wc -l`: 187 righe, sotto le 250 richieste.
- Test: `node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — verdi.

## Non fatto

**`.claude/skills/pm-agent/SKILL.md` non è stato aggiornato.** Come da criterio
emendato dal PM il 2026-09-03, ho provato **una volta sola** con `Read` sul file appena
scritto e `Write` sul secondo percorso, senza `cp`/`diff`/`ls`/`cat` e senza
aggiramenti. Il tentativo è stato rifiutato con questo messaggio, verbatim:

```
Claude requested permissions to write to /home/runner/work/fucina/fucina/.claude/skills/pm-agent/SKILL.md, but you haven't granted it yet.
```

Strumento: `Write`. Percorso:
`/home/runner/work/fucina/fucina/.claude/skills/pm-agent/SKILL.md`. Per criterio
emendato, questo non blocca l'accettazione: la copia resta assegnata a T007
(`init.sh`).

## Fatto in più

Nessuno. Ho toccato solo `plugin/skills/pm-agent/SKILL.md` e questo file.
