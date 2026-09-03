---
status: accepted
date: 2026-09-03
decision-makers: [dev-agent]
---
# Font caricati tramite il foglio di stile di Google Fonts

## Contesto e problema

REQ-142/OP-203 (issue #23) chiede Archivo per i titoli, Newsreader per il testo e
JetBrains Mono per etichette e dati, con il vincolo "nessun font caricato da fuori se
non da `fonts.googleapis.com`; fallback dichiarati". Il modo standard di usare Google
Fonts è un `<link>` verso `fonts.googleapis.com/css2`, che a sua volta referenzia i
file dei singoli font su `fonts.gstatic.com`: è `googleapis.com` a servire solo il
CSS, mai i glifi. Un vincolo letterale che escludesse `gstatic.com` renderebbe Google
Fonts stesso inutilizzabile.

## Opzioni considerate

- **Auto-ospitare i file dei font nel repo**: rispetterebbe alla lettera un dominio
  unico, ma richiede scaricare e versionare file binari, contraddice "nessuna
  libreria esterna" di CLAUDE.md nella sua forma opposta (un asset esterno copiato
  dentro), e non ha un passo di build che li prepari.
- **Foglio di stile di Google Fonts** (scelta): `<link>` verso
  `fonts.googleapis.com/css2`, che è l'unico dominio scritto nell'HTML; il
  caricamento dei file dei glifi da `fonts.gstatic.com` è infrastruttura interna allo
  stesso servizio Google, non un CDN di terze parti scelto da questo repo.
- **Solo font di sistema**: nessuna chiamata di rete, ma non rispetta la richiesta
  esplicita di Archivo/Newsreader/JetBrains Mono dell'issue.

## Decisione

Uso il `<link rel="stylesheet">` verso `fonts.googleapis.com/css2` in `ui/index.html`,
con `preconnect` verso `fonts.googleapis.com` e `fonts.gstatic.com`. Interpreto il
vincolo dell'issue come "nessun CDN di font di terze parti oltre a Google Fonts", dato
che `gstatic.com` è il dominio con cui lo stesso servizio `googleapis.com` serve i
file. Ogni famiglia dichiara un fallback di sistema nello stack CSS (`Archivo, Segoe
UI, Arial, sans-serif`; `Newsreader, Georgia, Times New Roman, serif`; `JetBrains
Mono, Consolas, Courier New, monospace`), così la pagina resta leggibile anche se la
rete verso Google non è disponibile.

## Conseguenze

- Se in futuro serve isolare completamente la pagina da domini Google, va rivista
  auto-ospitando i font: cambio isolato al `<head>` di `index.html`, nessun impatto
  su `lib.js`.
- La leggibilità nei due temi non dipende dal caricamento dei font: i fallback
  dichiarati coprono anche il caso offline.
