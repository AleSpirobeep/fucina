import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Legge il vero index.html: REQ-530, 531, 532 riguardano il foglio di stile
// spedito, non una sua copia che potrebbe divergere. Come nota il piano della
// spec 006, lo scorrimento orizzontale vero si verifica restringendo una
// finestra di un browser, non dalla CI: qui si controlla ciò che la CI può
// controllare — che le regole necessarie a non produrlo esistano nel foglio
// di stile — non che il rendering finale sia corretto.
const PERCORSO_INDEX = fileURLToPath(new URL("./index.html", import.meta.url));
const HTML = readFileSync(PERCORSO_INDEX, "utf8");
const BLOCCO_STILE = HTML.match(/<style>([\s\S]*?)<\/style>/)[1];

// Scansiona tutte le regole del foglio di stile. La graffa di chiusura di una
// media query resta orfana rispetto a questo pattern e viene saltata da sola:
// non serve toglierla prima, come già in contrasto.test.js.
function tutteLeRegole(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selettore, dichiarazioni]) => ({
    selettore: selettore.trim(),
    dichiarazioni,
  }));
}

function regolaPerSelettore(css, selettoreCercato) {
  return tutteLeRegole(css).find((regola) =>
    regola.selettore.split(",").map((s) => s.trim()).includes(selettoreCercato),
  );
}

function blocchiMediaQuery(css) {
  return [...css.matchAll(/@media\s*\(([^)]+)\)\s*\{/g)].map((corrispondenza) => {
    const inizio = corrispondenza.index + corrispondenza[0].length;
    let profondita = 1;
    let fine = inizio;
    while (profondita > 0 && fine < css.length) {
      if (css[fine] === "{") profondita += 1;
      if (css[fine] === "}") profondita -= 1;
      fine += 1;
    }
    return { condizione: corrispondenza[1].trim(), corpo: css.slice(inizio, fine - 1) };
  });
}

// Il lookbehind negativo evita che cercare "width" trovi "max-width" o
// "min-width": senza, la prima occorrenza testuale vincerebbe per caso
// invece che per il nome giusto della proprietà.
function valoreDichiarazione(dichiarazioni, proprieta) {
  const corrispondenza = dichiarazioni.match(new RegExp(`(?<![\\w-])${proprieta}:\\s*([^;]+);`));
  return corrispondenza ? corrispondenza[1].trim() : null;
}

// Converte in pixel un valore CSS in px o rem (radice a 16px, come in tutto
// il foglio di stile: nessun'altra unità è in uso).
function inPixel(valoreCss) {
  if (valoreCss.endsWith("rem")) return parseFloat(valoreCss) * 16;
  if (valoreCss.endsWith("px")) return parseFloat(valoreCss);
  throw new Error(`unità non gestita: ${valoreCss}`);
}

function larghezzaMassimaBreakpoint(condizione) {
  const corrispondenza = condizione.match(/max-width:\s*([\d.]+)(px|rem)/);
  assert.ok(corrispondenza, `condizione senza max-width: "${condizione}"`);
  return inPixel(`${corrispondenza[1]}${corrispondenza[2]}`);
}

test("il corpo della pagina non ha una larghezza minima fissa", () => {
  const regolaBody = regolaPerSelettore(BLOCCO_STILE, "body");
  assert.equal(
    valoreDichiarazione(regolaBody.dichiarazioni, "min-width"),
    null,
    "una min-width sul body forza lo scorrimento orizzontale sotto quella soglia",
  );
});

test("i pulsanti hanno un'area toccabile di almeno 44×44 px", () => {
  const regolaButton = regolaPerSelettore(BLOCCO_STILE, "button");
  const altezzaMinima = valoreDichiarazione(regolaButton.dichiarazioni, "min-height");
  const larghezzaMinima = valoreDichiarazione(regolaButton.dichiarazioni, "min-width");
  assert.ok(altezzaMinima, "manca min-height sul selettore button");
  assert.ok(larghezzaMinima, "manca min-width sul selettore button");
  assert.ok(inPixel(altezzaMinima) >= 44, `min-height ${altezzaMinima} è sotto i 44 px`);
  assert.ok(inPixel(larghezzaMinima) >= 44, `min-width ${larghezzaMinima} è sotto i 44 px`);
});

test("esiste una soglia sotto la quale la griglia secondaria diventa una sola colonna", () => {
  const blocchi = blocchiMediaQuery(BLOCCO_STILE);
  const bloccoGriglia = blocchi.find((b) => /\.griglia-secondaria\s*\{/.test(b.corpo));
  assert.ok(bloccoGriglia, "nessuna media query tocca .griglia-secondaria");

  const soglia = larghezzaMassimaBreakpoint(bloccoGriglia.condizione);
  assert.ok(soglia >= 360, `la soglia ${soglia}px non copre gli schermi da 360 px in su`);

  const regolaGriglia = tutteLeRegole(bloccoGriglia.corpo).find((r) => r.selettore === ".griglia-secondaria");
  const colonne = valoreDichiarazione(regolaGriglia.dichiarazioni, "grid-template-columns");
  // Toglie il contenuto delle parentesi (es. "minmax(0, 1fr)") prima di
  // contare le colonne separate da spazio, altrimenti la virgola interna a
  // un singolo minmax() sembrerebbe un secondo binario.
  const tracce = colonne.replace(/\([^)]*\)/g, "x").trim().split(/\s+/);
  assert.equal(tracce.length, 1, `"${colonne}" descrive più di una colonna`);
});

test("i conteggi dell'avanzamento vanno a capo invece di scorrere", () => {
  const regola = regolaPerSelettore(BLOCCO_STILE, ".conteggi-avanzamento");
  assert.equal(valoreDichiarazione(regola.dichiarazioni, "flex-wrap"), "wrap");
});

test("il titolo di un repo eredita l'a-capo di emergenza del corpo pagina", () => {
  const regolaBody = regolaPerSelettore(BLOCCO_STILE, "body");
  assert.equal(valoreDichiarazione(regolaBody.dichiarazioni, "overflow-wrap"), "anywhere");

  // overflow-wrap è una proprietà ereditata: perché il titolo del repo (h3)
  // ne benefici davvero, nessuna regola più specifica deve spegnerla o
  // impedire l'a-capo con un nowrap.
  for (const selettore of ["h3", "section"]) {
    const regola = regolaPerSelettore(BLOCCO_STILE, selettore);
    if (!regola) continue;
    assert.equal(valoreDichiarazione(regola.dichiarazioni, "overflow-wrap"), null);
    assert.notEqual(valoreDichiarazione(regola.dichiarazioni, "white-space"), "nowrap");
  }
});

test("i campi della configurazione non superano la larghezza dello schermo", () => {
  const regola = regolaPerSelettore(BLOCCO_STILE, "textarea");
  assert.ok(regola, "nessuna regola trovata per textarea");
  assert.equal(valoreDichiarazione(regola.dichiarazioni, "width"), "100%");
});
