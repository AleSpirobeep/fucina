# Costituzione — Fucina

Principi non negoziabili. Ogni specifica, ogni task e ogni agente vi si conforma.
Una decisione che contraddice un principio richiede prima di emendare questo documento.

## P1 — Il repo è l'unica fonte di verità
Specifiche, piani, decisioni e task vivono in git, in markdown. Nessun servizio esterno
di memoria, nessun documento fuori dal repo. Una modifica alla specifica passa da una PR
esattamente come il codice.

## P2 — Un requisito non testabile non è un requisito
Ogni requisito ha un criterio di accettazione che una macchina può verificare.
Se non si sa come si verifica, è un desiderio: va chiarito o rinviato, non implementato.

## P3 — Nessun agente giudica il proprio lavoro
La CI è l'arbitro. L'agente che scrive il codice non scrive né modifica i test che lo
verificano, e non approva la propria PR.

## P4 — Il merge è umano
Nessun merge automatico. È la valvola che separa una persona da un loop che gira
nella direzione sbagliata per otto ore.
Eccezione, per la sola spec 002: il merge è dell'agente PM, un'istanza distinta da
quella che scrive il codice, che revisiona ogni diff e riferisce in una issue di
rapporto — vedi `docs/decisions/2026-09-02-2100-pm-agent-fonde.md`.

## P5 — Ogni decisione presa senza chiedere lascia una traccia
Se un agente decide qualcosa che la specifica non copre, scrive un ADR. Se non può
decidere, si ferma e chiede: non indovina.

## P6 — Affittare, non costruire
La fucina estende Spec Kit, GitHub Actions, Issues e Projects. Non li sostituisce e non
li riscrive. Ogni componente che GitHub o Anthropic offrono già non va reimplementato.

## P7 — Ogni esecuzione ha un tetto
Budget di spesa e numero massimo di iterazioni sono espliciti e configurati, mai impliciti.

## P8 — L'installazione è idempotente e non distruttiva
`init` si può rilanciare su un repo già inizializzato senza duplicare nulla e senza
sovrascrivere file personalizzati.

## P9 — Ciò che è deterministico lo fa il workflow
Label, commenti di stato, apertura della PR, conteggio dei tentativi: tutto ciò che
si può decidere da fatti osservabili lo decide il workflow, non l'agente. All'agente
restano le azioni che richiedono giudizio: leggere, capire, scrivere codice e test,
decidere quando fermarsi. Tre cicli su tre hanno mostrato che un'azione di stato
affidata all'agente può non avvenire, in silenzio.
