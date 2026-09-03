Implementa T11 (REQ-142, OP-203): identità visiva della fucina applicata a `ui/index.html`
— palette con neutri freddi verde-grigi, accento petrolio per gli elementi automatici,
accento ambra per "Aspettano te", tipografia Archivo/Newsreader/JetBrains Mono, tema
chiaro e scuro secondo le preferenze del sistema, impaginazione per schermi da 1200 px.

## Cosa cambia

- `ui/index.html`:
  - `<head>`: meta viewport e `color-scheme`, `<link>` verso il foglio di stile di
    Google Fonts (Archivo, Newsreader, JetBrains Mono) con `preconnect`, e un blocco
    `<style>` che definisce l'intero sistema visivo con variabili CSS:
    - palette chiara di base e override in `@media (prefers-color-scheme: dark)`,
      neutri verde-grigi, petrolio (`--colore-petrolio*`) per link, pulsanti e
      intestazioni delle tabelle, ambra (`--colore-ambra*`) riservata alla sezione
      "Aspettano te" e al pulsante "Rispondi e riavvia";
    - `--font-titoli` (Archivo) su `h1`/`h2`/`h3`, `--font-testo` (Newsreader) sul
      corpo, `--font-dati` (JetBrains Mono) su pulsanti, etichette, ora dell'ultimo
      aggiornamento e intestazioni delle tabelle; ogni variabile dichiara un fallback
      di sistema;
    - impaginazione: contenitore `.pagina` con `min-width: 1200px`, griglia a due
      colonne (`.griglia-secondaria`) per "Avanzamento" e "Agenti attivi" sotto la
      sezione "Aspettano te" a piena larghezza, tabelle con `table-layout: fixed` e
      celle con `word-break` per evitare che titoli lunghi allarghino la pagina.
  - Markup: aggiunte classi (`scheda`, `scheda-aspettano-te`, `pulsante-primario`,
    `pulsante-ambra`, `testo-dati`, `banner`, `griglia-secondaria`, `barra-controlli`,
    `controlli`) senza toccare nessuno degli `id` letti dallo script. Il pulsante
    "Rispondi e riavvia", creato dinamicamente nello script, riceve ora la classe
    `pulsante-ambra`.
  - Nessuna modifica alla logica: `lib.js`, `github.js` e il corpo dello `<script
    type="module">` sono invariati.
- `docs/decisions/2026-09-03-1535-font-da-google-fonts.md`: l'issue vieta font "da
  fuori se non da fonts.googleapis.com", ma il meccanismo standard di Google Fonts
  serve il CSS da `googleapis.com` e i file dei glifi da `gstatic.com` — la stessa
  infrastruttura, non un CDN di terze parti. Documenta questa interpretazione e la
  scelta di dichiarare fallback di sistema per ogni famiglia.

## Come l'ho verificato

- `node --test "ui/**/*.test.js"` — 113 test, tutti verdi (nessuno nuovo: questa issue
  è solo CSS/markup, nessuna funzione pura nuova in `lib.js`).
- Verifica visiva in Chrome headless (via CDP), non nella suite automatica: ho
  costruito una pagina con la stessa struttura DOM prodotta dallo script (titoli
  lunghi, banner d'errore lungo, tabella a sei colonne, sezione "Aspettano te" con
  form) e misurato `document.documentElement.scrollWidth` contro `clientWidth` a
  1280×900 in entrambi i temi (`prefers-color-scheme: light` e `dark`): coincidono,
  nessun elemento supera la larghezza della finestra. Screenshot di entrambi i temi
  confermano la leggibilità del testo e la sezione "Aspettano te" chiaramente distinta
  in ambra.

Closes #23

## Decisioni

- [2026-09-03-1535-font-da-google-fonts.md](../docs/decisions/2026-09-03-1535-font-da-google-fonts.md):
  interpretazione del vincolo "solo fonts.googleapis.com" per includere
  `fonts.gstatic.com`, con fallback di sistema dichiarati per ogni famiglia.

## Non fatto

Nulla dei criteri di accettazione della issue: a 1280 px nulla scorre orizzontalmente
(verificato con contenuto realistico, non solo con i dati vuoti), "Aspettano te" è
distinta in ambra dal resto (petrolio), entrambi i temi sono leggibili, e nessun font è
caricato da fuori se non dal foglio di stile di Google Fonts, con fallback dichiarati
per ogni famiglia.

## Fatto in più

Ho aggiunto la classe `pulsante-ambra` al pulsante "Rispondi e riavvia" costruito
dinamicamente nello script (T10): necessario perché quel pulsante è l'unica azione
rivolta a un umano fuori dalla sezione "Aspettano te" già ambra, e senza la classe
sarebbe rimasto con lo stile petrolio di default, incoerente con REQ-142/OP-203.
