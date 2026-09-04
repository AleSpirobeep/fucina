# Piano — 005 L'interruttore nel Registro

**Spec**: `specs/005-interruttore-nel-registro/spec.md` · **Creato**: 4 settembre 2026

## Sommario

Il Registro (spec 002) è una pagina statica: `ui/index.html` per il rendering, `ui/lib.js`
per la logica pura e testata, `ui/github.js` per le chiamate all'API. Questa spec aggiunge,
nella sezione che il Registro già costruisce per ogni repo (`costruisciSezioneRepo`), una
riga «PM» con lo stato, un solo pulsante e, quando serve, un avviso — più le tre chiamate di
scrittura che l'interruttore richiede. Non introduce moduli nuovi oltre ai file di test e alle
fixture che ogni task porta con sé, non tocca `pm.ps1`, non tocca i workflow.

## Contesto tecnico

- **Linguaggio**: JavaScript come moduli ES, senza passo di build e senza dipendenze
  (REQ-440, REQ-140 della 002).
- **Test**: `node:test` e `node:assert`, con il comando in `.fucina.yml`. Un file
  `ui/<argomento>.test.js` **nuovo** per ogni task: i file di test esistenti sono percorsi
  protetti e non si modificano; il guard lascia passare le aggiunte.
- **Fixture**: file in `ui/fixtures/`, mai lette dalla rete dentro un test.
- **Autenticazione**: il token già in `localStorage`, con `Actions: read and write` aggiunto
  da Alessio. Nessun token nel repo, nessuno nei log.
- **Lingua**: italiano nell'interfaccia e nei messaggi d'errore.

## Fase 0 — Le scelte prese scrivendo il piano

Tre scelte di forma, non coperte dalla spec perché non ne cambiano i requisiti. Restano qui,
dove le vede chi legge il piano, invece che in un ADR.

1. **`in-coda` e il lavoro in attesa si calcolano dai dati già scaricati.** Il Registro
   scarica già le issue aperte e le PR aperte di ogni repo (`caricaAvanzamento`). Il conteggio
   `in-coda` di REQ-402 e il lavoro in attesa di REQ-420 sono funzioni pure di quei dati:
   nessuna chiamata nuova. Le sole chiamate aggiunte in lettura sono due per repo — lo stato
   del workflow e l'ultima esecuzione — e questo tiene il costo di rate limit vicino a quello
   di oggi.

2. **Lo stato del PM è una sezione a sé nello stato della pagina.** Il Registro tiene già
   `statoAvanzamentoRepo` con `aggiornaStatoRepo`, che sa registrare per ogni repo un
   successo, un errore e un dato «non aggiornato». Lo stato del PM riusa quella struttura
   invece di inventarne una: è ciò che rende gratuito REQ-403 (dire che non è aggiornato
   invece di mentire) e REQ-432 (l'errore di un repo non tocca gli altri).

3. **Il ramo del giro di recupero si legge da GitHub, non si fissa a `main`.** L'API dei
   dispatch esige un `ref` e non ne ha uno di default. La scelta, le alternative e le
   conseguenze stanno in `docs/decisions/2026-09-04-1900-ramo-del-giro-di-recupero.md`:
   è l'unica decisione di questa analisi che ha meritato un ADR.

4. **La conferma di «Avvia» usa la stessa forma nativa di «Rispondi e riavvia».** L'ADR
   `2026-09-03-1425-conferma-nativa-rispondi-e-riavvia.md` ha già deciso come si chiede
   conferma in questa pagina: REQ-413 la riusa invece di introdurre una seconda forma.

## Struttura

### Documenti di questa spec

```
specs/005-interruttore-nel-registro/
├── spec.md
├── plan.md
├── contracts/
│   └── comandi-pm.md
├── tasks.md
└── checklists/
    └── requirements.md
```

### Codice toccato

```
ui/
├── lib.js          # funzioni pure nuove: URL, interpretazione, testi
├── github.js       # tre chiamate di scrittura e due di lettura
├── index.html      # la riga PM nella sezione del repo, il pulsante, l'avviso
├── fixtures/       # risposte dell'API usate dai test
└── <argomento>.test.js   # un file nuovo per task
```

Nessun altro percorso. In particolare: non `scripts/pm.ps1`, non `template/`, non
`.github/workflows/`, non `specs/` di altre spec.

## Verifica costituzionale

- **P1** — spec, piano e task in git, in markdown; entrano su `main` da una PR.
- **P2** — ogni REQ ha la sua riga `*Verifica:*`; ogni task ha i suoi criteri.
- **P3** — la CI è l'arbitro: la suite di `.fucina.yml` copre ogni funzione pura nuova.
- **P4** — la fusione resta del PM o di Alessio; l'analista non fa partire niente.
- **P5** — le tre scelte della Fase 0 sono dichiarate qui; nessuna decisione tocca sicurezza,
  token, permessi o costi, che restano di Alessio (l'allargamento del token è suo, ed è un
  task manuale).
- **P6** — nessun componente nuovo: si usano l'API di GitHub e le funzioni già presenti nella
  pagina.
- **P7** — nessun tetto nuovo da configurare: il Registro non chiama il modello (SC-405).
- **P8** — nulla da installare: `init.sh` non cambia.
- **P9** — l'interruttore è deterministico: nessun giudizio, nessun modello.

## Ordine dei task e perché

I task 001–003 costruiscono ciò che **si legge**: senza vedere lo stato, un pulsante è un
salto nel buio. I task 004–005 aggiungono i due comandi, prima quello che non consuma e non
chiede conferma. Il 006 aggiunge l'avviso, che ha senso solo quando spegnere è possibile. Il
007 chiude sugli errori e sui vincoli. Il 008 è di Alessio e va fatto **prima** che 004–007
si possano provare davvero: senza il permesso sul token, i comandi restano un 403 leggibile.

## Rischi

- **Il permesso arriva tardi.** Finché il token non ha `Actions: read and write`, i task
  004–007 sono verificabili solo nel loro comportamento d'errore (REQ-431). È accettato: il
  messaggio d'errore è esso stesso un requisito.
- **Il rifacimento grafico (spec 006) sposterà questi elementi.** Accettato: la 006 troverà
  requisiti già soddisfatti e funzioni pure già testate, e dovrà solo ricollocarli.
