# Checklist di qualità — 006 Il Registro leggibile

**Scopo**: verificare che la specifica sia completa e coerente prima dei task.
**Creata**: 5 settembre 2026 · **Spec**: `specs/006-registro-leggibile/spec.md`

## Qualità del contenuto

- [x] Nessun dettaglio implementativo nei requisiti: nomi di file e valori esadecimali stanno
      nel piano e nel contratto
- [x] Centrata sul valore per Alessio: dieci secondi per capire, una pagina che non cresce con
      il lavoro, il PM fermabile dal telefono
- [x] Le sezioni obbligatorie del cancello ci sono tutte
- [x] «Più bella» non compare come requisito: è diventata una tavolozza con valori esatti e un
      contrasto misurabile

## Completezza dei requisiti

- [x] Nessun marcatore di punto aperto: le tredici domande di due giri hanno tutte risposta in
      «Chiarimenti»
- [x] Ogni requisito ha la sua riga `*Verifica:*`
- [x] I criteri SC-501…SC-505 sono misurabili, e SC-502 dichiara lo stato dei dati su cui vale
- [x] Ogni scenario ha i suoi scenari di accettazione
- [x] Otto casi limite, compresi la memoria negata dal browser, il dettaglio ricordato che non
      esiste più, e il repo che non risponde
- [x] «Fuori ambito» delimita: niente font nuovi, niente interruttore del tema, niente
      navigazione fra repo, nessuna informazione nuova
- [x] Assunzioni dichiarate, compresa la dipendenza dalla spec 005 già fusa

## Coerenza con il repo

- [x] Nessuna contraddizione con un ADR accettato; l'ADR sui font resta valido e non è toccato
- [x] I cinque emendamenti alla spec 002 sono **dichiarati dentro i requisiti che li fanno**
      (REQ-503, 510, 520, 530, 540), non applicati di nascosto
- [x] Il sesto emendamento, a REQ-402 della spec 005, è dichiarato in REQ-510: i task in coda
      si spostano nella riga dei conteggi. Trovato dal controllo di coerenza, non dal cancello,
      e deciso da Alessio perché cambia un requisito di una spec già fusa
- [x] La numerazione REQ-5xx e SC-5xx non collide con le spec 002, 003, 004, 005
- [x] Nessun task tocca `.github/workflows/`
- [x] Nessun task modifica un file esistente fra i `percorsi_protetti`: i file di test sono
      tutti nuovi, e REQ-552 lo rende un requisito oltre che una convenzione
- [x] Un contratto è presente perché la spec fissa un formato — i sedici token e le coppie di
      contrasto: `contracts/palette.md`
- [x] Nessuna decisione presa dall'analista senza chiedere: la tavolozza l'ha scelta Alessio
      guardando quattro proposte, quindi nessun ADR nuovo

## Pronta per la fucina

- [x] Ogni requisito è coperto da almeno un task (18 requisiti, 7 task)
- [x] Ogni task ha criteri, file e rimandi ai requisiti
- [x] Nessun task manuale: a differenza della 005, qui non serve nulla da Alessio per partire
- [x] Il cancello esce 0

## Ciò che questa spec non riesce a rendere automatico

Onestà su dove P2 arriva al limite:

- **REQ-530 e REQ-532** (il telefono) si verificano restringendo la finestra del browser: sono
  verifiche di Alessio, non della suite. Il piano lo dice fra i rischi invece di fingere il
  contrario.
- **SC-501**, il cronometro dei dieci secondi, è una misura umana su uno stato preparato. È il
  criterio complessivo, non la verifica di un requisito: ogni requisito ne ha una propria.
- **REQ-543** (l'accento solo alle azioni) si verifica leggendo il foglio di stile. È un
  controllo meccanico ma non un test: renderlo tale richiederebbe un analizzatore di CSS, che
  sarebbe più codice di quello che verifica.

## Note

- La pagina di confronto delle quattro tavolozze vive fuori dal repo: è servita a decidere e
  non è un artefatto da mantenere.
- T008 della spec 005 — il token con `Actions: read and write` — resta a carico di Alessio e
  non blocca questa spec.
