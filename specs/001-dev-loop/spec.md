# Spec 001 — Loop dello sviluppatore

Stato: **v1 collaudata, con riserve dichiarate in fondo** · Aggiornata: 2 settembre 2026

## Obiettivo

Dato un repo GitHub con delle issue, permettere a un agente sviluppatore di prendere in
carico una issue, implementarla su un branch, eseguire i test e aprire una PR — senza che
possa aggirare le verifiche né decidere in silenzio.

Il ruolo di project manager in v1 lo svolge Alessio a mano: scrive lui le issue con i
criteri di accettazione e applica lui la label che avvia il lavoro.

## Utente

Alessio, singolo utente, sui propri repo GitHub (privati e pubblici). Nessun multi-utente,
nessuna autenticazione, nessun billing.

## Forma dell'artefatto

Due componenti, distribuiti insieme:

1. **Plugin Claude Code `fucina`** — contiene la skill `dev-agent` (il ruolo dello
   sviluppatore, con il proprio elenco di tool permessi).
2. **Script `fucina init`** — applicato a un repo esistente o nuovo, scrive i file di
   configurazione, crea le label e stampa i passi manuali residui.

La fucina non sostituisce Spec Kit: presuppone che il repo target lo usi o possa usarlo.

---

## Requisiti

### Installazione

- **REQ-001** — `fucina init`, eseguito in un repo git con `gh` autenticato, crea le label
  `ready-for-dev`, `in-progress`, `needs-review`, `changes-requested`, `needs-human`,
  `allow-test-changes`.
  *Verifica:* `gh label list` le contiene tutte e sei con i colori attesi.

- **REQ-002** — `init` è idempotente.
  *Verifica:* due esecuzioni consecutive; la seconda non produce modifiche a git né label duplicate.

- **REQ-003** — `init` scrive `.github/workflows/dev-agent.yml`,
  `.github/workflows/guard-tests.yml`, `.github/CODEOWNERS`,
  `docs/decisions/0000-template.md` e `.fucina.yml`.
  *Verifica:* i cinque file esistono dopo l'esecuzione.

- **REQ-004** — se un file di destinazione esiste già, `init` non lo sovrascrive e lo elenca
  come saltato.
  *Verifica:* si modifica un file, si rilancia `init`, il contenuto è invariato e appare nel report.

- **REQ-005** — a fine esecuzione `init` stampa i passi che non può compiere da solo:
  branch protection, check obbligatori, secret `ANTHROPIC_API_KEY`.
  *Verifica:* l'output contiene le tre voci.

### Agente sviluppatore

