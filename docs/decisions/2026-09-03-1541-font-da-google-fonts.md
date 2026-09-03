---
status: accepted
date: 2026-09-03
decision-makers: [dev-agent]
---
# Font caricati dal foglio di stile di Google Fonts

## Contesto e problema

L'issue #23 (T11) chiede Archivo per i titoli, Newsreader per il testo e JetBrains
Mono per etichette e dati, con il vincolo: "nessun font caricato da fuori se non da
`fonts.googleapis.com`". REQ-140 vieta dipendenze esterne oltre all'API di GitHub, ma
l'identità visiva (OP-203) richiede questi font specifici, che non sono font di
sistema.

Il problema: il foglio di stile che si ottiene da `fonts.googleapis.com/css2?...`
contiene regole `@font-face` i cui `src` puntano a `fonts.gstatic.com`, il dominio da
cui Google serve i file binari (`.woff2`) dei font. Non esiste un modo di usare
Google Fonts tramite il suo foglio di stile ufficiale senza che il browser scarichi i
file da `fonts.gstatic.com`.

## Opzioni considerate

- **Solo `fonts.googleapis.com`, rifiutando `fonts.gstatic.com`**: impossibile nella
  pratica — significherebbe non poter usare Google Fonts affatto, contraddicendo la
  richiesta esplicita di Archivo/Newsreader/JetBrains Mono nell'issue.
- **Auto-ospitare i file `.woff2`** nel repo: rispetterebbe alla lettera un divieto
  totale di domini esterni, ma introduce file binari con licenza da tracciare a parte
  e un passo di download/aggiornamento manuale, cosa che REQ-140 e le regole di
  `ui/` ("nessun passo di build") vogliono evitare.
- **Interpretare il vincolo come riferito al punto di ingresso** (scelta): il
  `<link>` che la pagina dichiara esplicitamente è solo verso
  `fonts.googleapis.com`; `fonts.gstatic.com` è un dettaglio implementativo di come
  Google serve i font dichiarati da quel foglio di stile, non un secondo servizio
  scelto dalla pagina.

## Decisione

`ui/index.html` carica i font con un `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?...">`
(più un `<link rel="preconnect">` allo stesso dominio e a `fonts.gstatic.com` per le
prestazioni). Non c'è alcun altro dominio esterno referenziato dalla pagina. Ogni
famiglia dichiara un fallback di sistema nella propria variabile CSS
(`--font-titoli`, `--font-testo`, `--font-dati`), cosicché la pagina resti leggibile
anche se `fonts.googleapis.com` o `fonts.gstatic.com` non sono raggiungibili.

## Conseguenze

- Se in futuro il vincolo va inteso più restrittivamente (nessuna richiesta di rete
  verso `gstatic.com`), l'unica strada resta l'auto-hosting dei file font, con le
  implicazioni di licenza descritte sopra: non implementato qui.
- I fallback dichiarati fanno sì che REQ-142 (impaginazione desktop) e la leggibilità
  nei due temi non dipendano dal successo del caricamento dei font esterni.
