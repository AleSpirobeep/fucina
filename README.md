# Fucina

Toolkit personale per far lavorare agenti Claude su repo GitHub, con le specifiche
come fonte di verità e verifiche che gli agenti non possono aggirare.

Non è un prodotto: è configurazione riusabile. Si installa su un repo, non lo sostituisce.

## Stato

**v1 in collaudo** — solo agente sviluppatore e protezioni. Il ruolo di PM lo svolge
una persona: scrive le issue con i criteri di accettazione e applica la label che
avvia il lavoro.

## Struttura

    .specify/memory/constitution.md   principi non negoziabili
    specs/001-dev-loop/spec.md        specifica della v1, con open point e debito noto
    docs/decisions/                   registro decisioni, formato MADR 4.0
    plugin/                           i tre ruoli: analista, dev-agent, pm-agent
    template/                         file che init copia nel repo di destinazione
    init.sh                           installatore

## Installazione su un repo

```bash
cd /percorso/del/repo/da/preparare
bash /percorso/della/fucina/init.sh
```

`init` crea le label, copia i file di configurazione e stampa i tre passi che non
può compiere da solo: installare la GitHub App di Claude, impostare il secret con il
token, e proteggere il branch principale.

È idempotente: rieseguirlo non duplica le label e non sovrascrive file esistenti.

## Il plugin

I tre ruoli stanno in `plugin/skills/`: `analista`, `dev-agent`, `pm-agent`.
Il ruolo `dev-agent` sta in `plugin/skills/dev-agent/SKILL.md`. `init` lo copia nel
repo di destinazione sotto `.claude/skills/dev-agent/SKILL.md`, dove Claude Code lo
trova come `/dev-agent` — è così che i workflow lo invocano.

La cartella `plugin/` esiste per un impacchettamento futuro come plugin vero: in v1
la skill viaggia dentro il repo di destinazione, che è più semplice da collaudare e
lascia il ruolo versionato insieme al codice che governa.

## L'analista

Il ruolo che viene prima del codice. `/analista`, in una sessione Claude Code aperta sul
repo, prende un'idea detta in due righe e la porta fino a una coda di task: fa domande
chiuse, poche per volta, e scrive ogni risposta nella sezione «Chiarimenti» della spec;
quando non ha più domande produce `specs/<NNN>-*/` con i comandi di Spec Kit e apre una PR.

Non riempie i buchi. Se un'informazione manca e Alessio non la dà, resta un punto aperto
dichiarato: o si rinvia a una spec successiva, o si restringe l'ambito.

Fra l'analisi e la coda c'è un cancello che non dipende dal giudizio del modello:

```bash
node scripts/analista-cancello.js specs/004-analista
```

Elenca i problemi bloccanti — punti aperti, requisiti senza verifica, task senza criteri o
senza rimando a un requisito, requisiti che nessun task copre, `test_command` vuoto, task su
percorsi che l'agente sviluppatore non può scrivere — ed esce 1 se ce n'è almeno uno. Verde
non basta: le issue nascono solo dopo una conferma esplicita, con `/analista consegna`, e a
spec fusa su `main`.

L'analista **non accende la fucina**: finisce dicendo ad Alessio di dare
`scripts/pm.ps1 avvia`. È l'ultima valvola umana (P4).

## Il PM a cicli

Il terzo ruolo, `pm-agent`, porta avanti la coda dei task al posto di una
persona: prende la prossima issue `in-coda`, la avvia (`ready-for-dev`), revisiona
ogni PR che l'agente sviluppatore apre contro la specifica, la fonde o la rimanda
con un commento, risponde alle domande che trova in `needs-human`, e riferisce ad
Alessio in un'unica issue con label `rapporto-pm` — mai una nuova per ciclo.

`init` lo installa spento: nessun evento del repo lo fa partire finché non lo
accendi con `scripts/pm.ps1 avvia` (richiede lo scope `workflow` sul login `gh`
locale). Si spegne con `scripts/pm.ps1 ferma`: un'esecuzione già in corso finisce
il ciclo, ma nessuna nuova ne parte. `scripts/pm.ps1 stato` mostra se è acceso, la
coda, le PR da revisionare e le domande in attesa.

Legge la configurazione da `.fucina.yml`, chiave `pm` (modello, tetto di turni, tetto
di spesa, attesa dei check): tutta commentata riga per riga, con default sensati se
la chiave manca del tutto.

Costa una chiamata al modello per ogni PR revisionata e una per ogni domanda —
nient'altro. Rimandare check rossi o sezioni mancanti, attendere check in corso,
avviare il task successivo, contare i tentativi, commentare, fondere e chiudere
sono azioni del workflow, a costo zero, come un giro senza lavoro o un PM spento,
che non scrivono nulla.

## Come si legge il lavoro degli agenti

- Le decisioni prese senza chiedere finiscono in `docs/decisions/`, un file per
  decisione, identificativo per data-ora, mai riscritte: si superano con
  `status: superseded by ...`
- Le issue con label `needs-human` sono quelle su cui l'agente si è fermato:
  è la coda da guardare per prima
- Un check `guard-tests` rosso significa che qualcuno ha toccato i file che
  verificano il lavoro. Va letto, non aggirato con la label
