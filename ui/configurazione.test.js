import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseElencoRepo,
  validaRepo,
  validaElencoRepo,
  configurazioneValida,
} from "./lib.js";

test("parseElencoRepo ignora righe vuote e spazi ai bordi", () => {
  assert.deepEqual(parseElencoRepo("a/b\n\n  c/d  \n\n"), ["a/b", "c/d"]);
});

test("parseElencoRepo su testo vuoto restituisce un array vuoto", () => {
  assert.deepEqual(parseElencoRepo(""), []);
});

test("validaRepo accetta il formato proprietario/nome", () => {
  assert.equal(validaRepo("AleSpirobeep/fucina"), true);
});

test("validaRepo rifiuta una riga senza slash", () => {
  assert.equal(validaRepo("fucina"), false);
});

test("validaRepo rifiuta più di uno slash", () => {
  assert.equal(validaRepo("a/b/c"), false);
});

test("validaRepo rifiuta spazi interni", () => {
  assert.equal(validaRepo("a b/c"), false);
});

test("validaElencoRepo accetta un elenco valido ignorando le righe vuote", () => {
  const risultato = validaElencoRepo("a/b\n\nc/d\n");
  assert.equal(risultato.ok, true);
  assert.deepEqual(risultato.repos, ["a/b", "c/d"]);
});

test("validaElencoRepo segnala le righe non valide", () => {
  const risultato = validaElencoRepo("a/b\nnonvalida\n");
  assert.equal(risultato.ok, false);
  assert.deepEqual(risultato.nonValide, ["nonvalida"]);
});

test("configurazioneValida richiede un token", () => {
  assert.equal(configurazioneValida({ repoTesto: "a/b", token: "" }), false);
});

test("configurazioneValida richiede un elenco repo valido", () => {
  assert.equal(
    configurazioneValida({ repoTesto: "nonvalida", token: "abc" }),
    false,
  );
});

test("configurazioneValida è vera con repo e token validi", () => {
  assert.equal(
    configurazioneValida({ repoTesto: "a/b", token: "abc" }),
    true,
  );
});
