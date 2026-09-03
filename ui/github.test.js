import { test } from "node:test";
import assert from "node:assert/strict";
import {
  urlIssueRepo,
  urlPrRepo,
  urlCommentiIssue,
  urlStatoCheckPr,
  urlRunWorkflow,
  interpretaStatoCheck,
  interpretaErroreHttp,
  dataIsoGiorniFa,
  ErroreGitHub,
} from "./lib.js";
import {
  issueAperte,
  issueChiuseDiRecente,
  prAperte,
  commentiIssue,
  statoCheckPr,
  runWorkflow,
} from "./github.js";

// --- parte pura: costruzione delle URL ---

test("urlIssueRepo costruisce l'URL per le issue aperte", () => {
  assert.equal(
    urlIssueRepo("a/b"),
    "https://api.github.com/repos/a/b/issues?state=open&per_page=100",
  );
});

test("urlIssueRepo aggiunge since quando presente", () => {
  const url = urlIssueRepo("a/b", { stato: "closed", since: "2026-08-20T00:00:00.000Z" });
  assert.equal(
    url,
    "https://api.github.com/repos/a/b/issues?state=closed&per_page=100&since=2026-08-20T00%3A00%3A00.000Z",
  );
});

test("urlPrRepo costruisce l'URL per le PR aperte", () => {
  assert.equal(
    urlPrRepo("a/b"),
    "https://api.github.com/repos/a/b/pulls?state=open&per_page=100",
  );
});

test("urlCommentiIssue costruisce l'URL dei commenti di una issue", () => {
  assert.equal(
    urlCommentiIssue("a/b", 42),
    "https://api.github.com/repos/a/b/issues/42/comments",
  );
});

test("urlStatoCheckPr costruisce l'URL dello stato combinato", () => {
  assert.equal(
    urlStatoCheckPr("a/b", "deadbeef"),
    "https://api.github.com/repos/a/b/commits/deadbeef/status",
  );
});

test("urlRunWorkflow usa dev-agent.yml come default", () => {
  assert.equal(
    urlRunWorkflow("a/b"),
    "https://api.github.com/repos/a/b/actions/workflows/dev-agent.yml/runs?per_page=20",
  );
});

test("urlRunWorkflow accetta un file di workflow diverso", () => {
  assert.equal(
    urlRunWorkflow("a/b", "altro.yml"),
    "https://api.github.com/repos/a/b/actions/workflows/altro.yml/runs?per_page=20",
  );
});

// --- parte pura: interpretazione dello stato combinato dei check ---

test("interpretaStatoCheck mappa success su verde", () => {
  assert.equal(interpretaStatoCheck("success"), "verde");
});

test("interpretaStatoCheck mappa failure ed error su rosso", () => {
  assert.equal(interpretaStatoCheck("failure"), "rosso");
  assert.equal(interpretaStatoCheck("error"), "rosso");
});

test("interpretaStatoCheck mappa pending (e qualsiasi altro valore) su in attesa", () => {
  assert.equal(interpretaStatoCheck("pending"), "in attesa");
  assert.equal(interpretaStatoCheck(undefined), "in attesa");
});

// --- parte pura: interpretazione degli errori HTTP ---

test("interpretaErroreHttp su 401 dice che il token non e' valido o e' scaduto", () => {
  const { codice, messaggio } = interpretaErroreHttp(401, "a/b");
  assert.equal(codice, 401);
  assert.match(messaggio, /token non valido o scaduto/i);
});

test("interpretaErroreHttp su 404 nomina il repo non raggiungibile", () => {
  const { codice, messaggio } = interpretaErroreHttp(404, "a/b");
  assert.equal(codice, 404);
  assert.match(messaggio, /a\/b/);
});

test("interpretaErroreHttp su un altro codice restituisce un messaggio generico con il codice", () => {
  const { codice, messaggio } = interpretaErroreHttp(500, "a/b");
  assert.equal(codice, 500);
  assert.match(messaggio, /500/);
});

// --- parte pura: date ---

test("dataIsoGiorniFa calcola la data ISO di N giorni prima di oggi", () => {
  assert.equal(
    dataIsoGiorniFa(14, "2026-09-03T12:00:00.000Z"),
    "2026-08-20T12:00:00.000Z",
  );
});

