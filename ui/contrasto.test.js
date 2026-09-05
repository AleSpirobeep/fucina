import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { luminanza, contrasto, COPPIE_CONTRASTO } from "./lib.js";

// La tavolozza Ardesia, dal contratto specs/006-registro-leggibile/contracts/palette.md.
const TOKEN_ATTESI_CHIARO = {
  "colore-sfondo": "#eef1f4",
  "colore-sfondo-rialzato": "#ffffff",
  "colore-testo": "#141a21",
  "colore-testo-attenuato": "#57626e",
  "colore-bordo": "#c6ced7",
  "colore-accento": "#2a5d9f",
  "colore-accento-scuro": "#1e4676",
  "colore-accento-testo": "#ffffff",
  "colore-ok": "#1d6b52",
  "colore-ambra": "#8a5a00",
  "colore-ambra-sfondo": "#fdefd2",
  "colore-ambra-bordo": "#d6a13c",
  "colore-ambra-testo": "#3a2606",
  "colore-ambra-bottone-testo": "#fff8ee",
  "colore-errore": "#a02a2a",
  "colore-errore-sfondo": "#fadfdf",
};

const TOKEN_ATTESI_SCURO = {
  "colore-sfondo": "#101418",
  "colore-sfondo-rialzato": "#181e25",
  "colore-testo": "#e6ecf2",
  "colore-testo-attenuato": "#98a5b3",
  "colore-bordo": "#2c353f",
  "colore-accento": "#7fb2f0",
  "colore-accento-scuro": "#a9cbf7",
  "colore-accento-testo": "#0a1620",
  "colore-ok": "#63c39b",
  "colore-ambra": "#e8b45f",
  "colore-ambra-sfondo": "#37280f",
  "colore-ambra-bordo": "#8a6520",
  "colore-ambra-testo": "#fbeed4",
  "colore-ambra-bottone-testo": "#2b1c00",
  "colore-errore": "#e89393",
  "colore-errore-sfondo": "#381a1a",
};

const html = readFileSync(fileURLToPath(new URL("./index.html", import.meta.url)), "utf8");

function estraiToken(bloccoCss) {
  const token = {};
  const regex = /--(colore-[a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g;
  let corrispondenza;
  while ((corrispondenza = regex.exec(bloccoCss))) {
    token[corrispondenza[1]] = corrispondenza[2].toLowerCase();
  }
  return token;
}

// Il primo blocco `:root { ... }` del foglio di stile è il tema chiaro; il
// tema scuro sta nel `:root` annidato dentro `@media (prefers-color-scheme: dark)`.
// Leggerli dal file vero, invece che da valori duplicati qui, è ciò che fa
// diventare rosso questo test se qualcuno abbassa un valore nel foglio di stile.
const bloccoChiaro = html.match(/:root\s*\{([^}]*)\}/)[1];
const bloccoScuro = html.match(/prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([^}]*)\}/)[1];

const tokenChiaro = estraiToken(bloccoChiaro);
const tokenScuro = estraiToken(bloccoScuro);

test("luminanza: il nero ha luminanza 0 e il bianco ha luminanza 1", () => {
  assert.equal(luminanza("#000000"), 0);
  assert.equal(luminanza("#ffffff"), 1);
});

test("contrasto: bianco su nero è 21:1, un colore su se stesso è 1:1", () => {
  assert.ok(Math.abs(contrasto("#ffffff", "#000000") - 21) < 0.01);
  assert.equal(contrasto("#8a5a00", "#8a5a00"), 1);
});

test("contrasto: l'ordine degli argomenti non cambia il risultato", () => {
  assert.equal(contrasto("#141a21", "#eef1f4"), contrasto("#eef1f4", "#141a21"));
});

test("tema chiaro: i sedici token coincidono uno a uno con il contratto", () => {
  assert.deepEqual(tokenChiaro, TOKEN_ATTESI_CHIARO);
});

