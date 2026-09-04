import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { urlUltimaEsecuzionePm, riduciUltimaEsecuzionePm, contaInCoda } from "./lib.js";
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

function issue(numero, { stato = "open", labels = [], pullRequest = false } = {}) {
  const item = {
    number: numero,
    title: `issue ${numero}`,
    state: stato,
    labels: labels.map((nome) => ({ name: nome })),
  };
  if (pullRequest) item.pull_request = { url: "https://api.github.com/x" };
  return item;
}

// --- parte pura: costruzione dell'URL (L2 del contratto) --------------------

test("urlUltimaEsecuzionePm chiede una sola run del workflow pm-agent.yml", () => {
  assert.equal(
    urlUltimaEsecuzionePm(REPO),
    "https://api.github.com/repos/AleSpirobeep/fucina/actions/workflows/pm-agent.yml/runs?per_page=1",
  );
});

// --- parte pura: riduzione della run all'esito, alla data e al link ---------

test("riduciUltimaEsecuzionePm: un run concluso espone la propria conclusione", () => {
  assert.deepEqual(
    riduciUltimaEsecuzionePm({
      status: "completed",
      conclusion: "success",
      run_started_at: "2026-09-04T18:30:00Z",
      html_url: "https://github.com/x/y/actions/runs/1",
    }),
    { esito: "success", data: "2026-09-04T18:30:00Z", url: "https://github.com/x/y/actions/runs/1" },
  );
});

test("riduciUltimaEsecuzionePm: un run ancora in corso espone il proprio stato", () => {
  assert.deepEqual(
    riduciUltimaEsecuzionePm({
      status: "in_progress",
      conclusion: null,
      run_started_at: "2026-09-04T19:00:00Z",
      html_url: "https://github.com/x/y/actions/runs/2",
    }),
    { esito: "in_progress", data: "2026-09-04T19:00:00Z", url: "https://github.com/x/y/actions/runs/2" },
  );
});

test("riduciUltimaEsecuzionePm: l'assenza di run dà 'nessuna', non un errore", () => {
  assert.deepEqual(riduciUltimaEsecuzionePm(undefined), { esito: "nessuna", data: null, url: null });
});

// --- ultimaEsecuzionePm: la lettura L2 che usa la riduzione -----------------

test("ultimaEsecuzionePm restituisce l'esito, la data e il link dalla fixture", async () => {
  const corpo = leggiFixtureJson("run-pm-ultima.json");
  const ripristina = usaFetchFinto(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(corpo) }),
  );
  try {
    assert.deepEqual(await ultimaEsecuzionePm("un-token", REPO), {
      esito: "success",
      data: "2026-09-04T18:30:00Z",
      url: "https://github.com/AleSpirobeep/fucina/actions/runs/987654321",
    });
  } finally {
    ripristina();
  }
});

test("ultimaEsecuzionePm su un elenco vuoto di run dà 'nessuna'", async () => {
  const ripristina = usaFetchFinto(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ workflow_runs: [] }) }),
  );
  try {
    assert.deepEqual(await ultimaEsecuzionePm("un-token", REPO), { esito: "nessuna", data: null, url: null });
  } finally {
    ripristina();
  }
});

// --- contaInCoda: conteggio puro dai dati già scaricati ---------------------

test("contaInCoda conta le issue aperte etichettate in-coda", () => {
  const issues = [
    issue(1, { labels: ["in-coda"] }),
    issue(2, { labels: ["ready-for-dev"] }),
    issue(3, { labels: ["in-coda"] }),
  ];
  assert.equal(contaInCoda(issues), 2);
});

test("contaInCoda esclude le issue in-coda chiuse", () => {
  const issues = [issue(1, { stato: "closed", labels: ["in-coda"] })];
  assert.equal(contaInCoda(issues), 0);
});

test("contaInCoda esclude le PR mischiate nell'elenco issue", () => {
  const issues = [issue(1, { labels: ["in-coda"], pullRequest: true })];
  assert.equal(contaInCoda(issues), 0);
});

test("contaInCoda su elenco vuoto o assente dà zero", () => {
  assert.equal(contaInCoda([]), 0);
  assert.equal(contaInCoda(undefined), 0);
});