// --- funzioni fetch sottili: fetch globale sostituito, nessuna rete vera ---

function fetchFinto({ ok, status, corpo }) {
  const chiamate = [];
  const finto = async (url, opzioni) => {
    chiamate.push({ url, opzioni });
    return { ok, status, json: async () => corpo };
  };
  finto.chiamate = chiamate;
  return finto;
}

test("issueAperte chiama l'URL giusto con il token nell'header Authorization", async (t) => {
  const finto = fetchFinto({ ok: true, status: 200, corpo: [{ number: 1 }] });
  t.mock.method(globalThis, "fetch", finto);

  const risultato = await issueAperte("a/b", "il-token");

  assert.deepEqual(risultato, [{ number: 1 }]);
  assert.equal(finto.chiamate.length, 1);
  assert.equal(
    finto.chiamate[0].url,
    "https://api.github.com/repos/a/b/issues?state=open&per_page=100",
  );
  assert.equal(finto.chiamate[0].opzioni.headers.Authorization, "Bearer il-token");
});

test("issueChiuseDiRecente chiede le issue chiuse con since valorizzato", async (t) => {
  const finto = fetchFinto({ ok: true, status: 200, corpo: [] });
  t.mock.method(globalThis, "fetch", finto);

  await issueChiuseDiRecente("a/b", "il-token", 14);

  const url = new URL(finto.chiamate[0].url);
  assert.equal(url.searchParams.get("state"), "closed");
  assert.ok(url.searchParams.get("since"));
});

test("prAperte chiama l'endpoint delle pull request", async (t) => {
  const finto = fetchFinto({ ok: true, status: 200, corpo: [] });
  t.mock.method(globalThis, "fetch", finto);

  await prAperte("a/b", "il-token");

  assert.match(finto.chiamate[0].url, /\/repos\/a\/b\/pulls\?/);
});

test("commentiIssue chiama l'endpoint dei commenti della issue giusta", async (t) => {
  const finto = fetchFinto({ ok: true, status: 200, corpo: [] });
  t.mock.method(globalThis, "fetch", finto);

  await commentiIssue("a/b", 7, "il-token");

  assert.equal(finto.chiamate[0].url, "https://api.github.com/repos/a/b/issues/7/comments");
});

test("statoCheckPr restituisce lo stato interpretato, non quello grezzo", async (t) => {
  const finto = fetchFinto({ ok: true, status: 200, corpo: { state: "success" } });
  t.mock.method(globalThis, "fetch", finto);

  const risultato = await statoCheckPr("a/b", "deadbeef", "il-token");

  assert.equal(risultato, "verde");
});

test("runWorkflow chiama l'endpoint dei run del workflow dev-agent per default", async (t) => {
  const finto = fetchFinto({ ok: true, status: 200, corpo: { workflow_runs: [] } });
  t.mock.method(globalThis, "fetch", finto);

  await runWorkflow("a/b", "il-token");

  assert.match(finto.chiamate[0].url, /\/actions\/workflows\/dev-agent\.yml\/runs\?/);
});

test("un token mancante fa fallire subito, senza chiamare fetch", async (t) => {
  const finto = fetchFinto({ ok: true, status: 200, corpo: [] });
  t.mock.method(globalThis, "fetch", finto);

  await assert.rejects(() => issueAperte("a/b", ""), ErroreGitHub);
  assert.equal(finto.chiamate.length, 0);
});

test("un 401 produce un ErroreGitHub con il messaggio sul token non valido", async (t) => {
  t.mock.method(globalThis, "fetch", fetchFinto({ ok: false, status: 401, corpo: {} }));

  await assert.rejects(() => issueAperte("a/b", "il-token"), (errore) => {
    assert.ok(errore instanceof ErroreGitHub);
    assert.equal(errore.codice, 401);
    assert.match(errore.message, /token non valido o scaduto/i);
    return true;
  });
});

test("un 404 produce un ErroreGitHub che nomina il repo non raggiungibile", async (t) => {
  t.mock.method(globalThis, "fetch", fetchFinto({ ok: false, status: 404, corpo: {} }));

  await assert.rejects(() => prAperte("a/b", "il-token"), (errore) => {
    assert.ok(errore instanceof ErroreGitHub);
    assert.equal(errore.codice, 404);
    assert.match(errore.message, /a\/b/);
    return true;
  });
});
