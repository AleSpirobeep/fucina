import { test } from "node:test";
import assert from "node:assert/strict";
import { classifica, vociAvanzamento, testoConteggioAvanzamento } from "./lib.js";

const OGGI = "2026-09-05T12:00:00.000Z";

function issue(numero, { stato = "open", label, chiusaGiorniFa } = {}) {
  const item = {
    number: numero,
    title: `issue ${numero}`,
    html_url: `https://github.com/x/y/issues/${numero}`,
    state: stato,
    labels: label ? [{ name: label }] : [],
  };
  if (stato === "closed" && chiusaGiorniFa !== undefined) {
    const chiusaMs = new Date(OGGI).getTime() - chiusaGiorniFa * 24 * 60 * 60 * 1000;
    item.closed_at = new Date(chiusaMs).toISOString();
  }
  return item;
}

test("vociAvanzamento restituisce sette voci, le sei colonne più i task in coda", () => {
  const voci = vociAvanzamento(classifica([], [], OGGI), 0);
  assert.deepEqual(
    voci.map((v) => v.chiave),
    ["backlog", "pronte", "inLavorazione", "inRevisione", "bloccate", "fatte", "inCoda"],
  );
  assert.deepEqual(
    voci.map((v) => v.etichetta),
    ["Backlog", "Pronte", "In lavorazione", "In revisione", "Bloccate", "Fatte", "In coda"],
  );
});

test("con sette issue chiuse di recente e tre in coda: sette conteggi, nessun titolo", () => {
  const chiuse = Array.from({ length: 7 }, (_, i) => issue(i + 1, { stato: "closed", chiusaGiorniFa: 1 }));
  const voci = vociAvanzamento(classifica(chiuse, [], OGGI), 3);

  assert.equal(voci.length, 7);
  assert.equal(voci.find((v) => v.chiave === "fatte").conteggio, 7);
  assert.equal(voci.find((v) => v.chiave === "inCoda").conteggio, 3);
  for (const voce of voci) {
    assert.equal("elementi" in voce, false);
    assert.equal("titolo" in voce, false);
  }
});

test("il conteggio del task in coda arriva dal parametro, non dalla classificazione", () => {
  const voci = vociAvanzamento(classifica([], [], OGGI), 5);
  assert.equal(voci.find((v) => v.chiave === "inCoda").conteggio, 5);
});

test("una voce a conteggio zero non è apribile", () => {
  const voci = vociAvanzamento(classifica([], [], OGGI), 0);
  for (const voce of voci) {
    assert.equal(voce.conteggio, 0);
    assert.equal(voce.apribile, false);
  }
});

test("una voce con conteggio maggiore di zero è apribile", () => {
  const issues = [issue(1, { stato: "closed", chiusaGiorniFa: 1 })];
  const voci = vociAvanzamento(classifica(issues, [], OGGI), 2);
  assert.equal(voci.find((v) => v.chiave === "fatte").apribile, true);
  assert.equal(voci.find((v) => v.chiave === "inCoda").apribile, true);
});

test("vociAvanzamento non fa richieste di rete: è pura sui dati passati", () => {
  const globaleFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("vociAvanzamento non deve chiamare la rete");
  };
  try {
    vociAvanzamento(classifica([issue(1)], [], OGGI), 1);
  } finally {
    globalThis.fetch = globaleFetch;
  }
});

// --- testoConteggioAvanzamento -------------------------------------------

test("testoConteggioAvanzamento compone etichetta e numero", () => {
  assert.equal(testoConteggioAvanzamento({ etichetta: "Fatte", conteggio: 7 }), "Fatte 7");
  assert.equal(testoConteggioAvanzamento({ etichetta: "Backlog", conteggio: 0 }), "Backlog 0");
});
