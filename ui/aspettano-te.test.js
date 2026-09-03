import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ultimoCommento, elementoPrCoda, classifica } from "./lib.js";

function leggiFixture(nome) {
  return readFileSync(fileURLToPath(new URL(`./fixtures/${nome}`, import.meta.url)), "utf8");
}

function leggiFixtureJson(nome) {
  return JSON.parse(leggiFixture(nome));
}

// --- ultimoCommento --------------------------------------------------------

test("ultimoCommento su elenco vuoto o assente restituisce null", () => {
  assert.equal(ultimoCommento([]), null);
  assert.equal(ultimoCommento(undefined), null);
});

test("ultimoCommento prende il corpo dell'ultimo commento, non il primo", () => {
  const commenti = [{ body: "primo" }, { body: "secondo" }, { body: "ultimo" }];
  assert.equal(ultimoCommento(commenti), "ultimo");
});

test("ultimoCommento sulla issue 1 di fucina-lab restituisce il commento sui tentativi esauriti", () => {
  const commenti = leggiFixtureJson("issue-1-fucina-lab-commenti.json");
  assert.equal(
    ultimoCommento(commenti),
    "L'agente ha esaurito i 3 tentativi previsti senza chiudere la issue. Serve una persona: probabilmente la issue va riscritta o spezzata.",
  );
});

// --- elementoPrCoda ---------------------------------------------------------

test("elementoPrCoda porta numero, titolo, url e le due sezioni estratte dal corpo", () => {
  const corpo = leggiFixture("pr-body-6.md");
  const pr = {
    number: 6,
    title: "Arrotondamento configurabile per totale_documento",
    html_url: "https://github.com/AleSpirobeep/fucina-lab/pull/6",
    body: corpo,
  };

  const elemento = elementoPrCoda(pr);

  assert.equal(elemento.numero, 6);
  assert.equal(elemento.titolo, "Arrotondamento configurabile per totale_documento");
  assert.equal(elemento.url, "https://github.com/AleSpirobeep/fucina-lab/pull/6");
  assert.ok(elemento.nonFatto.startsWith("- Nessuna funzione di conversione"));
  assert.equal(
    elemento.fattoInPiu,
    "Nulla: solo `listino/prezzi.py`, il nuovo file di test e il nuovo ADR sono\nstati toccati.",
  );
});

test("elementoPrCoda con corpo senza sezioni restituisce nonFatto e fattoInPiu null", () => {
  const pr = {
    number: 42,
    title: "PR senza sezioni",
    html_url: "https://github.com/x/y/pull/42",
    body: "Solo una descrizione, niente intestazioni.",
  };

  const elemento = elementoPrCoda(pr);
  assert.equal(elemento.nonFatto, null);
  assert.equal(elemento.fattoInPiu, null);
});

// --- coda vuota (classifica riusata: bloccate e inRevisione sono la coda) --

test("coda vuota quando nessuna issue è bloccate e nessuna PR è inRevisione", () => {
  const oggi = "2026-09-03T12:00:00.000Z";
  const classificazione = classifica([], [], oggi);
  assert.deepEqual(classificazione.bloccate, []);
  assert.deepEqual(classificazione.inRevisione, []);
});
