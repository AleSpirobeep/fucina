Due modifiche minime a `template/.github/workflows/dev-agent.yml` per REQ-262 (spec `003-pm-a-cicli`), preparatorie al PM automatico:

1. Nel passo "Segnala il fallimento del run": `GH_TOKEN` usa `secrets.FUCINA_PAT || secrets.GITHUB_TOKEN` come negli altri passi, e `gh issue edit` rimette `ready-for-dev` oltre a togliere `in-progress`, con un commento che spiega perché il riavvio non può girare all'infinito.
2. Nel job `implementa`: la condizione `if:` esclude le issue con label `rapporto-pm`, così l'agente sviluppatore non tenta mai di "implementare" l'issue di rapporto del PM.

Il riavvio non può girare all'infinito perché: il passo "Conta i tentativi precedenti" conta ogni tentativo *prima* di eseguire l'agente, e trasforma il riavvio in `needs-human` (togliendo `ready-for-dev`) appena i tentativi sono esauriti; il passo "Segnala il fallimento del run" gira solo `if: ... && steps.tentativi.outputs.stop == 'false'`, cioè solo quando il tentativo è già stato contato; quindi ogni riavvio consuma un tentativo del contatore, che è finito.

**Verificato con:**
- `yq '.' template/.github/workflows/dev-agent.yml` esce 0
- `node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` → 150/150 verdi
- `git diff --stat` tocca un solo file

## Decisioni

Nulla: nessun ADR necessario, le due modifiche sono già specificate letteralmente in `plan.md` (sezione «Modifiche a `dev-agent.yml`») e nell'issue.

## Non fatto

Nulla: entrambe le modifiche richieste da REQ-262/T006 sono state applicate esattamente come descritte nel piano.

## Fatto in più

Nulla: solo `template/.github/workflows/dev-agent.yml` è stato toccato, con le due modifiche richieste e i commenti che le spiegano.
