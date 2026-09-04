Implementa T007 della spec `005-interruttore-nel-registro`: i messaggi d'errore dei
comandi del PM (403, 404, 401) e la verifica dell'isolamento fra repo già garantito
dallo stato per-repo introdotto dai task precedenti.

## Cosa ho fatto

- In `ui/lib.js`, `messaggioErroreComandoPm(status, repo)`: implementa la tabella di
  `contracts/comandi-pm.md` — 403 nomina il permesso `Actions: read and write` e dove si
  concede, 404 dice che `pm-agent.yml` non risulta installato su quel repo, 401 rimanda a
  «Configurazione», ogni altro codice ricade su `messaggioErroreHttp` esistente. Nessuno
  dei messaggi menziona il token.
- In `ui/github.js`, `richiesta()` accetta ora `opzioni.messaggioErrore` per scegliere la
  funzione di messaggio; le sette chiamate del contratto (`statoPm` L1, `ultimaEsecuzionePm`
  L2, `esecuzioniInCorsoPm` L3, `ramoDefaultRepo` L4, `fermaPm` S1, `abilitaPm` S2,
  `avviaGiroDiRecuperoPm` S3) la passano. Tutte le altre chiamate (issue, PR, commenti,
  check run, label) restano su `messaggioErroreHttp`, invariata: i suoi test esistenti in
  `ui/github.test.js` non toccano nulla di questo cambiamento.
- Verificato che `ui/index.html` isola già correttamente l'errore di un repo dagli altri
  (REQ-432): ogni ciclo di caricamento (`caricaAvanzamento`, `caricaPm`,
  `caricaAgentiAttivi`, `caricaAspettanoTe`) itera i repo con un `try/catch` per repo e
  scrive lo stato in dizionari chiavati per repo (`aggiornaStatoRepo`), introdotti dai
  task precedenti di questa spec; non serve un cambiamento nuovo lì per questo task.
- Test nuovi in `ui/errori-interruttore.test.js`: la tabella dei messaggi pura, le sette
  chiamate del contratto con 403/404/401 verso il token e senza fuga del token nel
  messaggio, il fallimento di `avviaPm` sulla fase di abilitazione con un token in sola
  lettura, e l'isolamento dello stato fra un repo inesistente e uno valido tramite
  `aggiornaStatoRepo`.
- ADR `docs/decisions/2026-09-04-2215-messaggi-errore-comandi-pm.md`: perché una funzione
  dedicata invece di modificare `messaggioErroreHttp`.

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 280 test, tutti verdi
(265 esistenti invariati + 15 nuovi). Non ho potuto verificare a mano nel browser con un
token realmente in sola lettura su Actions (serve T008, manuale, non ancora fatto): il
comportamento è coperto dai test che mockano `fetch` con status 403/404/401, come da
REQ-431.

Closes #78

## Decisioni

- `docs/decisions/2026-09-04-2215-messaggi-errore-comandi-pm.md` — messaggio d'errore dei
  comandi del PM in una funzione dedicata (`messaggioErroreComandoPm`), non in
  `messaggioErroreHttp`, per non toccare il comportamento né i test delle altre chiamate
  della pagina.

## Non fatto

- `ui/index.html` non è stato toccato, anche se era fra i "file da toccare": leggendo il
  codice ho verificato che il confinamento dell'errore alla sezione del repo (REQ-432) è
  già garantito dai task precedenti (`aggiornaStatoRepo` chiavato per repo, un `try/catch`
  per repo in ogni ciclo di caricamento). Non ho trovato un varco da chiudere lì per
  questo task, e non ho voluto toccarlo solo per "aver toccato il file elencato".
- Non ho scritto un test che scansiona il sorgente per contare le chiamate di scrittura
  (REQ-443): non ho aggiunto alcuna chiamata di scrittura nuova (solo un parametro di
  messaggio su chiamate già esistenti), quindi l'ho verificato leggendo il diff invece di
  automatizzarlo con un test fragile e non nello stile del resto della suite.
- Non ho potuto eseguire la verifica manuale in browser con un token realmente limitato
  (dipende da T008, manuale, non ancora fatto da Alessio).

## Fatto in più

- `ui/github.js`, non elencato nella issue: necessario per collegare
  `messaggioErroreComandoPm` alle sette chiamate del contratto (L1–L4, S1–S3), altrimenti
  il messaggio nuovo in `ui/lib.js` resterebbe inutilizzato.
- `docs/decisions/2026-09-04-2215-messaggi-errore-comandi-pm.md`, non elencato nella
  issue: l'ADR che la regola dell'agente sviluppatore richiede per la decisione di non
  toccare `messaggioErroreHttp`.
