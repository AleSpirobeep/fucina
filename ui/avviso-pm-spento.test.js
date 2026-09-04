import { test } from "node:test";
import assert from "node:assert/strict";
import { lavoroInAttesa, avvisoPmSpento } from "./lib.js";

function issue(numero, { stato = "open", labels = [] } = {}) {
  return {
    number: numero,
    title: `issue ${numero}`,
    html_url: `https://github.com/x/y/issues/${numero}`,
    state: stato,
    labels: labels.map((nome) => ({ name: nome })),
  };
}

function pr(numero, { stato = "open", labels = [] } = {}) {
  return {
    number: numero,
    title: `pr ${numero}`,
    html_url: `https://github.com/x/y/pull/${numero}`,
    state: stato,
    labels: labels.map((nome) => ({ name: nome })),
  };
}

// --- lavoroInAttesa ------------------------------------------------------

test("lavoroInAttesa: nessun lavoro dà tutto vuoto e totale zero", () => {
  const r = lavoroInAttesa([], []);
  assert.deepEqual(r.prDaRevisionare, []);
  assert.deepEqual(r.domande, []);
  assert.deepEqual(r.inCoda, []);
  assert.equal(r.totale, 0);
});

test("lavoroInAttesa: una PR needs-review finisce in prDaRevisionare e viene nominata", () => {
  const r = lavoroInAttesa([], [pr(1, { labels: ["needs-review"] })]);
  assert.deepEqual(
    r.prDaRevisionare.map((p) => p.title),
    ["pr 1"],
  );
  assert.equal(r.totale, 1);
});

test("lavoroInAttesa: una PR needs-review chiusa non conta", () => {
  const r = lavoroInAttesa([], [pr(2, { stato: "closed", labels: ["needs-review"] })]);
  assert.equal(r.prDaRevisionare.length, 0);
});

test("lavoroInAttesa: issue con needs-human finisce in domande", () => {
  const r = lavoroInAttesa([issue(3, { labels: ["needs-human"] })], []);
  assert.deepEqual(
    r.domande.map((i) => i.number),
    [3],
  );
});

test("lavoroInAttesa: issue con needs-human e rapporto-pm non viene contata", () => {
  const r = lavoroInAttesa([issue(4, { labels: ["needs-human", "rapporto-pm"] })], []);
  assert.equal(r.domande.length, 0);
  assert.equal(r.totale, 0);
});

test("lavoroInAttesa: issue con in-coda finisce in inCoda", () => {
  const r = lavoroInAttesa([issue(5, { labels: ["in-coda"] })], []);
  assert.deepEqual(
    r.inCoda.map((i) => i.number),
    [5],
  );
});

test("lavoroInAttesa: issue chiusa con in-coda non conta", () => {
  const r = lavoroInAttesa([issue(6, { stato: "closed", labels: ["in-coda"] })], []);
  assert.equal(r.inCoda.length, 0);
});

test("lavoroInAttesa: le PR mischiate nell'elenco issue non contano", () => {
  const prMischiata = issue(7, { labels: ["in-coda"] });
  prMischiata.pull_request = { url: "https://api.github.com/repos/x/y/pulls/7" };
  const r = lavoroInAttesa([prMischiata], []);
  assert.equal(r.inCoda.length, 0);
});

test("lavoroInAttesa: totale somma le tre categorie", () => {
  const r = lavoroInAttesa(
    [issue(8, { labels: ["needs-human"] }), issue(9, { labels: ["in-coda"] })],
    [pr(10, { labels: ["needs-review"] })],
  );
  assert.equal(r.totale, 3);
});

// --- avvisoPmSpento --------------------------------------------------------

test("avvisoPmSpento: PM spento con lavoro in attesa dà l'avviso", () => {
  const lavoro = lavoroInAttesa([], [pr(1, { labels: ["needs-review"] })]);
  const avviso = avvisoPmSpento("spento", lavoro);
  assert.ok(avviso);
  assert.equal(avviso.totale, 1);
  assert.deepEqual(
    avviso.prDaRevisionare.map((p) => p.title),
    ["pr 1"],
  );
});

test("avvisoPmSpento: PM acceso non dà l'avviso qualunque sia il lavoro in attesa", () => {
  const lavoro = lavoroInAttesa(
    [],
    [pr(1, { labels: ["needs-review"] }), pr(2, { labels: ["needs-review"] }), pr(3, { labels: ["needs-review"] })],
  );
  assert.equal(avvisoPmSpento("acceso", lavoro), null);
});

test("avvisoPmSpento: PM spento e nulla in attesa non dà l'avviso", () => {
  const lavoro = lavoroInAttesa([], []);
  assert.equal(avvisoPmSpento("spento", lavoro), null);
});

test("avvisoPmSpento: PM non installato non dà l'avviso", () => {
  const lavoro = lavoroInAttesa([], [pr(1, { labels: ["needs-review"] })]);
  assert.equal(avvisoPmSpento("non-installato", lavoro), null);
});
