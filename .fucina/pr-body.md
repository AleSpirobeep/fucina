## Cosa ho fatto

Il comando «Avvia» del contratto (`contracts/comandi-pm.md`, L4 poi S2 poi S3): dalla riga del PM
che T003 già mostra, un click chiede conferma nominando il repo, e solo confermando abilita
`pm-agent.yml` e lancia subito dopo il giro di recupero sul ramo di default letto da GitHub, mai
una costante (ADR `2026-09-04-1900-ramo-del-giro-di-recupero.md`).

- `ui/lib.js`: `urlRepoInfo(repo)` (L4, `GET /repos/REPO`), `urlAbilitaPm(repo)` (S2,
  `PUT .../enable`), `urlGiroDiRecuperoPm(repo)` (S3, `POST .../dispatches`);
  `messaggioConfermaAvvia(repo)`, nella stessa forma nativa di `messaggioConfermaRisposta`
  (ADR `2026-09-03-1425`), che nomina il repo e dice che il giro di recupero chiama il modello;
  `esitoAvvia(abilitazioneRiuscita, giroDiRecuperoRiuscito)`, la funzione pura che riduce i tre
  esiti del contratto a `riuscito`, `solo-abilitato`, `non-abilitato`; e tre fasi nuove
  (`FASE_RAMO_DEFAULT`, `FASE_ABILITAZIONE`, `FASE_GIRO_DI_RECUPERO`) aggiunte al dizionario già
  usato da `messaggioErroreFase` per «Rispondi e riavvia», così il messaggio nomina sempre quale
  delle chiamate ha fallito con lo stesso meccanismo già in uso.
- `ui/github.js`: `ramoDefaultRepo`, `abilitaPm`, `avviaGiroDiRecuperoPm` (le tre chiamate sottili)
  e `avviaPm(token, repo)`, che le compone in ordine fisso L4 → S2 → S3. Un fallimento di L4 o di
  S2 solleva `ErroreFase` e ferma tutto prima di abilitare qualunque cosa (non viene tentata né
  l'abilitazione né il giro); un fallimento di S3 **non** solleva un'eccezione — l'abilitazione è
  già avvenuta e il PM resta acceso — ma torna nel risultato (`{ esito: "solo-abilitato", errore
  }`), riusando `esitoAvvia` e `messaggioErroreFase(FASE_GIRO_DI_RECUPERO, ...)`.
- `ui/index.html`: `gestisciAvviaPm(repo, pulsante)` collegato al pulsante «Avvia» in
  `costruisciRigaPm` (quello di «Ferma» esisteva già da T004). Chiede conferma con
  `window.confirm(messaggioConfermaAvvia(repo))` **prima** di disabilitare il pulsante o toccare
  la rete — annullare non fa partire nulla. Confermato, disabilita il pulsante, chiama `avviaPm` e:
  a `riuscito` o `solo-abilitato` salva l'esito in `statoEsitoAvvioPm` e richiama `caricaPm()`
  (lo stato si aggiorna subito, senza attendere il ciclo dei sessanta secondi); su `ErroreFase` o
  `ErroreGitHub` marca la sezione del repo come non aggiornata con `aggiornaStatoRepo`, come già fa
  `gestisciFermaPm`. Il messaggio di un `solo-abilitato` compare accanto alla riga del PM.

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 252 test, tutti verdi (18 nuovi
in `ui/avvia-pm.test.js`, nessuna fixture nuova: i corpi delle risposte usati bastano inline).
Copro: le tre URL di L4/S2/S3; il testo della conferma (nomina il repo, dice che il giro chiama il
modello); i tre esiti di `esitoAvvia` in ogni combinazione; i tre messaggi di
`messaggioErroreFase` per le fasi nuove; le tre chiamate sottili una per una; e `avviaPm` con
`fetch` finti che registrano `url`/`method`/`body` di ogni chiamata — l'ordine L4→S2→S3 con il
`ref` del dispatch uguale al ramo letto (non una costante), L4 che fallisce e non abilita nulla,
S2 che fallisce e non tenta S3, S3 che fallisce e torna `solo-abilitato` senza rigettare, e il
token mancante che non tocca `fetch`. Sintassi di `index.html` verificata con `node --check` dopo
averne estratto lo script. Verifica manuale sul codice per il resto (nessun token con
`Actions: read and write` disponibile per una prova end-to-end contro GitHub vero — T008, manuale
di Alessio, non è ancora fatto): il pulsante si disabilita solo dopo la conferma, quindi due click
rapidi dopo aver confermato non producono due richieste; tutte le chiamate passano da
`richiesta()` verso `API_BASE` (`https://api.github.com`).

## Decisioni

Nessun ADR: il contratto e il piano coprivano già le tre chiamate, il loro ordine fisso, i tre
esiti e la forma della conferma (ADR `2026-09-03-1425`) e la scelta del ramo (ADR
`2026-09-04-1900`). Le sole scelte lasciate aperte — il testo esatto della conferma e delle tre
descrizioni di fase — sono testo dell'interfaccia senza alternative in gioco, della stessa natura
di quelle già scelte senza ADR nei task precedenti (`testoStatoPm`, `testoEsecuzioniInCorsoPm`).
Ho riusato il meccanismo di `ErroreFase`/`messaggioErroreFase` già introdotto per «Rispondi e
riavvia» invece di inventarne uno nuovo per «Avvia»: stesso bisogno (dire quale delle chiamate in
sequenza ha fallito), stessa soluzione.

## Non fatto

L'avviso "lavoro in attesa" di REQ-420/421 è T006, non di questo task. I messaggi d'errore
specifici del contratto (403 che nomina `Actions: read and write`, 404 che dice che il workflow
non è installato, 401 che rimanda a «Configurazione») sono T007: qui un fallimento di L4/S2 mostra
il messaggio di fase con il testo generico già prodotto da `messaggioErroreHttp`/`ErroreGitHub`.
Non ho potuto verificare contro l'API vera di GitHub in scrittura: serve il token con
`Actions: read and write` di T008, ancora da fare a mano da Alessio; la verifica sopra è sulla
suite automatica e sulla lettura del codice.

## Fatto in più

Nulla: solo i file elencati dalla issue.

Closes #76
