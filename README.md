# Fucina

Toolkit personale per far lavorare agenti Claude su repo GitHub, con le specifiche come
fonte di verità e verifiche che gli agenti non possono aggirare.

Non è un prodotto: è configurazione riusabile. Si installa su un repo, non lo sostituisce.

## Stato

Fase di analisi. La v1 (solo agente sviluppatore + protezioni) è specificata in
`specs/001-dev-loop/spec.md` e attende risposta agli open point in fondo a quel documento.

## Struttura

    .specify/memory/constitution.md   principi non negoziabili
    specs/001-dev-loop/spec.md        specifica della v1
    docs/decisions/                   registro decisioni, formato MADR 4.0

## Come si leggerà

- Le decisioni prese senza chiedere finiscono in `docs/decisions/`, un file per decisione,
  identificativo per data-ora, mai riscritte: si superano con `status: superseded by ...`.
- Gli open point aperti vivono in fondo alla specifica finché non sono chiusi, poi
  diventano requisiti o ADR.
