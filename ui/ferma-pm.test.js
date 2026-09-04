import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  ErroreGitHub,
  urlFermaPm,
  urlEsecuzioniInCorsoPm,
  riduciEsecuzioniInCorsoPm,
  testoEsecuzioniInCorsoPm,
} from "./lib.js";
import { fermaPm, esecuzioniInCorsoPm } from "./github.js";

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

// --- parte pura: costruzione delle URL (S1 e L3 del contratto) -------------

test("urlFermaPm punta all'endpoint disable del workflow pm-agent.yml", () => {
  assert.equal(
    urlFermaPm(REPO),
    "https://api.github.com/repos/AleSpirobeep/fucina/actions/workflows/pm-agent.yml/disable",
  );
});

test("urlEsecuzioniInCorsoPm filtra le run per status=in_progress", () => {
  assert.equal(
    urlEsecuzioniInCorsoPm(REPO),
    "https://api.github.com/repos/AleSpirobeep/fucina/actions/workflows/pm-agent.yml/runs?status=in_progress",
  );
});

// --- parte pura: riduzione delle run in corso -------------------------------

test("riduciEsecuzioniInCorsoPm espone titolo e link di ogni run", () => {
  const run = {
    display_title: "pm-agent",
    html_url: "https://github.com/x/y/actions/runs/1",
  };
  assert.deepEqual(riduciEsecuzioniInCorsoPm([run]), [
    { titolo: "pm-agent", url: "https://github.com/x/y/actions/runs/1" },
  ]);
});

test("riduciEsecuzioniInCorsoPm su elenco vuoto o assente dà elenco vuoto", () => {
  assert.deepEqual(riduciEsecuzioniInCorsoPm([]), []);
  assert.deepEqual(riduciEsecuzioniInCorsoPm(undefined), []);
});

// --- parte pura: il testo che accompagna l'elenco ---------------------------

test("testoEsecuzioniInCorsoPm senza esecuzioni dice che non ce ne sono", () => {
  assert.equal(testoEsecuzioniInCorsoPm([]), "Nessuna esecuzione del PM in corso.");
  assert.equal(testoEsecuzioniInCorsoPm(undefined), "Nessuna esecuzione del PM in corso.");
});

test("testoEsecuzioniInCorsoPm con esecuzioni dice che finiranno il proprio ciclo", () => {
  assert.equal(
    testoEsecuzioniInCorsoPm([{ titolo: "pm-agent", url: "https://github.com/x/y/actions/runs/1" }]),
    "Finiranno il proprio ciclo:",
  );
});

// --- esecuzioniInCorsoPm: la lettura L3 -------------------------------------

test("esecuzioniInCorsoPm restituisce l'elenco ridotto delle run in corso", async () => {
  const corpo = leggiFixtureJson("run-pm-in-corso.json");
  const ripristina = usaFetchFinto(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(corpo) }),
  );
  try {
    const esecuzioni = await esecuzioniInCorsoPm("un-token", REPO);
    assert.deepEqual(esecuzioni, [
      { titolo: "pm-agent", url: "https://github.com/AleSpirobeep/fucina/actions/runs/33911300000" },
    ]);
  } finally {
    ripristina();
  }
});

test("esecuzioniInCorsoPm su elenco vuoto restituisce elenco vuoto", async () => {
  const ripristina = usaFetchFinto(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ total_count: 0, workflow_runs: [] }) }),
  );
  try {
    assert.deepEqual(await esecuzioniInCorsoPm("un-token", REPO), []);
  } finally {
    ripristina();
  }
});

// --- fermaPm: S1 poi L3, nell'ordine (REQ-411, 412) -------------------------

test("fermaPm disabilita il workflow con una PUT e poi elenca le esecuzioni in corso", async () => {
  const corpo = leggiFixtureJson("run-pm-in-corso.json");
  const chiamate = [];
  const ripristina = usaFetchFinto((url, opzioni) => {
    chiamate.push({ url, metodo: opzioni.method });
    if (chiamate.length === 1) {
      return Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve(null) });
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(corpo) });
  });
  try {
    const esecuzioni = await fermaPm("un-token", REPO);
    assert.deepEqual(chiamate, [
      { url: urlFermaPm(REPO), metodo: "PUT" },
      { url: urlEsecuzioniInCorsoPm(REPO), metodo: "GET" },
    ]);
    assert.deepEqual(esecuzioni, [
      { titolo: "pm-agent", url: "https://github.com/AleSpirobeep/fucina/actions/runs/33911300000" },
    ]);
  } finally {
    ripristina();
  }
});

test("fermaPm senza esecuzioni in corso restituisce elenco vuoto", async () => {
  const ripristina = usaFetchFinto((url, opzioni) => {
    if (opzioni.method === "PUT") {
      return Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve(null) });
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ workflow_runs: [] }) });
  });
  try {
    assert.deepEqual(await fermaPm("un-token", REPO), []);
  } finally {
    ripristina();
  }
});

test("fermaPm non chiama L3 se la disable fallisce", async () => {
  const chiamate = [];
  const ripristina = usaFetchFinto((url) => {
    chiamate.push(url);
    return Promise.resolve({ ok: false, status: 403, json: () => Promise.resolve({}) });
  });
  try {
    await assert.rejects(
      () => fermaPm("token-senza-permesso", REPO),
      (errore) => {
        assert.ok(errore instanceof ErroreGitHub);
        assert.equal(errore.codice, 403);
        return true;
      },
    );
    assert.deepEqual(chiamate, [urlFermaPm(REPO)]);
  } finally {
    ripristina();
  }
});

test("fermaPm rifiuta il token mancante senza chiamare fetch", async () => {
  const ripristina = usaFetchFinto(() => {
    throw new Error("fetch non doveva essere chiamato");
  });
  try {
    await assert.rejects(() => fermaPm("", REPO), ErroreGitHub);
  } finally {
    ripristina();
  }
});
