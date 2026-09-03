Applica alla dashboard del Registro l'identità visiva della fucina (T11): palette a
neutri freddi verde-grigi con tema chiaro/scuro secondo `prefers-color-scheme`,
accento petrolio per gli elementi automatici, accento ambra per "Aspettano te" e per
il pulsante "Rispondi e riavvia", tipografia Archivo/Newsreader/JetBrains Mono,
impaginazione per schermi da 1200 px in su.

## Cosa ho fatto

Tutto in `ui/index.html` (blocco `<style>`, `<link>` ai font, e due piccoli tocchi di
markup), senza toccare `lib.js`, `github.js` o la logica dello script:

- **Palette**: variabili CSS per neutri freddi verde-grigi, ridefinite sotto
  `@media (prefers-color-scheme: dark)`. Accento petrolio (`--colore-accento`) su
  link, pulsanti e intestazioni di tabella. Accento ambra riservato a `#aspettanoTe`
  (sfondo, bordo sinistro spesso, testo) e al pulsante "Rispondi e riavvia"
  (`.rispondi-form button`).
- **Tipografia**: Archivo per i titoli, Newsreader per il testo, JetBrains Mono per
  tabelle/etichette/orari, caricati da un unico foglio di stile su
  `fonts.googleapis.com`, con fallback di sistema dichiarati in ogni variabile
  `--font-*`. Motivazione dell'interpretazione del vincolo sui font (i file binari
  arrivano comunque da `fonts.gstatic.com`, inevitabile per chiunque usi Google
  Fonts) in
  [`docs/decisions/2026-09-03-1541-font-da-google-fonts.md`](../docs/decisions/2026-09-03-1541-font-da-google-fonts.md).
- **Impaginazione**: `body` con `min-width: 1200px` e `max-width: 1400px`; "Avanzamento"
  e "Agenti attivi" in un contenitore `.griglia-secondaria` (`grid-template-columns:
  minmax(0, 2fr) minmax(0, 1fr)`) sotto "Aspettano te" a piena larghezza; tabelle con
  `table-layout: fixed`.
- **Correzione dello scroll orizzontale con token lunghi senza spazi** (richiesta del
  PM dopo la revisione della PR #41, chiusa): i figli diretti di `.griglia-secondaria`
  hanno `min-width: 0` e le tracce della griglia sono `minmax(0, …)`, così non possono
  più superare la loro colonna; `overflow-wrap: anywhere` su `body` (proprietà
  ereditata) fa andare a capo qualunque token senza spazi in liste, paragrafi, celle
  di tabella e link generati dallo script — a differenza di `overflow-wrap:
  break-word`, `anywhere` riduce anche la dimensione minima automatica usata da
  griglia/tabelle nel calcolo del layout, che è la causa dello scroll segnalato.

## Come l'ho verificato

- `node --test "ui/**/*.test.js"` → 113/113 verdi (nessun test nuovo: task solo
  CSS/markup, nessuna funzione pura nuova in `lib.js`).
- Verifica visiva in Chromium headless (via CDP, `Emulation.setDeviceMetricsOverride`
  1280×900 e `Emulation.setEmulatedMedia` per i due temi) su una pagina di prova che
  riproduce il markup reale con contenuto realistico e con un token di 100 caratteri
  senza spazi (tipo nome di branch) inserito in ogni punto indicato dal PM: banner
  d'errore, titolo e commento di una issue `needs-human` in "Aspettano te", sezioni
  "Non fatto"/"Fatto in più" di una PR `needs-review`, ogni cella della tabella di
  "Avanzamento" (sei colonne), titolo di un run `dev-agent` in "Agenti attivi". In
  entrambi i temi `document.documentElement.scrollWidth` coincide con `clientWidth`
  (1280 = 1280): nessuno scroll orizzontale. Controllate anche a schermo le
  screenshot dei due temi: "Aspettano te" resta chiaramente distinta in ambra, il
  contrasto testo/sfondo del pulsante "Rispondi e riavvia" è leggibile in entrambi.

Closes #23

## Decisioni

- [2026-09-03-1541-font-da-google-fonts.md](../docs/decisions/2026-09-03-1541-font-da-google-fonts.md):
  il vincolo "solo `fonts.googleapis.com`" si applica al dominio dichiarato dalla
  pagina (il `<link>` del foglio di stile); `fonts.gstatic.com`, da cui Google serve
  i file dei font, non è un dominio scelto dalla pagina ma un dettaglio implementativo
  inevitabile di Google Fonts.

## Non fatto

Nulla dei criteri di accettazione della issue, incluso quello aggiunto dal PM dopo la
revisione della PR #41: a 1280 px nulla scorre orizzontalmente anche con titoli,
commenti e URL senza spazi lunghi 100 caratteri, in ogni sezione (verificato sopra).

## Fatto in più

Ho aggiunto la classe `rispondi-form` al contenitore del modulo "Rispondi e riavvia"
in `costruisciFormRispondiERiavvia` (`ui/index.html`), per poterlo selezionare in CSS
senza toccare `lib.js`: presentazione, non logica.
