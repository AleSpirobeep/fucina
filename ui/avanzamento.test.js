import { test } from "node:test";
import assert from "node:assert/strict";
import { classifica, tabellaAvanzamento, COLONNE_AVANZAMENTO } from "./lib.js";

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

test("tabellaAvanzamento restituisce le sei colonne, in ordine, anche senza dati", () => {
  const r = tabellaAvanzamento(classifica([], [], OGGI));
  assert.deepEqual(
    r.map((c) => c.chiave),
    COLONNE_AVANZAMENTO.map((c) => c.chiave),
  );
  assert.deepEqual(
    r.map((c) => c.etichetta),
    ["Backlog", "Pronte", "In lavorazione", "In revisione", "Bloccate", "Fatte"],
  );
});

test("una colonna senza elementi ha conteggio zero ed elenco vuoto, non manca", () => {
  const r = tabellaAvanzamento(classifica([], [], OGGI));
  const backlog = r.find((c) => c.chiave === "backlog");
  assert.equal(backlog.conteggio, 0);
  assert.deepEqual(backlog.elementi, []);
});

test("il conteggio di una colonna coincide con il numero di elementi classificati", () => {
  const issues = [issue(1), issue(2), issue(3, { label: "ready-for-dev" })];
  const r = tabellaAvanzamento(classifica(issues, [], OGGI));
  assert.equal(r.find((c) => c.chiave === "backlog").conteggio, 2);
  assert.equal(r.find((c) => c.chiave === "pronte").conteggio, 1);
});

test("ogni elemento di una colonna porta titolo e url della issue o PR", () => {
  const r = tabellaAvanzamento(classifica([issue(4, { label: "needs-human" })], [], OGGI));
  const bloccate = r.find((c) => c.chiave === "bloccate");
  assert.deepEqual(bloccate.elementi, [
    { titolo: "issue 4", url: "https://github.com/x/y/issues/4" },
  ]);
});

test("le PR in revisione compaiono con titolo e url", () => {
  const r = tabellaAvanzamento(classifica([], [pr(5, { label: "needs-review" })], OGGI));
  const inRevisione = r.find((c) => c.chiave === "inRevisione");
  assert.deepEqual(inRevisione.elementi, [
    { titolo: "pr 5", url: "https://github.com/x/y/pull/5" },
  ]);
});
