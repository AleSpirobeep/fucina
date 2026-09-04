# Checklist di qualità — 005 L'interruttore nel Registro

**Scopo**: verificare che la specifica sia completa e coerente prima del piano e dei task.
**Creata**: 4 settembre 2026 · **Spec**: `specs/005-interruttore-nel-registro/spec.md`

## Qualità del contenuto

- [x] Nessun dettaglio implementativo nei requisiti: i nomi di file e le chiamate stanno nel
      piano e nel contratto, non in `spec.md`
- [x] Centrata sul valore per Alessio: spegnere senza terminale, non perdere lavoro, vedere il
      costo dello spegnimento
- [x] Leggibile da chi non scrive il codice
- [x] Tutte le sezioni obbligatorie del cancello presenti: Input, Chiarimenti, Scenari d'uso,
      Casi limite, Requisiti, Criteri di successo, Assunzioni

## Completezza dei requisiti

- [x] Nessun marcatore di punto aperto (`NEEDS CLARIFICATION`, `DA CHIARIRE`) in nessun
      documento: le otto domande del 4 settembre hanno tutte una risposta in «Chiarimenti»
- [x] Ogni requisito è verificabile e non ambiguo, e ha la sua riga `*Verifica:*`
- [x] I criteri di successo SC-401…SC-405 sono misurabili
- [x] I criteri di successo non nominano tecnologie
- [x] Ogni scenario d'uso ha i suoi scenari di accettazione
- [x] I casi limite sono elencati, compresi il permesso mancante, il workflow non installato e
      il fallimento parziale di «Avvia»
- [x] L'ambito è delimitato: «Fuori ambito» dice cosa resta alla spec 006 e cosa non si fa
- [x] Assunzioni e dipendenze dichiarate, compreso il passo manuale sul token

## Coerenza con il repo

- [x] Nessuna contraddizione con un ADR accettato; l'ADR
      `2026-09-02-2000-registro-pagina-statica.md` è esteso, non contraddetto, e la conferma
      riusa la forma decisa in `2026-09-03-1425-conferma-nativa-rispondi-e-riavvia.md`
- [x] Nessuna contraddizione con la spec 003: REQ-411 e REQ-412 rispettano REQ-252 (le
      esecuzioni in corso finiscono il ciclo); nessun emendamento necessario
- [x] La numerazione REQ-4xx e SC-4xx non collide con le spec 002, 003, 004
- [x] Nessun task tocca `.github/workflows/`
- [x] Nessun task modifica un file esistente fra i `percorsi_protetti`: i file di test sono
      tutti nuovi
- [x] Un contratto è presente perché la spec definisce un'interfaccia fra la pagina e l'API di
      GitHub: `contracts/comandi-pm.md`
- [x] L'unica decisione presa dall'analista senza chiedere lascia un ADR:
      `docs/decisions/2026-09-04-1900-ramo-del-giro-di-recupero.md` (P5)

## Pronta per la fucina

- [x] Ogni requisito è coperto da almeno un task
- [x] Ogni task ha i criteri di accettazione, i file che tocca e il rimando ai requisiti
- [x] Il solo task manuale è dichiarato tale e sta in una fase a cura di Alessio
- [x] Il cancello (`node scripts/analista-cancello.js specs/005-interruttore-nel-registro`)
      esce 0

## Analisi di coerenza

Eseguita a cancello verde, per cercare ciò che il cancello non vede. Quattro rilievi, tutti
chiusi prima della consegna:

- **ALTO** — la chiamata di dispatch esige un `ref` che nessun documento definiva: risolto
  con la lettura `L4` del contratto e l'ADR sul ramo di default.
- **MEDIO** — la verifica di REQ-442 parlava del «diff complessivo» della spec, non
  verificabile dentro la singola PR di un task: riformulata come proprietà di ogni PR.
- **BASSO** — la tabella degli errori del contratto copriva solo le scritture: aggiunta la
  riga sulle letture, con l'eccezione del 404 su `L1` che è uno stato.
- **BASSO** — «nessun file di modulo nuovo» nel piano si poteva leggere male: precisato.

Nessun conflitto con le spec 002 e 003, nessuna violazione della costituzione, copertura dei
requisiti al 100%.

## Note

- Restano fuori, per scelta esplicita di Alessio: fermare il dev-agent, annullare le
  esecuzioni in corso, e il rifacimento grafico (spec 006, non ancora analizzata).
- T008 è di Alessio e non diventa una issue: senza quel permesso, T004–T007 sono verificabili
  solo nel loro comportamento d'errore.
