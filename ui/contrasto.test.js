import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { luminanza, contrasto, COPPIE_CONTRASTO } from "./lib.js";

// Legge il vero index.html: il test verifica il foglio di stile spedito, non
// una sua copia che potrebbe divergere.
const PERCORSO_INDEX = fileURLToPath(new URL("./index.html", import.meta.url));
const HTML = readFileSync(PERCORSO_INDEX, "utf8");
const BLOCCO_STILE = HTML.match(/<style>([\s\S]*?)<\/style>/)[1];

function estraiToken(bloccoRoot) {
  const token = {};
  const regex = /--(colore-[a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g;
  let corrispondenza;
  while ((corrispondenza = regex.exec(bloccoRoot))) {
    token[`--${corrispondenza[1]}`] = corrispondenza[2];
  }
  return token;
}

function bloccoRootChiaro(css) {
  return css.match(/:root\s*\{([^}]*)\}/)[1];
}

function bloccoRootScuro(css) {
  return css.match(/prefers-color-scheme:\s*dark[^{]*\{\s*:root\s*\{([^}]*)\}/)[1];
}

// Scansiona tutte le regole del foglio di stile senza saltarne nessuna: il
// gruppo di apertura non consuma la graffa di chiusura della regola
// precedente (a differenza di un pattern con `(^|\})` senza flag `m`, che
// visita una regola sì e una no).
function tutteLeRegole(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selettore, dichiarazioni]) => ({
    selettore: selettore.trim(),
    dichiarazioni,
  }));
}

const TOKEN_CHIARO = estraiToken(bloccoRootChiaro(BLOCCO_STILE));
const TOKEN_SCURO = estraiToken(bloccoRootScuro(BLOCCO_STILE));

const TOKEN_ATTESI_CHIARO = {
  "--colore-sfondo": "#eef1f4",
  "--colore-sfondo-rialzato": "#ffffff",
  "--colore-testo": "#141a21",
  "--colore-testo-attenuato": "#57626e",
  "--colore-bordo": "#c6ced7",
  "--colore-accento": "#2a5d9f",
  "--colore-accento-scuro": "#1e4676",
  "--colore-accento-testo": "#ffffff",
  "--colore-ok": "#1d6b52",
  "--colore-ambra": "#8a5a00",
  "--colore-ambra-sfondo": "#fdefd2",
  "--colore-ambra-bordo": "#d6a13c",
  "--colore-ambra-testo": "#3a2606",
  "--colore-ambra-bottone-testo": "#fff8ee",
  "--colore-errore": "#a02a2a",
  "--colore-errore-sfondo": "#fadfdf",
};

const TOKEN_ATTESI_SCURO = {
  "--colore-sfondo": "#101418",
  "--colore-sfondo-rialzato": "#181e25",
  "--colore-testo": "#e6ecf2",
  "--colore-testo-attenuato": "#98a5b3",
  "--colore-bordo": "#2c353f",
  "--colore-accento": "#7fb2f0",
  "--colore-accento-scuro": "#a9cbf7",
  "--colore-accento-testo": "#0a1620",
  "--colore-ok": "#63c39b",
  "--colore-ambra": "#e8b45f",
  "--colore-ambra-sfondo": "#37280f",
  "--colore-ambra-bordo": "#8a6520",
  "--colore-ambra-testo": "#fbeed4",
  "--colore-ambra-bottone-testo": "#2b1c00",
  "--colore-errore": "#e89393",
  "--colore-errore-sfondo": "#381a1a",
};

test("i sedici token del tema chiaro coincidono con il contratto", () => {
  assert.deepEqual(TOKEN_CHIARO, TOKEN_ATTESI_CHIARO);
});

test("i sedici token del tema scuro coincidono con il contratto", () => {
  assert.deepEqual(TOKEN_SCURO, TOKEN_ATTESI_SCURO);
});

test("luminanza calcola la luminanza relativa WCAG 2.1 dei colori estremi", () => {
  assert.equal(luminanza("#ffffff"), 1);
  assert.equal(luminanza("#000000"), 0);
});

