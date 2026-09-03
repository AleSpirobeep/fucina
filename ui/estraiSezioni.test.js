import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { estraiSezioni } from "./lib.js";

function leggiFixture(nome) {
  return readFileSync(fileURLToPath(new URL(`./fixtures/${nome}`, import.meta.url)), "utf8");
}

test("corpo della PR #6 di fucina-lab: sezioni in ordine Decisioni, Non fatto, Fatto in più", () => {
  const corpo = leggiFixture("pr-body-6.md");
  const sezioni = estraiSezioni(corpo);

  assert.ok(sezioni.decisioni.startsWith("- `docs/decisions/2026-09-02-1650-arrotondamento-documento-configurabile.md`:"));
  assert.ok(sezioni.decisioni.endsWith("rispetto a prima."));

  assert.ok(sezioni.nonFatto.startsWith("- Nessuna funzione di conversione"));
  assert.ok(sezioni.nonFatto.endsWith("criteri di accettazione."));

  assert.equal(
    sezioni.fattoInPiu,
    "Nulla: solo `listino/prezzi.py`, il nuovo file di test e il nuovo ADR sono\nstati toccati.",
  );
});

test("corpo della PR #9 di fucina-lab: Closes #8 a metà corpo non tocca le sezioni, coda finale esclusa", () => {
  const corpo = leggiFixture("pr-body-9.md");
  const sezioni = estraiSezioni(corpo);

  assert.ok(sezioni.decisioni.startsWith("Nessun ADR:"));
  assert.ok(sezioni.decisioni.endsWith("di design."));

  assert.ok(sezioni.nonFatto.startsWith("Nulla: l'unica richiesta"));
  assert.ok(sezioni.nonFatto.endsWith("ed è stato fatto."));

  assert.equal(
    sezioni.fattoInPiu,
    "Nulla: ho toccato solo `listino/prezzi.py`, il file indicato dall'issue.",
  );
});

test("corpo senza sezioni: tutte e tre le chiavi sono null", () => {
  const corpo = "Solo una descrizione, senza nessuna delle tre intestazioni.\n\nCloses #12\n";
  assert.deepEqual(estraiSezioni(corpo), { nonFatto: null, fattoInPiu: null, decisioni: null });
});

test("sezione con solo 'Nulla' è restituita come testo, non come null", () => {
  const corpo = "## Fatto in più\n\nNulla\n\n## Non fatto\n\nNulla\n";
  const sezioni = estraiSezioni(corpo);
  assert.equal(sezioni.fattoInPiu, "Nulla");
  assert.equal(sezioni.nonFatto, "Nulla");
  assert.equal(sezioni.decisioni, null);
});

test("intestazioni in ordine sparso vengono tutte riconosciute", () => {
  const corpo = "## Fatto in più\n\nTesto A\n\n## Decisioni\n\nTesto B\n\n## Non fatto\n\nTesto C\n";
  const sezioni = estraiSezioni(corpo);
  assert.equal(sezioni.fattoInPiu, "Testo A");
  assert.equal(sezioni.decisioni, "Testo B");
  assert.equal(sezioni.nonFatto, "Testo C");
});

test("un'intestazione di livello 3 dentro una sezione non la interrompe", () => {
  const corpo = "## Decisioni\n\nTesto prima.\n\n### Dettaglio\n\nTesto dopo, stessa sezione.\n\n## Non fatto\n\nAltro.\n";
  const sezioni = estraiSezioni(corpo);
  assert.equal(sezioni.decisioni, "Testo prima.\n\n### Dettaglio\n\nTesto dopo, stessa sezione.");
});

test("Closes #N e la riga 'Generated with Claude Code' finali vengono esclusi dall'ultima sezione", () => {
  const corpo = "## Fatto in più\n\nSolo questo file.\n\nGenerated with Claude Code https://claude.ai/code\n\nCloses #20\n";
  const sezioni = estraiSezioni(corpo);
  assert.equal(sezioni.fattoInPiu, "Solo questo file.");
});
