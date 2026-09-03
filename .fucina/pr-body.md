## Cosa ho fatto

Nel passo «Azione: attendi-check» di `template/.github/workflows/pm-agent.yml`, reso
tollerante al fallimento il conteggio dei check letto dopo che `gh pr checks --watch`
esce con un codice diverso da 0 e da 124:

```diff
-CONTEGGIO=$(gh pr checks "$NUMERO" --json bucket --jq 'length')
+CONTEGGIO=$(gh pr checks "$NUMERO" --json bucket --jq 'length' 2>/dev/null || echo 0)
```

`gh pr checks --json` esce non-zero (senza stampare nulla) proprio quando la PR non ha
ancora nessun check registrato — `populateStatusChecks`, nel sorgente di `gh`,
restituisce l'errore `no checks reported on the '<branch>' branch` prima di raggiungere
l'exporter JSON — oltre che per un eventuale errore di rete transitorio. Sotto
`set -euo pipefail` quell'uscita non-zero faceva morire il passo prima di raggiungere
il tetto di `pm.attesa_check_minuti`, e l'intera esecuzione del PM falliva con il
commento «Esecuzione fallita» sul rapporto: il ramo `nessun-check` (REQ-215) non era
mai raggiungibile. Ora un fallimento vale 0 check visti in questo giro, esattamente
come fa già `raccogli-stato.sh` per la stessa chiamata (`2>/dev/null || echo '[]'`), e
il ciclo prosegue a ritentare finché non compare un check o scade il tetto.

Aggiunto solo un commento che spiega la correzione, accanto alla riga cambiata.

## Come l'ho verificato

```
$ yq '.' template/.github/workflows/pm-agent.yml
```
Esce con codice 0 (YAML valido); l'output completo è nell'ultimo aggiornamento del
commento di lavorazione su questa issue.

Per verificare che il ramo `nessun-check` sia ora raggiungibile senza poter invocare
`gh` vero (fuori dagli strumenti permessi in questa sessione), ho riprodotto in Node.js
la logica del ciclo — stessi tre esiti possibili, `gh pr checks --watch` e
`gh pr checks --json` sostituiti da mock — e forzato lo scenario del difetto: `--watch`
esce sempre 1 (nessun check ancora) **e** la lettura `--json` fallisce sempre (come
davanti a una PR senza check). Con la guardia il ciclo arriva a `nessun-check` una volta
scaduto il tetto; senza guardia la stessa chiamata lancia un'eccezione non gestita, che
è l'equivalente diretto del `set -e` che uccideva il passo. Ho verificato allo stesso
modo che gli altri due esiti (`conclusi` con `--watch` che esce 0, `tetto-superato` con
`--watch` che esce 124) restano raggiungibili e non vengono toccati dalla correzione.

```
$ node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"
# tests 150
# pass 150
# fail 0
```
Nessun test nuovo: la correzione è una riga di bash dentro un passo YAML, non una
funzione JavaScript pura esportata — non c'è logica da coprire con `node:test` che non
sia già coperta dalla suite esistente (invariata).

## Decisioni

Nulla: la correzione applica alla lettera il comando indicato dalla issue
(`2>/dev/null || echo '[]'`, adattato a `echo 0` perché qui serve un intero da
confrontare con `-gt 0`, non una lista JSON), che è già in uso nel repo per la stessa
identica chiamata. Nessuna scelta libera, nessun ADR.

## Non fatto

Nulla: la issue chiedeva una correzione di una riga (più il commento che la spiega) e
il diff tocca solo quello.

## Fatto in più

Nulla: nessun file oltre a `template/.github/workflows/pm-agent.yml` è stato toccato.

Closes #55
