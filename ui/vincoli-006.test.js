import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Legge il vero index.html, come contrasto.test.js e telefono.test.js: il test
// verifica la pagina spedita, non una sua copia che potrebbe divergere.
const PERCORSO_INDEX = fileURLToPath(new URL("./index.html", import.meta.url));
const HTML = readFileSync(PERCORSO_INDEX, "utf8");
const BLOCCO_STILE = HTML.match(/<style>([\s\S]*?)<\/style>/)[1];

const RADICE_REPO = fileURLToPath(new URL("../", import.meta.url));

// Domini dei caratteri, gli unici ammessi dalla pagina: fonts.gstatic.com è
// dove Google serve i file .woff2 dichiarati dal foglio di stile di
// fonts.googleapis.com, non un secondo servizio scelto dalla pagina — vedi
// docs/decisions/2026-09-03-1541-font-da-google-fonts.md.
const DOMINI_CARATTERI = ["fonts.googleapis.com", "fonts.gstatic.com"];

function elencaVoci(dir) {
  const voci = [];
  for (const voce of readdirSync(dir, { withFileTypes: true })) {
    if (voce.name === ".git") continue;
    const percorso = path.join(dir, voce.name);
    voci.push({ nome: voce.name, percorso, directory: voce.isDirectory() });
    if (voce.isDirectory()) {
      voci.push(...elencaVoci(percorso));
    }
  }
  return voci;
}

const VOCI_REPO = elencaVoci(RADICE_REPO);

test("nel repo non compare alcun package.json", () => {
  const trovati = VOCI_REPO.filter((voce) => !voce.directory && voce.nome === "package.json");
  assert.deepEqual(
    trovati.map((voce) => path.relative(RADICE_REPO, voce.percorso)),
    [],
  );
});

test("nel repo non compare alcuna cartella node_modules", () => {
  const trovate = VOCI_REPO.filter((voce) => voce.directory && voce.nome === "node_modules");
  assert.deepEqual(
    trovate.map((voce) => path.relative(RADICE_REPO, voce.percorso)),
    [],
  );
});

test("l'unico dominio esterno referenziato dalla pagina è quello dei caratteri", () => {
  const domini = [...HTML.matchAll(/https?:\/\/([a-zA-Z0-9.-]+)/g)].map((m) => m[1]);
  assert.ok(domini.length > 0, "nessun dominio esterno trovato: il test non verifica nulla");
  for (const dominio of domini) {
    assert.ok(
      DOMINI_CARATTERI.includes(dominio),
      `dominio esterno inatteso referenziato dalla pagina: ${dominio}`,
    );
  }
});

test("le tre famiglie di caratteri dichiarate sono ancora Archivo, Newsreader e JetBrains Mono", () => {
  assert.match(BLOCCO_STILE, /--font-titoli:\s*"Archivo"/);
  assert.match(BLOCCO_STILE, /--font-testo:\s*"Newsreader"/);
  assert.match(BLOCCO_STILE, /--font-dati:\s*"JetBrains Mono"/);
});

test("il foglio di Google Fonts caricato dichiara le stesse tre famiglie", () => {
  const link = HTML.match(/<link[^>]+fonts\.googleapis\.com\/css2\?([^"]+)"/);
  assert.ok(link, "nessun <link> verso fonts.googleapis.com/css2 trovato");
  const query = link[1];
  assert.match(query, /family=Archivo/);
  assert.match(query, /family=Newsreader/);
  assert.match(query, /family=JetBrains\+Mono/);
});