- **REQ-010** — applicando `ready-for-dev` a una issue parte un workflow che crea un branch
  con prefisso `fucina/` (il nome completo lo decide l'action: `fucina/issue-<N>-<data>`) e,
  a lavoro concluso, apre una PR che chiude quella issue.
  *Verifica:* su una issue di prova, entro 10 minuti esistono branch e PR collegata.

- **REQ-011** — a lavoro concluso il workflow applica `needs-review` alla PR e rimuove
  `in-progress` dalla issue.
  *Verifica:* stato delle label dopo un run riuscito.

- **REQ-012** — prima di scrivere codice l'agente legge `CLAUDE.md`, `specs/` e
  `docs/decisions/`.
  *Verifica:* il log della run contiene le letture di quei percorsi.

- **REQ-013** — il comando dei test è letto da `.fucina.yml` (chiave `test_command`). Se
  manca, il workflow fallisce subito con un messaggio esplicito.
  *Verifica:* run con chiave assente → fallimento entro un minuto, messaggio leggibile.

- **REQ-014** — ogni run applica `--max-budget-usd` e `--max-turns` presi da `.fucina.yml`.
  Al superamento il run termina e commenta sull'issue quanto ha speso.
  *Verifica:* budget impostato a un valore minimo → il run si interrompe e commenta.

- **REQ-015** — due run sulla stessa issue non girano in parallelo.
  *Verifica:* doppia applicazione rapida della label → il secondo run attende, non viene annullato.

- **REQ-016** — il push dell'agente fa partire la CI del repo.
  *Verifica:* dopo il push del branch i check di stato risultano avviati (è la trappola del
  `GITHUB_TOKEN` di default: va usato il token della GitHub App).

- **REQ-017** — l'agente esegue i test prima di aprire la PR e, se falliscono, li corregge
  entro il limite di iterazioni invece di aprire una PR rossa.
  *Verifica:* issue che richiede una modifica con test esistenti → la PR nasce verde.

### Protezioni

- **REQ-020** — una PR che modifica file sotto i percorsi protetti senza la label
  `allow-test-changes` fa fallire il check `guard-tests`.
  *Verifica:* PR di prova che tocca un file di test → check rosso con l'elenco dei file.

- **REQ-021** — i percorsi protetti sono configurabili in `.fucina.yml`; default
  `tests/**`, `**/*_test.*`, `**/*.test.*`, `.github/workflows/**`.
  *Verifica:* aggiunta di un percorso in configurazione → viene protetto.

- **REQ-022** — `guard-tests` si rivaluta all'aggiunta e alla rimozione di una label.
  *Verifica:* PR rossa che riceve `allow-test-changes` → il check ridiventa verde senza nuovo push.

- **REQ-023** — il branch principale è protetto: PR obbligatoria, check `test` e `guard`
  obbligatori, nessun bypass per gli agenti. Il merge resta manuale (P4).
  *Verifica:* un push diretto su `main` da un attore non amministratore viene respinto; una
  PR con un check rosso non è fondibile.
  *Nota:* la protezione richiede repo pubblico o piano Pro. Il `CODEOWNERS` resta nel
  template ma con una sola persona è ridondante e sul piano Free non è applicabile. Le
  approvazioni richieste sono zero: le PR aperte tramite il PAT risultano di Alessio, che
  non può approvare le proprie.

- **REQ-024** — la fucina non abilita mai l'auto-merge e non inserisce agenti in liste di bypass.
  *Verifica:* ispezione della configurazione generata.

### Decisioni ed escalation

- **REQ-030** — quando l'agente decide qualcosa che la specifica non copre, aggiunge alla PR
  un ADR in `docs/decisions/` con identificativo basato su data-ora e `status: accepted`.
  *Verifica:* issue volutamente ambigua → la PR contiene un nuovo ADR.

- **REQ-031** — se l'agente non può decidere, non indovina: formula nel suo report una
  domanda chiusa con le opzioni e termina senza creare branch. Il workflow, vedendo un run
  verde senza branch, applica `needs-human` e spiega come riprendere.
  *Verifica:* issue con scelta non coperta dalla specifica → label applicata, nessuna PR,
  domanda leggibile nel commento.

- **REQ-032** — dopo tre run falliti sulla stessa issue l'automatismo si ferma e applica
  `needs-human`.
  *Verifica:* issue impossibile → al quarto tentativo nessun run parte.

---

## Fuori scope in v1

Agente PM · dashboard web · merge automatico · modelli locali · test di accettazione
nascosti · giudice LLM indipendente · supporto multi-utente · Headroom e ottimizzazioni
di costo oltre ai tetti di spesa.

Sono tutti rinviati a specifiche successive, non abbandonati.

---

## Open point

| # | Domanda | Esito |
|---|---|---|
| OP-01 | Linguaggio dello script `init` | **proposto:** bash + `gh` CLI, zero dipendenze aggiuntive |
| OP-02 | Repo pubblico o privato? | **proposto:** privato ora, rivalutabile dopo |
| OP-03 | Come si determina il comando dei test? | **proposto:** solo `.fucina.yml`, nessun rilevamento automatico |
| OP-04 | Dove si collauda la v1? | **CHIUSO:** repo giocattolo creato apposta |
| OP-05 | Autenticazione in Actions | **CHIUSO:** token OAuth della sottoscrizione Claude — vedi ADR 2026-08-30-1050 |
| OP-06 | Iterazioni prima dell'escalation | **proposto:** tre |
| OP-07 | L'agente può installare dipendenze? | **proposto:** sì, solo quelle nei file di lock |
| OP-08 | L'agente può creare test nuovi? | **CHIUSO con debito:** sì in v1, da sistemare in v2 — vedi sotto |

## Debito noto — da chiudere in v2

**D-01 — Il divieto sui test è aggirabile.**
In v1 l'agente non può modificare i test esistenti (REQ-020) ma può crearne di nuovi.
Un agente può quindi scrivere accanto a un test rigoroso un test nuovo e permissivo:
la copertura sale, i check restano verdi, e la verifica è diluita.

Contromisure previste per la v2, in ordine di efficacia:
1. Gate sulla copertura del **diff** (`diff-cover`) invece che della copertura globale:
   un test permissivo non nasconde righe nuove scoperte.
2. Suite di accettazione **nascosta** all'agente, eseguita come check obbligatorio.
3. Giudice indipendente che confronta la PR con la specifica.

Fino ad allora la mitigazione è procedurale: i test nuovi introdotti dall'agente vanno
letti nella review, ed è l'unica parte del diff che non si può scorrere.

**D-02 — Dipendenza da una policy in pausa.**
La fatturazione dell'uso di Claude Code in GitHub Actions a carico della sottoscrizione
è oggi possibile per una decisione sospesa, non ritirata (vedi ADR 2026-08-30-1050).
La v2 deve poter cambiare fornitore cambiando due variabili, non riscrivendo i workflow:
`ANTHROPIC_BASE_URL` e il secret di autenticazione vanno tenuti in `.fucina.yml`.

**D-03 — Il corpo della PR viaggia in un file committato.**
`.fucina/pr-body.md` finisce nel diff e in `main` a ogni merge. Alternativa da valutare:
leggere il report dall'ultimo commento dell'action sull'issue (formato non garantito),
oppure un commit di pulizia post-merge. Vedi ADR 2026-09-02-1700.

---

## Stato di verifica — 2 settembre 2026

Sei run dell'agente, tre PR prodotte, due fuse, una PR di prova a mano.

| Esito | Requisiti |
|---|---|
| Verificati sul campo | 001 · 002 · 003 · 004 · 005 · 010 · 011 · 012 · 013 · 016 · 017 · 020 · 021 · 022 · 024 · 030 · 032 |
| Verificati per costruzione | 023 (protezione attiva; il bypass da amministratore è stato visto nei push di Alessio) |
| Verificati con riserva | 031 — l'agente si è fermato correttamente, ma il README del laboratorio annunciava lo scopo del test e l'agente l'ha letto. Da ricollaudare con una issue ambigua non annunciata. |
| Da confermare | 015 — i due run concorrenti hanno prodotto il risultato atteso, ma i timestamp a livello di run non distinguono "creato" da "eseguito"; serve il timestamp del job. |
| **Non verificati** | **014** — la prova del budget è fallita per un bug non correlato (`track_progress` su `workflow_dispatch`, corretto). Da rifare con budget minimo su un trigger da label. |

Fino alla verifica del REQ-014, l'unico tetto di spesa di cui abbiamo evidenza è
`max_turns`. Va considerato il tetto effettivo.
