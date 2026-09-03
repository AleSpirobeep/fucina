import { test } from "node:test";
import assert from "node:assert/strict";
import { agentiAttivi, formattaTempoTrascorso } from "./lib.js";

function run(id, { status = "in_progress", displayTitle = `run ${id}` } = {}) {
  return {
    id,
    status,
    display_title: displayTitle,
    html_url: `https://github.com/x/y/actions/runs/${id}`,
    run_started_at: "2026-09-03T12:00:00.000Z",
  };
}

// --- agentiAttivi ---------------------------------------------------------

test("agentiAttivi tiene le run in_progress", () => {
  const r = agentiAttivi([run(1, { status: "in_progress" })]);
  assert.deepEqual(r.map((a) => a.titolo), ["run 1"]);
});

test("agentiAttivi tiene le run queued", () => {
  const r = agentiAttivi([run(2, { status: "queued" })]);
  assert.deepEqual(r.map((a) => a.titolo), ["run 2"]);
});

test("agentiAttivi scarta le run completed", () => {
  const r = agentiAttivi([run(3, { status: "completed" })]);
  assert.deepEqual(r, []);
});

test("agentiAttivi su elenco vuoto o assente restituisce elenco vuoto", () => {
  assert.deepEqual(agentiAttivi([]), []);
  assert.deepEqual(agentiAttivi(undefined), []);
});

test("agentiAttivi porta titolo (dal titolo del run), url e avvio", () => {
  const r = agentiAttivi([run(4, { status: "queued", displayTitle: "T8 - Sezione 'Agenti attivi'" })]);
  assert.deepEqual(r, [
    {
      titolo: "T8 - Sezione 'Agenti attivi'",
      url: "https://github.com/x/y/actions/runs/4",
      avviatoA: "2026-09-03T12:00:00.000Z",
    },
  ]);
});

test("agentiAttivi mantiene l'ordine e filtra fra più run miste", () => {
  const runs = [
    run(1, { status: "completed" }),
    run(2, { status: "in_progress" }),
    run(3, { status: "queued" }),
    run(4, { status: "cancelled" }),
  ];
  const r = agentiAttivi(runs);
  assert.deepEqual(r.map((a) => a.url), [
    "https://github.com/x/y/actions/runs/2",
    "https://github.com/x/y/actions/runs/3",
  ]);
});

// --- formattaTempoTrascorso ------------------------------------------------

test("formattaTempoTrascorso sotto il minuto", () => {
  assert.equal(
    formattaTempoTrascorso("2026-09-03T12:00:00.000Z", "2026-09-03T12:00:30.000Z"),
    "meno di 1 min",
  );
});

test("formattaTempoTrascorso in minuti", () => {
  assert.equal(
    formattaTempoTrascorso("2026-09-03T12:00:00.000Z", "2026-09-03T12:03:00.000Z"),
    "3 min",
  );
});

test("formattaTempoTrascorso appena sotto l'ora resta in minuti", () => {
  assert.equal(
    formattaTempoTrascorso("2026-09-03T12:00:00.000Z", "2026-09-03T12:59:00.000Z"),
    "59 min",
  );
});

test("formattaTempoTrascorso a un'ora esatta non mostra i minuti", () => {
  assert.equal(
    formattaTempoTrascorso("2026-09-03T12:00:00.000Z", "2026-09-03T13:00:00.000Z"),
    "1 h",
  );
});

test("formattaTempoTrascorso oltre l'ora mostra ore e minuti", () => {
  assert.equal(
    formattaTempoTrascorso("2026-09-03T12:00:00.000Z", "2026-09-03T14:05:00.000Z"),
    "2 h 5 min",
  );
});

test("formattaTempoTrascorso non va mai sotto zero con orologi leggermente sfasati", () => {
  assert.equal(
    formattaTempoTrascorso("2026-09-03T12:00:00.000Z", "2026-09-03T11:59:59.000Z"),
    "meno di 1 min",
  );
});
