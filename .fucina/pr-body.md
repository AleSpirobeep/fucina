## Cosa ho fatto

L'avviso "lavoro in attesa" del contratto (`contracts/comandi-pm.md`, ultima sezione) e di
REQ-420/421: quando il PM di un repo è spento e c'è lavoro che nessuno sta guardando, la riga del
PM che T003 già mostra include un avviso che nomina quel lavoro per tipo.

- `ui/lib.js`: `lavoroInAttesa(issues, prs)`, la funzione pura del contratto — filtra dai dati che
  `caricaAvanzamento` scarica già per la tabella di REQ-120 (spec 002), nessuna chiamata nuova:
  `prDaRevisionare` (PR aperte con `needs-review`), `domande` (issue aperte con `needs-human`
  escluse quelle con `rapporto-pm`) e `inCoda` (issue aperte con `in-coda`), più `totale`. E
  `avvisoPmSpento(stato, lavoro)`, che riduce le due condizioni di REQ-420/421 a un solo punto:
  torna l'oggetto del lavoro solo con `stato === "spento"` e `totale > 0`, altrimenti `null` — con
  `"acceso"` o `"non-installato"` non compare mai, qualunque sia il lavoro in attesa.
- `ui/index.html`: `caricaAvanzamento` calcola `lavoroInAttesa(issueAperteRepo, prRepo)` insieme
  alla classificazione già esistente e lo salva nello stesso stato di sezione (`statoAvanzamentoRepo`),
  senza nessuna richiesta in più. `costruisciRigaPm` riceve il nuovo `lavoro` e, quando
  `avvisoPmSpento` non torna `null`, aggiunge accanto all'interruttore un blocco con lo stesso stile
  ambra già usato da «Aspettano te», con un gruppo per tipo (PR da revisionare, Domande, Task in
  coda) che nomina ogni elemento con link e titolo — non solo il conteggio.

## Come l'ho verificato

`node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` — 265 test, tutti verdi (14 nuovi
in `ui/avviso-pm-spento.test.js`, nessuna fixture nuova: gli oggetti issue/PR inline bastano, come
in `classifica.test.js`). Copro: `lavoroInAttesa` con lavoro vuoto, una PR `needs-review` nominata
nel risultato, una PR chiusa che non conta, una issue `needs-human` che finisce in `domande`, una
issue con sia `needs-human` sia `rapporto-pm` che non viene contata, una issue `in-coda` aperta e
una chiusa, una PR mischiata nell'elenco issue che non conta, e il totale che somma le tre
categorie; `avvisoPmSpento` con PM spento e lavoro (avviso presente e nomina la PR), PM acceso con
tre PR in attesa (nessun avviso), PM spento senza nulla in attesa (nessun avviso) e
`non-installato` (nessun avviso). Sintassi di `index.html` verificata con `node --check` dopo averne
estratto lo script. Verifica manuale sul codice per il resto: T008 (allargare il token del Registro
a `Actions: read and write`) è manuale di Alessio e non ancora fatto, quindi non ho potuto aprire la
pagina contro un repo vero con PM spento e lavoro accumulato.

## Decisioni

Nessun ADR: il contratto fissava già la firma di `lavoroInAttesa` e la condizione di
`avvisoPmSpento` (spento e totale > 0). L'unica scelta lasciata aperta — come raggruppare e
presentare il conteggio per tipo nell'avviso — è testo e struttura dell'interfaccia senza
alternative in gioco, della stessa natura di quelle già scelte senza ADR nei task precedenti
(`testoStatoPm`, `testoEsecuzioniInCorsoPm`): ho riusato lo stile ambra già presente in
`#aspettanoTe` invece di introdurne uno nuovo.

## Non fatto

I messaggi d'errore specifici del contratto (403 che nomina `Actions: read and write`, 404 che
dice che il workflow non è installato, 401 che rimanda a «Configurazione») sono T007, non di questo
task. Non ho potuto verificare l'avviso contro l'API vera di GitHub con un token che ha
`Actions: read and write`: serve T008, ancora da fare a mano da Alessio; la verifica sopra è sulla
suite automatica e sulla lettura del codice.

## Fatto in più

Nulla: solo i file elencati dalla issue.

Closes #77
