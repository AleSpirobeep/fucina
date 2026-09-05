T007 (`specs/006-registro-leggibile`): verifica di chiusura sulla pagina completa — nessuna
regressione e nessuna dipendenza sfuggita.

Nuovo file `ui/vincoli-006.test.js` (5 test) che legge il vero `ui/index.html`, sullo stesso
schema di `contrasto.test.js` e `telefono.test.js`:

- nessun `package.json` nel repo (cammina l'albero dei file a partire dalla radice,
  escludendo solo `.git`);
- nessuna cartella `node_modules` nel repo, con la stessa scansione;
- ogni URL `http(s)://` presente in `ui/index.html` appartiene solo ai domini dei caratteri
  (`fonts.googleapis.com`, `fonts.gstatic.com` — vedi
  `docs/decisions/2026-09-03-1541-font-da-google-fonts.md`, che già stabilisce che
  `fonts.gstatic.com` è un dettaglio implementativo del foglio di stile caricato da
  `fonts.googleapis.com`, non un secondo dominio scelto dalla pagina);
- le tre variabili di carattere (`--font-titoli`, `--font-testo`, `--font-dati`) dichiarano
  ancora rispettivamente `"Archivo"`, `"Newsreader"`, `"JetBrains Mono"`;
- il foglio di Google Fonts caricato dal `<link>` richiede le stesse tre famiglie.

Ho verificato a mano, prima di scrivere il test, che nel repo non compaiono già
`package.json` né `node_modules` e che `ui/index.html` non referenzia altri domini oltre ai
due dei caratteri: nessuna correzione residua è stata necessaria in `ui/index.html`, la
pagina rispettava già REQ-550 e REQ-552.

Suite completa: `node --test "ui/**/*.test.js" "template/scripts/**/*.test.js"` →
**360/360 verdi** (355 preesistenti invariati + 5 nuovi).

Closes #96

## Decisioni

Nessun ADR aggiunto: nessuna scelta implementativa non coperta dalla spec. L'interpretazione
di "unico dominio esterno" era già decisa dall'ADR
`2026-09-03-1541-font-da-google-fonts.md`, qui solo verificata con un test.

## Non fatto

Nulla dei criteri di accettazione della issue: `package.json`/`node_modules` assenti, suite
verde, nessun file di test preesistente fra i file modificati di questa PR, le tre famiglie
di caratteri invariate — tutti coperti dal nuovo file di test.

## Fatto in più

Nulla: solo il file di test nuovo indicato dalla issue è stato aggiunto; nessun altro file è
stato toccato.
