import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ErroreGitHub,
  messaggioErroreHttp,
  interpretaStatoCheckRuns,
  urlIssueAperte,
  urlIssueChiuseDiRecente,
  urlPrAperte,
  urlCommentiIssue,
  urlCheckRuns,
  urlRunWorkflow,
} from "./lib.js";
import {
  issueAperte,
  issueChiuseDiRecente,
  prAperte,
  commentiIssue,
  statoCheckPr,
  runWorkflow,
} from "./github.js";

const REPO = "AleSpirobeep/fucina";

// --- parte pura: costruzione delle URL ---------------------------------

test("urlIssueAperte punta alle issue aperte del repo", () => {
  assert.equal(
    urlIssueAperte(REPO),
    "https://api.github.com/repos/AleSpirobeep/fucina/issues?state=open&per_page=100",
  );
});

test("urlIssueChiuseDiRecente ordina per data di aggiornamento", () => {
  assert.equal(
    urlIssueChiuseDiRecente(REPO),
    "https://api.github.com/repos/AleSpirobeep/fucina/issues?state=closed&sort=updated&direction=desc&per_page=100",
  );
});

test("urlPrAperte punta alle PR aperte del repo", () => {
  assert.equal(
    urlPrAperte(REPO),
    "https://api.github.com/repos/AleSpirobeep/fucina/pulls?state=open&per_page=100",
  );
});

test("urlCommentiIssue include il numero della issue", () => {
  assert.equal(
    urlCommentiIssue(REPO, 17),
    "https://api.github.com/repos/AleSpirobeep/fucina/issues/17/comments",
  );
});

test("urlCheckRuns usa l'endpoint dei check run, non il combined status", () => {
  assert.equal(
    urlCheckRuns(REPO, "325d787"),
    "https://api.github.com/repos/AleSpirobeep/fucina/commits/325d787/check-runs",
  );
});

test("urlRunWorkflow punta al workflow dev-agent", () => {
  assert.equal(
    urlRunWorkflow(REPO),
    "https://api.github.com/repos/AleSpirobeep/fucina/actions/workflows/dev-agent.yml/runs?per_page=50",
  );
});

// --- parte pura: interpretazione degli errori HTTP ----------------------

test("messaggioErroreHttp per 401 dice che il token non è valido", () => {
  assert.equal(messaggioErroreHttp(401, REPO), "Token non valido o scaduto.");
});

test("messaggioErroreHttp per 404 nomina il repo non raggiungibile", () => {
  assert.equal(
    messaggioErroreHttp(404, REPO),
    "Il repository AleSpirobeep/fucina non esiste o non è raggiungibile.",
  );
});

test("messaggioErroreHttp per altri codici resta leggibile", () => {
  assert.equal(messaggioErroreHttp(500, REPO), "Richiesta a GitHub fallita (codice 500).");
});

test("ErroreGitHub porta un codice e un messaggio", () => {
  const errore = new ErroreGitHub(401, "Token non valido o scaduto.");
  assert.equal(errore.codice, 401);
  assert.equal(errore.message, "Token non valido o scaduto.");
  assert.ok(errore instanceof Error);
});

// --- parte pura: aggregazione dello stato dei check run ------------------

test("interpretaStatoCheckRuns senza run è in attesa", () => {
  assert.equal(interpretaStatoCheckRuns([]), "in attesa");
});

test("interpretaStatoCheckRuns con un run non completato è in attesa", () => {
  assert.equal(
    interpretaStatoCheckRuns([{ status: "in_progress", conclusion: null }]),
    "in attesa",
  );
});

test("interpretaStatoCheckRuns con tutti i run riusciti è verde", () => {
  assert.equal(
    interpretaStatoCheckRuns([
      { status: "completed", conclusion: "success" },
      { status: "completed", conclusion: "neutral" },
      { status: "completed", conclusion: "skipped" },
    ]),
    "verde",
  );
});

for (const conclusione of ["failure", "timed_out", "cancelled", "action_required", "startup_failure"]) {
  test(`interpretaStatoCheckRuns con conclusione ${conclusione} è rosso`, () => {
    assert.equal(
      interpretaStatoCheckRuns([{ status: "completed", conclusion: conclusione }]),
      "rosso",
    );
  });
}

test("interpretaStatoCheckRuns: il rosso prevale su un run ancora in attesa", () => {
  assert.equal(
    interpretaStatoCheckRuns([
      { status: "in_progress", conclusion: null },
      { status: "completed", conclusion: "failure" },
    ]),
    "rosso",
  );
});

