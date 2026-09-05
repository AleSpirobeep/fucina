# Piano — 006 Il Registro leggibile

**Spec**: `specs/006-registro-leggibile/spec.md` · **Creato**: 5 settembre 2026

## Sommario

Il Registro oggi è `ui/index.html` (1069 righe, 272 di stile), `ui/lib.js` (533 righe di
funzioni pure) e `ui/github.js` (233 righe di chiamate), con 280 test in 17 file. Questa spec
**non aggiunge informazione**: riorganizza come quella che c'è viene mostrata, cambia la
tavolozza, e fa entrare il telefono. Di conseguenza tocca soprattutto `index.html` e lo stile,
aggiunge poche funzioni pure a `lib.js`, e **non tocca `github.js`**.

## Contesto tecnico

- **Linguaggio**: moduli ES, nessun passo di build, nessuna dipendenza (REQ-550).
- **Test**: `node:test`, un file `ui/<argomento>.test.js` **nuovo** per ogni task; i file
  esistenti sono percorsi protetti e non si modificano (REQ-552).
- **Stile**: un unico blocco `<style>` in `index.html`, con i token come variabili CSS. La
  tavolozza è il contratto `contracts/palette.md`.
- **Lingua**: italiano nell'interfaccia e nei messaggi.

## Fase 0 — Le scelte prese scrivendo il piano

Quattro scelte di forma, non coperte dalla spec perché non ne cambiano i requisiti.

1. **Il contrasto diventa una funzione pura testata, non un controllo a occhio.** REQ-541
   sarebbe verificabile solo aprendo uno strumento del browser. Mettendo il calcolo della
   luminanza in `ui/lib.js` con i suoi test, il requisito lo verifica la CI a ogni PR: se
   qualcuno cambia un colore e rompe il contrasto, il test lo dice. È l'unico modo di
   trasformare «più bella» in qualcosa che P2 accetta.

2. **La riga di stato non calcola nulla di nuovo.** Stato del PM, numero di agenti e lavoro in
   attesa sono già tutti prodotti dalla spec 005 (`riduciStatoPm`, `agentiAttivi`,
   `lavoroInAttesa`). La riga li compone e basta: nessuna chiamata nuova, nessuna logica
   duplicata, e i loro test restano validi.

3. **La memoria della vista sta accanto alle altre preferenze del browser**, con la stessa
   chiave di prefisso già usata per repo e token, così «Dimentica il token» la può azzerare
   con una sola regola invece di due (REQ-512).

4. **L'impaginazione stretta si ottiene togliendo larghezze fisse, non aggiungendo una
   seconda pagina.** Una sola serie di regole che vale da 360 px in su, con la griglia che si
   riduce a una colonna: non esiste una «versione telefono» da mantenere in parallelo.

## Struttura

### Documenti di questa spec

```
specs/006-registro-leggibile/
├── spec.md
├── plan.md
├── contracts/
│   └── palette.md
├── tasks.md
└── checklists/
    └── requirements.md
```

### Codice toccato

```
ui/
├── index.html      # lo stile, la riga di stato, i conteggi, il dettaglio, lo schermo stretto
├── lib.js          # contrasto, composizione della riga di stato, memoria della vista
└── <argomento>.test.js   # un file nuovo per task
```

`ui/github.js` non viene toccato: non cambia nulla di ciò che la pagina chiede a GitHub.
Nessun altro percorso del repo è coinvolto.

## Verifica costituzionale

- **P1** — spec, piano, contratto e task in git; entrano su `main` da una PR.
- **P2** — ogni requisito ha la sua riga di verifica; il più difficile da rendere verificabile
  (i colori) diventa un test grazie alla scelta 1 della Fase 0.
- **P3** — la CI è l'arbitro; i 280 test esistenti restano intatti e fanno da rete.
- **P4** — la fusione resta del PM o di Alessio.
- **P5** — le scelte della Fase 0 sono dichiarate qui; nessuna tocca sicurezza, token,
  permessi o costi. La scelta della tavolozza è di Alessio, presa guardando le proposte.
- **P6** — nessun componente nuovo: nessuna libreria, nessun framework di stile.
- **P7** — nessun tetto da configurare: la pagina non chiama il modello.
- **P8** — nulla da installare: `init.sh` non cambia.
- **P9** — nulla di deterministico passa dall'agente: qui non c'è workflow in gioco.

## Ordine dei task e perché

Il colore va **per primo**, da solo, mentre la struttura è ancora quella nota: così se
qualcosa stona lo si vede su una pagina che si conosce a memoria, invece che su una pagina
appena riorganizzata dove non si capisce cosa ha causato cosa. Poi la gerarchia (la riga di
stato), poi la densità (conteggi, dettaglio, agenti), infine il telefono — che ha senso solo
quando la struttura definitiva esiste, altrimenti si impagina due volte. L'ultimo task chiude
sui vincoli.

## Rischi

- **Il rifacimento tocca la resa di cose che la spec 005 ha appena costruito.** Mitigato da
  REQ-552 e dai 280 test esistenti, che nessun task può modificare: se una riorganizzazione
  rompe un comportamento, la CI lo dice prima del PM.
- **«Due schermate» di SC-502 dipende dai dati.** Il criterio è dichiarato su uno stato
  preciso (sette chiuse, tre in coda, una in lavorazione): con dieci volte quel lavoro nessuna
  impaginazione lo rispetterebbe, ed è accettato.
- **Il telefono non è provabile dalla CI.** REQ-530 e REQ-532 si verificano restringendo la
  finestra del browser; sono verifiche di Alessio, non della suite. La spec lo dice invece di
  fingere il contrario.
