import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { contaInCoda, urlUltimaEsecuzionePm, riduciUltimaEsecuzionePm } from "./lib.js";
import { ultimaEsecuzionePm } from "./github.js";

const REPO = "AleSpirobeep/fucina";

function leggiFixtureJson(nome) {
  return JSON.parse(readFileSync(fileURLToPath(new URL(`./fixtures/${nome}`, import.meta.url)), "utf8"));
}

function usaFetchFinto(gestore) {
  const originale = globalThis.fetch;
  globalThis.fetch = gestore;
  return () => {
    globalThis.fetch = originale;
  };
}

function issue(numero, { stato = "open", label, prMischiata = false } = {}) {
  const item = {
    number: numero,
    title: `issue ${numero}`,
    state: stato,
    labels: label ? [{ name: label }] : [],
  };
  if (prMischiata) item.pull_request = {};
  return item;
}

function run({ status, conclusion, url = "https://github.com/x/y/actions/runs/1", data = "2026-09-04T19:27:16Z" } = {}) {
  return { status, conclusion, html_url: url, run_started_at: data };
}

// --- contaInCoda -------------------------------------------------------

test("contaInCoda conta solo le issue aperte con l'etichetta in-coda", () => {
  const issues = [
    issue(1, { label: "in-coda" }),
    issue(2, { label: "in-coda" }),
    issue(3, { label: "ready-for-dev" }),
  ];
  assert.equal(contaInCoda(issues), 2);
});

test("contaInCoda esclude le issue chiuse", () => {
  const issues = [issue(1, { stato: "closed", label: "in-coda" })];
  assert.equal(contaInCoda(issues), 0);
});

test("contaInCoda esclude le PR mischiate nell'elenco issue", () => {
  const issues = [issue(1, { label: "in-coda", prMischiata: true })];
  assert.equal(contaInCoda(issues), 0);
});

test("contaInCoda su elenco vuoto o assente dà 0", () => {
  assert.equal(contaInCoda([]), 0);
  assert.equal(contaInCoda(undefined), 0);
});

// --- urlUltimaEsecuzionePm (L2 del contratto) ---------------------------

test("urlUltimaEsecuzionePm chiede una sola run del workflow pm-agent.yml", () => {
  assert.equal(
    urlUltimaEsecuzionePm(REPO),
    "https://api.github.com/repos/AleSpirobeep/fucina/actions/workflows/pm-agent.yml/runs?per_page=1",
  );
});

// --- riduciUltimaEsecuzionePm --------------------------------------------

test("riduciUltimaEsecuzionePm: un run concluso espone la propria conclusione", () => {
  const r = riduciUltimaEsecuzionePm([run({ status: "completed", conclusion: "success" })]);
  assert.equal(r.esito, "success");
  assert.equal(r.data, "2026-09-04T19:27:16Z");
  assert.equal(r.url, "https://github.com/x/y/actions/runs/1");
});

test("riduciUltimaEsecuzionePm: un run in corso espone il proprio stato", () => {
  const r = riduciUltimaEsecuzionePm([run({ status: "in_progress", conclusion: null })]);
  assert.equal(r.esito, "in_progress");
});

test("riduciUltimaEsecuzionePm: l'assenza di run dà 'nessuna', non un errore", () => {
  assert.deepEqual(riduciUltimaEsecuzionePm([]), { esito: "nessuna", data: null, url: null });
  assert.deepEqual(riduciUltimaEsecuzionePm(undefined), { esito: "nessuna", data: null, url: null });
});

// --- ultimaEsecuzionePm: la lettura che usa la riduzione -----------------

test("ultimaEsecuzionePm su un'esecuzione conclusa restituisce esito, data e link", async () => {
  const corpo = leggiFixtureJson("run-pm-ultima.json");
  const ripristina = usaFetchFinto(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(corpo) }),
  );
  try {
    const r = await ultimaEsecuzionePm("un-token", REPO);
    assert.equal(r.esito, "success");
    assert.equal(r.data, "2026-09-04T19:27:16Z");
    assert.equal(r.url, "https://github.com/AleSpirobeep/fucina/actions/runs/33911229310");
  } finally {
    ripristina();
  }
});

test("ultimaEsecuzionePm senza run restituisce 'nessuna' senza sollevare errore", async () => {
  const ripristina = usaFetchFinto(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ total_count: 0, workflow_runs: [] }) }),
  );
  try {
    const r = await ultimaEsecuzionePm("un-token", REPO);
    assert.deepEqual(r, { esito: "nessuna", data: null, url: null });
  } finally {
    ripristina();
  }
});
