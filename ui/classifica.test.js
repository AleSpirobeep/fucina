import { test } from "node:test";
import assert from "node:assert/strict";
import { classifica } from "./lib.js";

const OGGI = "2026-09-03T12:00:00.000Z";

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

function pr(numero, { stato = "open", label } = {}) {
  return {
    number: numero,
    title: `pr ${numero}`,
    html_url: `https://github.com/x/y/pull/${numero}`,
    state: stato,
    labels: label ? [{ name: label }] : [],
  };
}

test("issue aperta senza label di stato finisce in backlog", () => {
  const r = classifica([issue(1)], [], OGGI);
  assert.deepEqual(r.backlog.map((i) => i.number), [1]);
});

test("issue con ready-for-dev finisce in pronte", () => {
  const r = classifica([issue(2, { label: "ready-for-dev" })], [], OGGI);
  assert.deepEqual(r.pronte.map((i) => i.number), [2]);
});

test("issue con in-progress finisce in inLavorazione", () => {
  const r = classifica([issue(3, { label: "in-progress" })], [], OGGI);
  assert.deepEqual(r.inLavorazione.map((i) => i.number), [3]);
});

test("issue con needs-human finisce in bloccate", () => {
  const r = classifica([issue(4, { label: "needs-human" })], [], OGGI);
  assert.deepEqual(r.bloccate.map((i) => i.number), [4]);
});

test("PR aperta con needs-review finisce in inRevisione", () => {
  const r = classifica([], [pr(5, { label: "needs-review" })], OGGI);
  assert.deepEqual(r.inRevisione.map((p) => p.number), [5]);
});

test("issue chiusa da meno di 14 giorni finisce in fatte", () => {
  const r = classifica([issue(6, { stato: "closed", chiusaGiorniFa: 5 })], [], OGGI);
  assert.deepEqual(r.fatte.map((i) => i.number), [6]);
});

test("issue con due label di stato finisce nella colonna piu' avanzata", () => {
  const item = issue(7);
  item.labels = [{ name: "ready-for-dev" }, { name: "needs-human" }];
  const r = classifica([item], [], OGGI);
  assert.deepEqual(r.bloccate.map((i) => i.number), [7]);
  assert.equal(r.pronte.length, 0);

  const item2 = issue(8);
  item2.labels = [{ name: "ready-for-dev" }, { name: "in-progress" }];
  const r2 = classifica([item2], [], OGGI);
  assert.deepEqual(r2.inLavorazione.map((i) => i.number), [8]);
  assert.equal(r2.pronte.length, 0);
});

test("caso limite: issue chiusa esattamente 14 giorni fa e' ancora fatte", () => {
  const r = classifica([issue(9, { stato: "closed", chiusaGiorniFa: 14 })], [], OGGI);
  assert.deepEqual(r.fatte.map((i) => i.number), [9]);
});

test("caso limite: issue chiusa da 14 giorni e un millisecondo non e' piu' fatte", () => {
  const item = issue(10, { stato: "closed" });
  const chiusaMs = new Date(OGGI).getTime() - (14 * 24 * 60 * 60 * 1000 + 1);
  item.closed_at = new Date(chiusaMs).toISOString();
  const r = classifica([item], [], OGGI);
  assert.equal(r.fatte.length, 0);
});

test("le PR non vanno mai in backlog, anche se mischiate nell'elenco issue", () => {
  const prMischiata = {
    number: 11,
    title: "pr mischiata",
    html_url: "https://github.com/x/y/issues/11",
    state: "open",
    labels: [],
    pull_request: { url: "https://api.github.com/repos/x/y/pulls/11" },
  };
  const r = classifica([prMischiata], [], OGGI);
  assert.equal(r.backlog.length, 0);
});

test("PR chiusa non finisce in inRevisione anche con needs-review", () => {
  const r = classifica([], [pr(12, { stato: "closed", label: "needs-review" })], OGGI);
  assert.equal(r.inRevisione.length, 0);
});

test("issue chiusa senza data di chiusura non finisce in fatte", () => {
  const item = issue(13, { stato: "closed" });
  const r = classifica([item], [], OGGI);
  assert.equal(r.fatte.length, 0);
});