test("contrasto tra bianco e nero è 21:1", () => {
  assert.ok(Math.abs(contrasto("#ffffff", "#000000") - 21) < 0.001);
});

test("contrasto è simmetrico rispetto all'ordine degli argomenti", () => {
  assert.equal(contrasto("#eef1f4", "#141a21"), contrasto("#141a21", "#eef1f4"));
});

test("le quattordici coppie superano 4,5:1 nel tema chiaro", () => {
  for (const coppia of COPPIE_CONTRASTO) {
    const rapporto = contrasto(TOKEN_CHIARO[coppia.a], TOKEN_CHIARO[coppia.b]);
    assert.ok(rapporto >= 4.5, `${coppia.etichetta} (chiaro): ${rapporto} < 4,5`);
  }
});

test("le quattordici coppie superano 4,5:1 nel tema scuro", () => {
  for (const coppia of COPPIE_CONTRASTO) {
    const rapporto = contrasto(TOKEN_SCURO[coppia.a], TOKEN_SCURO[coppia.b]);
    assert.ok(rapporto >= 4.5, `${coppia.etichetta} (scuro): ${rapporto} < 4,5`);
  }
});

test("il rapporto minimo fra tutte le coppie nei due temi è 5,23", () => {
  const rapporti = [];
  for (const coppia of COPPIE_CONTRASTO) {
    rapporti.push(contrasto(TOKEN_CHIARO[coppia.a], TOKEN_CHIARO[coppia.b]));
    rapporti.push(contrasto(TOKEN_SCURO[coppia.a], TOKEN_SCURO[coppia.b]));
  }
  const minimo = Math.min(...rapporti);
  assert.ok(Math.abs(minimo - 5.23) < 0.01, `minimo trovato ${minimo}, atteso 5,23`);
});

test("abbassando di proposito un valore il test scende sotto soglia", () => {
  // `--colore-ambra` del tema chiaro degradato verso il grigio del bordo:
  // la coppia `ambra su sfondo` (5,23 nel contratto) crolla sotto 4,5.
  const degradato = "#c7cdd4";
  const rapporto = contrasto(degradato, TOKEN_CHIARO["--colore-sfondo"]);
  assert.ok(rapporto < 4.5, `il valore degradato dovrebbe scendere sotto soglia, era ${rapporto}`);
});

test("l'accento è usato solo per link e pulsanti, mai per indicare uno stato", () => {
  const regoleConAccento = tutteLeRegole(BLOCCO_STILE).filter((regola) =>
    /var\(--colore-accento(-scuro)?\)/.test(regola.dichiarazioni),
  );
  assert.ok(regoleConAccento.length > 0, "nessuna regola usa l'accento: il test non verifica nulla");

  for (const regola of regoleConAccento) {
    const partiSelettore = regola.selettore.split(",").map((s) => s.trim());
    for (const parte of partiSelettore) {
      const eAzione = /\bbutton\b/.test(parte) || /\ba(:[\w-]+)?$/.test(parte);
      assert.ok(eAzione, `selettore "${parte}" usa l'accento ma non è un link o un pulsante`);
    }
  }
});

test("i tre colori semantici non sono sfondo di un pulsante d'azione", () => {
  const regoleButton = tutteLeRegole(BLOCCO_STILE).filter((regola) => /\bbutton\b/.test(regola.selettore));
  assert.ok(regoleButton.length >= 2, "attese almeno due regole su selettori con 'button'");

  for (const regola of regoleButton) {
    assert.doesNotMatch(
      regola.dichiarazioni,
      /background(-color)?:\s*var\(--colore-(ok|ambra|errore)\)/,
      `la regola "${regola.selettore}" usa un colore semantico come sfondo`,
    );
  }
});

test("non esiste alcun comando di tema nell'interfaccia", () => {
  assert.doesNotMatch(HTML, /\btema\b/i);
  assert.doesNotMatch(HTML, /prefers-color-scheme["'\s]*:\s*["']?light/i);
});