test("interpretaStatoCheckRuns aggrega run duplicati (push e pull_request sullo stesso commit)", () => {
  assert.equal(
    interpretaStatoCheckRuns([
      { status: "completed", conclusion: "success" },
      { status: "completed", conclusion: "success" },
      { status: "completed", conclusion: "success" },
      { status: "completed", conclusion: "success" },
    ]),
    "verde",
  );
});

// --- funzioni fetch sottili, con fetch globale sostituito da un finto ---

function usaFetchFinto(gestore) {
  const originale = globalThis.fetch;
  globalThis.fetch = gestore;
  return () => {
    globalThis.fetch = originale;
  };
}

test("issueAperte rifiuta il token mancante senza chiamare fetch", async () => {
  const ripristina = usaFetchFinto(() => {
    throw new Error("fetch non doveva essere chiamato");
  });
  try {
    await assert.rejects(() => issueAperte("", REPO), ErroreGitHub);
  } finally {
    ripristina();
  }
});

test("issueAperte manda il token solo nell'header Authorization verso api.github.com", async () => {
  let urlChiamato;
  let opzioniChiamate;
  const ripristina = usaFetchFinto((url, opzioni) => {
    urlChiamato = url;
    opzioniChiamate = opzioni;
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([{ number: 1 }]),
    });
  });
  try {
    const risultato = await issueAperte("il-token", REPO);
    assert.equal(urlChiamato, urlIssueAperte(REPO));
    assert.ok(urlChiamato.startsWith("https://api.github.com/"));
    assert.equal(opzioniChiamate.headers.Authorization, "Bearer il-token");
    assert.deepEqual(risultato, [{ number: 1 }]);
  } finally {
    ripristina();
  }
});

test("issueChiuseDiRecente propaga un 401 come ErroreGitHub leggibile", async () => {
  const ripristina = usaFetchFinto(() =>
    Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) }),
  );
  try {
    await assert.rejects(
      () => issueChiuseDiRecente("token-scaduto", REPO),
      (errore) => {
        assert.ok(errore instanceof ErroreGitHub);
        assert.equal(errore.codice, 401);
        assert.equal(errore.message, "Token non valido o scaduto.");
        return true;
      },
    );
  } finally {
    ripristina();
  }
});

test("prAperte propaga un 404 che nomina il repo", async () => {
  const ripristina = usaFetchFinto(() =>
    Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) }),
  );
  try {
    await assert.rejects(
      () => prAperte("un-token", REPO),
      (errore) => {
        assert.ok(errore instanceof ErroreGitHub);
        assert.equal(
          errore.message,
          "Il repository AleSpirobeep/fucina non esiste o non è raggiungibile.",
        );
        return true;
      },
    );
  } finally {
    ripristina();
  }
});

test("commentiIssue chiama l'URL dei commenti della issue giusta", async () => {
  let urlChiamato;
  const ripristina = usaFetchFinto((url) => {
    urlChiamato = url;
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
  try {
    await commentiIssue("un-token", REPO, 17);
    assert.equal(urlChiamato, urlCommentiIssue(REPO, 17));
  } finally {
    ripristina();
  }
});

test("statoCheckPr chiama l'endpoint dei check run con l'header Accept giusto e aggrega il risultato", async () => {
  let urlChiamato;
  let opzioniChiamate;
  const ripristina = usaFetchFinto((url, opzioni) => {
    urlChiamato = url;
    opzioniChiamate = opzioni;
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          check_runs: [
            { status: "completed", conclusion: "success" },
            { status: "completed", conclusion: "success" },
          ],
        }),
    });
  });
  try {
    const stato = await statoCheckPr("un-token", REPO, "325d787");
    assert.equal(urlChiamato, urlCheckRuns(REPO, "325d787"));
    assert.equal(opzioniChiamate.headers.Accept, "application/vnd.github+json");
    assert.equal(stato, "verde");
  } finally {
    ripristina();
  }
});

test("runWorkflow restituisce l'elenco delle run", async () => {
  const runFinte = [{ id: 1, status: "in_progress" }];
  const ripristina = usaFetchFinto(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ workflow_runs: runFinte }) }),
  );
  try {
    const risultato = await runWorkflow("un-token", REPO);
    assert.deepEqual(risultato, runFinte);
  } finally {
    ripristina();
  }
});
