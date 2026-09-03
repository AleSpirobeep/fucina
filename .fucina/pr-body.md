## Cosa ho fatto

L'analista, il terzo ruolo della fucina: da un'idea di due righe a una coda di task
`in-coda`, fermandosi a chiedere quando l'idea ha buchi, e senza far partire niente
finché una verifica meccanica non passa e Alessio non conferma.

**La specifica** (commit precedente su questo branch): `specs/004-analista/spec.md` con
31 requisiti `REQ-3xx`, ciascuno con la sua riga di verifica, cinque scenari, dodici casi
limite, sei criteri di successo; l'ADR `2026-09-03-2320-agente-analista.md` con le due
decisioni di fondo (skill locale invece di workflow a commenti; cancello deterministico
invece del giudizio del modello). Completata ora con `plan.md`, `contracts/cancello.md`,
`tasks.md` (quattro task più uno manuale, che coprono tutti e 31 i requisiti) e
`checklists/requirements.md`.

**Il cancello**: `template/scripts/analista-cancello.js`, funzione pura più riga di
comando, nessuna dipendenza. Data una cartella di spec elenca i problemi bloccanti con
file e riga ed esce 0, 1 o 2. Quindici problemi, dal contratto: punto aperto, documento o
sezione mancante, requisito senza verifica, task senza criteri o senza rimando a un
requisito, requisito non coperto o inesistente, task duplicato o fuori ordine,
`test_command` vuoto, task su `.github/workflows/`, task che modifica un percorso
protetto esistente. Test in `template/scripts/`, con fixture accanto: un caso verde e un
caso negativo per ciascun problema, più le funzioni pure e i quattro codici di uscita.

**Il ruolo**: `plugin/skills/analista/SKILL.md` (221 righe). Le tre regole non
negoziabili — non riempie i buchi, non consegna a cancello rosso, non fa partire la
fucina — i controlli preliminari sul repo, i giri di domande chiuse con opzioni e
conseguenze, la trascrizione delle coppie D/R in «Chiarimenti», le due mosse quando
Alessio non sa (rinviare o restringere), il confine fra ciò che decide e ciò che chiede,
l'ordine di invocazione dei comandi di Spec Kit (che non riscrive, P6), il riepilogo con
la conferma, la consegna idempotente delle issue, la ripresa di un'analisi a metà, e la
sezione «Cosa non fai, mai».

**Installazione**: `init.sh` copia i due file (`scripts/analista-cancello.js` e
`.claude/skills/analista/SKILL.md`) con la funzione `copia` esistente e guadagna un passo
manuale che dice che l'analista non ha nulla da accendere; `template/.fucina.yml` e
`.fucina.yml` ricevono la chiave `analista` (modello, tetti, `max_domande_per_giro`,
strumenti permessi) commentata riga per riga; `template/CLAUDE.md`, `CLAUDE.md` e
`README.md` ricevono una sezione breve.

## Come l'ho verificato

Suite completa: `node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` →
**188/188 verdi** (150 prima, 38 nuovi).

Il cancello su sé stesso, cioè sulla spec che lo descrive:

```
$ node template/scripts/analista-cancello.js specs/004-analista
Cancello verde: 31 requisiti, 4 task da lavorare, 1 manuali.
Resta la conferma di Alessio: la verifica da sola non consegna nulla.
```

Il cancello sulla spec 003, che nessuno ha scritto pensando a lui:

```
$ node template/scripts/analista-cancello.js specs/003-pm-a-cicli
Cancello rosso: 5 problemi bloccanti.
  [requisito-senza-verifica] spec.md:350 — REQ-270 ...
  [requisito-senza-verifica] spec.md:352 — REQ-271 ...
  [requisito-senza-verifica] spec.md:353 — REQ-272 ...
  [task-senza-criteri] tasks.md:30 — T001 non ha criteri di accettazione
  [task-su-percorso-protetto] tasks.md:30 — T001 modifica template/scripts/pm-coda.test.js
```

I primi quattro sono difetti veri della 003: i tre requisiti della sezione «Vincoli» non
hanno una riga di verifica, e T001 non ha criteri di accettazione. Il quinto è il limite
noto del controllo sui percorsi protetti: distingue una modifica da un'aggiunta guardando
se il file esiste **oggi**, e `pm-coda.test.js` esiste perché T001 è già stato fatto. Il
cancello è una verifica *prima* della consegna: eseguito su una spec già realizzata, quel
falso positivo è atteso.

Altre verifiche: `bash -n init.sh` esce 0; `yq '.'` esce 0 su `.fucina.yml` e su
`template/.fucina.yml`; `yq '.analista.max_domande_per_giro'` stampa 5; il ruolo non
contiene `gh workflow enable`, `gh pr merge` né `ready-for-dev` fuori dalle due sezioni
dei divieti; sta in 221 righe (tetto: 250). Nessun token in nessun file: solo nomi di
secret già presenti.

## Decisioni

Nessun ADR nuovo oltre a `2026-09-03-2320-agente-analista.md`, già in questo branch. Le
due scelte minori di forma prese scrivendo il codice — il cancello legge documenti e non
il disco, e la lettura di `.fucina.yml` è mirata a due chiavi invece di essere un parser
YAML — sono registrate nella fase 0 di `plan.md`, dove le vede chi legge la spec.

Una modifica al parser, decisa leggendo la 003: la catena `REQ-210, 211, 212` viene
riconosciuta anche quando una parentesi si intromette (`213 (decisione), 214`), perché è
così che i task della 003 sono scritti davvero. Con un test dedicato, e uno che verifica
che non prenda un numero dopo una frase intera.

## Non fatto

- Il cancello **non è installato** nel repo della fucina sotto `scripts/`: il sorgente
  resta `template/scripts/analista-cancello.js`, come per `pm-coda.js`, che nemmeno oggi
  è installato qui. Il ruolo lo dice esplicitamente. L'installazione su questo repo è
  parte del collaudo (T008 della spec 003, e T005 della 004).
- Nessuna issue creata, nessun task in coda: la 003 ha ancora T008 aperto e la 004 non
  deve sovrapporsi. `CLAUDE.md` continua a indicare la 003 come spec attiva.
- T005 della 004 (collaudo su un'idea vera) non è fatto: è a cura di Alessio.
- L'analista che dialoga via commenti su una issue, usabile dal telefono, resta il punto
  esplicitamente rinviato della spec.

## Fatto in più

- `.claude/skills/analista/SKILL.md`: copia del ruolo installata anche in questo repo,
  così `/analista` è invocabile subito qui. È ciò che `init.sh` fa nei repo di
  destinazione, fatto a mano per questo.
- `CLAUDE.md` della radice: due righe in più — la cartella `plugin/skills/` con i tre
  ruoli, e la presenza di `specs/004-analista/`. La issue non lo nominava.
- La modifica al parser delle catene di requisiti descritta sopra: non era richiesta,
  l'ha suggerita l'esecuzione sulla 003.