test("tema scuro: i sedici token coincidono uno a uno con il contratto", () => {
  assert.deepEqual(tokenScuro, TOKEN_ATTESI_SCURO);
});

test("le quattordici coppie del contratto superano 4,5:1 in entrambi i temi, con minimo 5,23", () => {
  let minimo = Infinity;

  for (const [a, b] of COPPIE_CONTRASTO) {
    const rapportoChiaro = contrasto(tokenChiaro[a], tokenChiaro[b]);
    const rapportoScuro = contrasto(tokenScuro[a], tokenScuro[b]);

    assert.ok(
      rapportoChiaro >= 4.5,
      `${a} su ${b} (chiaro): ${rapportoChiaro.toFixed(2)} è sotto 4,5`,
    );
    assert.ok(
      rapportoScuro >= 4.5,
      `${a} su ${b} (scuro): ${rapportoScuro.toFixed(2)} è sotto 4,5`,
    );

    minimo = Math.min(minimo, rapportoChiaro, rapportoScuro);
  }

  assert.ok(minimo >= 4.5);
  assert.ok(
    Math.abs(minimo - 5.23) < 0.01,
    `il rapporto peggiore atteso è 5,23, trovato ${minimo.toFixed(3)}`,
  );
});

test("un token spostato verso il colore di sfondo fa scendere il rapporto sotto 4,5", () => {
  // Simula un valore abbassato per errore: l'ambra del tema chiaro spostata
  // verso il grigio del fondo, invece del vero valore del contratto.
  const ambraDegradata = "#c7cdd4";
  assert.ok(contrasto(ambraDegradata, tokenChiaro["colore-sfondo"]) < 4.5);
});

test("il foglio di stile non usa un colore semantico come sfondo di un pulsante d'azione", () => {
  const bloccoStile = html.match(/<style>([\s\S]*)<\/style>/)[1];
  const regolaButton = /(^|\})\s*([^{}]*\bbutton\b[^{}]*)\{([^{}]*)\}/g;
  const tokenVietati = ["colore-ambra", "colore-errore", "colore-ok"];

  let corrispondenza;
  let trovataAlmenoUnaRegola = false;
  while ((corrispondenza = regolaButton.exec(bloccoStile))) {
    trovataAlmenoUnaRegola = true;
    const corpo = corrispondenza[3];
    const sfondo = corpo.match(/background(?:-color)?\s*:\s*var\(--([a-z-]+)\)/);
    if (sfondo) {
      assert.ok(
        !tokenVietati.includes(sfondo[1]),
        `la regola "${corrispondenza[2].trim()}" usa ${sfondo[1]} come sfondo di un pulsante`,
      );
    }
  }
  assert.ok(trovataAlmenoUnaRegola, "nessuna regola per i pulsanti trovata nel foglio di stile");
});

test("il foglio di stile non usa l'accento per indicare uno stato", () => {
  const bloccoStile = html.match(/<style>([\s\S]*)<\/style>/)[1];
  const selettoriDiStato = ["#banner", "#aspettanoTe", "avviso-pm-spento", '[role="alert"]'];
  const regolaGenerica = /([^{}]+)\{([^{}]*)\}/g;

  let corrispondenza;
  while ((corrispondenza = regolaGenerica.exec(bloccoStile))) {
    const selettore = corrispondenza[1].trim();
    const corpo = corrispondenza[2];
    const riguardaUnoStato = selettoriDiStato.some((s) => selettore.includes(s));
    if (riguardaUnoStato) {
      assert.ok(
        !corpo.includes("var(--colore-accento)") && !corpo.includes("var(--colore-accento-scuro)"),
        `la regola "${selettore}" usa l'accento per indicare uno stato`,
      );
    }
  }
});

test("nell'interfaccia non esiste alcun comando di tema", () => {
  assert.doesNotMatch(html, /\btema\b/i);
});
