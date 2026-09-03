import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseElencoRepo,
  validaRepo,
  validaElencoRepo,
  configurazioneValida,
} from "./lib.js";

test("parseElencoRepo divide per riga e scarta le righe vuote", () => {
  assert.deepEqual(parseElencoRepo("a/b\n\nc/d\n  \n"), ["a/b", "c/d"]);
});

test("parseElencoRepo rifila gli spazi intorno a ogni riga", () => {
  assert.deepEqual(parseElencoRepo("  a/b  \n c/d "), ["a/b", "c/d"]);
});

test("parseElencoRepo su stringa vuota restituisce un elenco vuoto", () => {
  assert.deepEqual(parseElencoRepo(""), []);
});

test("validaRepo accetta il formato proprietario/nome", () => {
  assert.equal(validaRepo("AleSpirobeep/fucina"), true);
});

test("validaRepo rifiuta un valore senza slash", () => {
  assert.equal(validaRepo("fucina"), false);
});

test("validaRepo rifiuta più di uno slash", () => {
  assert.equal(validaRepo("a/b/c"), false);
});

test("validaElencoRepo accetta più repo validi ignorando le righe vuote", () => {
  const risultato = validaElencoRepo("a/b\n\nc/d\n");
  assert.equal(risultato.ok, true);
  assert.deepEqual(risultato.repos, ["a/b", "c/d"]);
});

test("validaElencoRepo rifiuta l'elenco vuoto", () => {
  const risultato = validaElencoRepo("");
  assert.equal(risultato.ok, false);
  assert.deepEqual(risultato.repos, []);
  assert.equal(risultato.errore, "Inserisci almeno un repo.");
});

test("validaElencoRepo rifiuta un testo di sole righe vuote e spazi", () => {
  const risultato = validaElencoRepo("\n   \n\t\n");
  assert.equal(risultato.ok, false);
  assert.equal(risultato.errore, "Inserisci almeno un repo.");
});

test("validaElencoRepo rifiuta una riga con formato non valido", () => {
  const risultato = validaElencoRepo("a/b\nnonvalido\n");
  assert.equal(risultato.ok, false);
  assert.match(risultato.errore, /nonvalido/);
});

test("configurazioneValida è vera con repo validi e token presente", () => {
  assert.equal(
    configurazioneValida({ repoTesto: "a/b", token: "ghp_abc" }),
    true,
  );
});

test("configurazioneValida è falsa con elenco repo vuoto anche se il token c'è", () => {
  assert.equal(configurazioneValida({ repoTesto: "", token: "ghp_abc" }), false);
});

test("configurazioneValida è falsa con token vuoto o di soli spazi", () => {
  assert.equal(configurazioneValida({ repoTesto: "a/b", token: "" }), false);
  assert.equal(configurazioneValida({ repoTesto: "a/b", token: "   " }), false);
});
