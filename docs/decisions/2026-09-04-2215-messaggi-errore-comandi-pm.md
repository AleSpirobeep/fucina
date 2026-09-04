---
status: accepted
date: 2026-09-04
decision-makers: [dev-agent]
---
# Messaggi d'errore dei comandi del PM: funzione dedicata, non `messaggioErroreHttp`

## Contesto e problema

`contracts/comandi-pm.md` chiede messaggi specifici (403 nomina il permesso `Actions:
read and write` e dove si concede, 404 dice che `pm-agent.yml` non risulta installato,
401 rimanda a «Configurazione») per le sole chiamate L1–L4, S1–S3 di questa spec.
`messaggioErroreHttp`, già usata da ogni altra chiamata della pagina (issue, PR,
commenti, check run), ha un proprio testo per 401 e 404 coperto da test esistenti in
`ui/github.test.js`, protetti dal guard: non si possono modificare senza cambiare il
comportamento di chiamate che non c'entrano con l'interruttore.

## Opzioni considerate

1. Modificare `messaggioErroreHttp` per aggiungere i casi 403/`Configurazione`. Rotto
   dai test esistenti su `messaggioErroreHttp(401, …)` e `messaggioErroreHttp(404, …)`,
   che assumono il testo attuale.
2. Una funzione `messaggioErroreComandoPm(status, repo)` dedicata, usata solo dalle
   chiamate del contratto (L1–L4, S1–S3) tramite un'opzione `messaggioErrore` passata a
   `richiesta()` in `ui/github.js`; ricade su `messaggioErroreHttp` per i codici che non
   differenziano.

## Decisione

Opzione 2. `richiesta(url, token, repo, opzioni)` accetta ora `opzioni.messaggioErrore`,
una funzione `(status, repo) -> string` usata al posto di `messaggioErroreHttp` di
default. Le sette chiamate del contratto (`statoPm`, `ultimaEsecuzionePm`,
`esecuzioniInCorsoPm`, `fermaPm`, `ramoDefaultRepo`, `abilitaPm`,
`avviaGiroDiRecuperoPm`) la passano; tutte le altre chiamate restano su
`messaggioErroreHttp`, invariata.

## Conseguenze

I test esistenti su `messaggioErroreHttp` restano verdi senza modifiche. Il 404 di `L1`
resta ininfluente sul messaggio (viene ridotto a `non-installato` prima di essere letto,
come da contratto), ma se in futuro qualcosa smettesse di intercettarlo mostrerebbe il
testo di `messaggioErroreComandoPm`, non quello generico di `messaggioErroreHttp` — coerente
con "gli stessi messaggi valgono per le letture L2, L3 e L4" del contratto.
