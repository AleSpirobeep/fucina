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
    plugin/                           plugin Claude Code con la skill dev-agent
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

Il ruolo `dev-agent` sta in `plugin/skills/dev-agent/SKILL.md`. `init` lo copia nel
repo di destinazione sotto `.claude/skills/dev-agent/SKILL.md`, dove Claude Code lo
trova come `/dev-agent` — è così che i workflow lo invocano.

La cartella `plugin/` esiste per un impacchettamento futuro come plugin vero: in v1
la skill viaggia dentro il repo di destinazione, che è più semplice da collaudare e
lascia il ruolo versionato insieme al codice che governa.

## Come si legge il lavoro degli agenti

- Le decisioni prese senza chiedere finiscono in `docs/decisions/`, un file per
  decisione, identificativo per data-ora, mai riscritte: si superano con
  `status: superseded by ...`
- Le issue con label `needs-human` sono quelle su cui l'agente si è fermato:
  è la coda da guardare per prima
- Un check `guard-tests` rosso significa che qualcuno ha toccato i file che
  verificano il lavoro. Va letto, non aggirato con la label
