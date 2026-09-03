# Collaudo della spec 003 — passo per passo

Da fare **dopo** che tutti i task sono fusi e Alessio ha installato i file con `init.sh`
(vedi "Installazione" in fondo). Ogni passo cita il requisito che verifica. Repo di prova:
`fucina-lab` prima, poi `fucina` stessa.

## 0. Prerequisiti

```powershell
gh auth status                                  # autenticato, scope repo + workflow
gh workflow list                                # compare pm-agent (disabilitato all'inizio)
gh label list | Select-String "in-coda|rapporto-pm"   # REQ-212, REQ-260
```

## 1. Costo zero (REQ-201, SC-201)

`.\scripts\pm.ps1 avvia` → parte un giro di recupero. A stato fermo termina senza
commenti (REQ-242). Aspettare un'ora: `gh run list --workflow pm-agent.yml` non mostra
esecuzioni nuove.

## 2. Interruttore (REQ-250, REQ-251, REQ-252, Scenario 2)

1. `.\scripts\pm.ps1 ferma`; etichettare a mano `needs-review` una PR qualsiasi: nessuna
   esecuzione parte.
2. `.\scripts\pm.ps1 stato`: "spento", conteggi, ultima esecuzione. Cercare `token`
   nell'output: assente.
3. `.\scripts\pm.ps1 avvia`: parte un'esecuzione che trova la PR.
4. Durante una revisione, `ferma`: l'esecuzione termina con la PR fusa o rimandata.

## 3. Un ciclo completo su fucina-lab (Scenario 1, REQ-210…224, REQ-240, REQ-241)

1. Creare due issue di prova con titoli `T901: …` e `T902: …` e label `in-coda`, con
   criteri di accettazione semplici (una funzione in `listino/prezzi.py` con test).
2. `pm.ps1 avvia`: `T901` diventa `ready-for-dev` (REQ-211) e il rapporto ha il commento
   "T901 avviato" (REQ-241). Nessuna chiamata al modello nel log (SC-202).
3. Il dev-agent apre la PR con `needs-review`; il PM aspetta i check (REQ-215), poi si
   rilancia in `workflow_dispatch` e chiama il modello (REQ-220).
4. Esito `fondi`: PR fusa con squash, branch cancellato, `T902` avviato (REQ-223,
   Scenario 1.3). Esito `rimanda`: PR chiusa, commento per criterio, issue `ready-for-dev`
   (REQ-224).
5. Rapporto: una riga per azione, con link (REQ-241).

## 4. Rimandi senza modello (Scenario 4, REQ-213, REQ-214)

1. Aprire a mano una PR che modifica un file sotto `tests/` senza `allow-test-changes`
   (guard rosso) ed etichettarla `needs-review`: chiusa e commentata; nel log
   dell'esecuzione manca il passo "Esegui il PM" (REQ-213).
2. Aprire a mano una PR con corpo vuoto ed etichettarla `needs-review`: rimandata con
   "manca la sezione…" (REQ-214).

## 5. Domande (REQ-230…234)

1. Simulare una domanda: commentare su una issue `in-progress` una domanda con opzioni e
   mettere `needs-human`. Il PM risponde (`rispondi`) se la risposta è nella spec, altrimenti
   lascia la domanda con marcatore (`umano`): la issue compare nel Registro con il commento
   del PM (REQ-232). Due giri di recupero non aggiungono commenti (REQ-216).
2. Rispondere dal Registro con "Rispondi e riavvia": il dev-agent riparte.
3. Tentativi esauriti: una issue impossibile (criterio contraddittorio) → dopo 3 tentativi
   `needs-human` → il PM produce `riscrivi` → due o tre issue `T9xxa/b` in coda (REQ-233).

## 6. Verdetto mancante (REQ-222)

Impostare temporaneamente `pm.max_turns: 1` in `.fucina.yml` e forzare una revisione: la PR
riceve `needs-human` con "Il PM non ha concluso". Ripristinare.

## 7. Modifiche alla spec 001 (REQ-262)

1. Issue con `ready-for-dev` e `max_turns: 2` nell'agente: il run fallisce → l'issue torna
   `ready-for-dev` da sola; dopo il terzo, `needs-human`.
2. Etichettare `ready-for-dev` l'issue di rapporto: nessun tentativo, nessun commento.

## 8. Idempotenza (REQ-203, REQ-260)

`gh workflow run pm-agent.yml` due volte di seguito a stato fermo: la seconda esecuzione
non produce commenti. `bash init.sh` due volte: la seconda stampa solo "=".

## Installazione (a cura di Alessio, dopo la fusione dei task)

```powershell
cd $HOME\Documents\Claude\Projects\fucina
git pull
bash init.sh          # copia pm-agent.yml, scripts/pm-coda.js, scripts/pm.ps1, ruolo pm-agent; crea le label
git add -A; git commit -m "Installa il PM a cicli"; git push
.\scripts\pm.ps1 avvia
```

Poi la stessa sequenza in `fucina-lab` (con `bash ..\fucina\init.sh`).
