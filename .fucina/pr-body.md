Implementa T8 — la sezione "Agenti attivi" del Registro (REQ-121).

- `ui/lib.js`: due nuove funzioni pure.
  - `agentiAttivi(runs)` filtra le run del workflow `dev-agent` (già lette da
    `runWorkflow`, T5) a quelle in stato `in_progress` o `queued`, e le riduce a
    `{ titolo, url, avviatoA }` — titolo preso dal titolo del run (`display_title`,
    che GitHub imposta al titolo della issue per un workflow innescato da
    `issues: labeled`), url del run, e istante di avvio.
  - `formattaTempoTrascorso(avviatoA, adesso)` formatta la differenza in una stringa
    leggibile: "meno di 1 min", "N min", "N h" o "N h M min". Non scende mai sotto
    zero, per tollerare piccoli sfasamenti fra l'orologio del client e quello di
    GitHub.
- `ui/index.html`: nuova sezione "Agenti attivi" nella dashboard, una sottosezione
  per repo (stesso pattern di "Avanzamento"): elenco di link al run col tempo
  trascorso, o "Nessun agente al lavoro" se il repo non ha run attive. Si carica
  insieme all'avanzamento all'apertura della dashboard, con lo stesso trattamento
  degli errori (token scaduto, repo non raggiungibile) già usato altrove.
- `ui/agenti-attivi.test.js`: dodici test nuovi per le due funzioni pure, inclusi i
  casi limite (elenco vuoto, run non ancora avviata secondo l'orologio locale,
  soglia esatta dell'ora).

Verificato con `node --test "ui/**/*.test.js"`: 70 test, tutti verdi.

## Decisioni

Nessun ADR aggiunto. Non è stata necessaria una chiamata separata alle issue per
ricavare il numero: il titolo del run già coincide col titolo della issue che lo ha
innescato (comportamento di default di GitHub per un workflow legato a un evento
`issues`), quindi mostro quel titolo così com'è, come richiesto dalla issue
("dal titolo del run").

## Non fatto

Il collaudo dal vivo del criterio "avviando un run su fucina-lab compare entro un
aggiornamento; alla fine scompare" richiede di avviare un run vero su un altro repo e
osservare la pagina in un browser: non verificabile da qui. La logica di
caricamento segue esattamente il pattern già in produzione per "Avanzamento"
(stesso ciclo per repo, stessa gestione degli errori), quindi il rischio è
contenuto, ma resta da confermare a mano.

## Fatto in più

Nulla: solo i file toccati sopra.
