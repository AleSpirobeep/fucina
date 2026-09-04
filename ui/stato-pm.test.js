import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ErroreGitHub, urlStatoPm, riduciStatoPm } from "./lib.js";
import { statoPm } from "./github.js";

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

// --- parte pura: costruzione dell'URL (L1 del contratto) --------------------

test("urlStatoPm punta al workflow pm-agent.yml del repo", () => {
  assert.equal(
    urlStatoPm(REPO),
    "https://api.github.com/repos/AleSpirobeep/fucina/actions/workflows/pm-agent.yml",
  );
});

// --- parte pura: riduzione del campo state ai tre soli valori ---------------

test("riduciStatoPm: state 'active' dà 'acceso'", () => {
  assert.equal(riduciStatoPm("active"), "acceso");
});

test("riduciStatoPm: 'disabled_manually' dà 'spento'", () => {
  assert.equal(riduciStatoPm("disabled_manually"), "spento");
});

test("riduciStatoPm: 'disabled_inactivity' dà 'spento'", () => {
  assert.equal(riduciStatoPm("disabled_inactivity"), "spento");
});

test("riduciStatoPm: null (il 404 di L1) dà 'non-installato'", () => {
  assert.equal(riduciStatoPm(null), "non-installato");
});

// --- statoPm: la lettura che usa la riduzione, 404 come stato non errore ----

test("statoPm su un workflow attivo restituisce 'acceso'", async () => {
  const corpo = leggiFixtureJson("workflow-pm-attivo.json");
  const ripristina = usaFetchFinto(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(corpo) }),
  );
  try {
    assert.equal(await statoPm("un-token", REPO), "acceso");
  } finally {
    ripristina();
  }
});

test("statoPm su un workflow disabilitato restituisce 'spento'", async () => {
  const corpo = leggiFixtureJson("workflow-pm-disabilitato.json");
  const ripristina = usaFetchFinto(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(corpo) }),
  );
  try {
    assert.equal(await statoPm("un-token", REPO), "spento");
  } finally {
    ripristina();
  }
});

test("statoPm su una risposta 404 restituisce 'non-installato' senza sollevare errore", async () => {
  const ripristina = usaFetchFinto(() =>
    Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) }),
  );
  try {
    assert.equal(await statoPm("un-token", REPO), "non-installato");
  } finally {
    ripristina();
  }
});

test("statoPm su un codice diverso da 200 e 404 solleva ErroreGitHub", async () => {
  const ripristina = usaFetchFinto(() =>
    Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) }),
  );
  try {
    await assert.rejects(
      () => statoPm("token-scaduto", REPO),
      (errore) => {
        assert.ok(errore instanceof ErroreGitHub);
        assert.equal(errore.codice, 401);
        return true;
      },
    );
  } finally {
    ripristina();
  }
});
