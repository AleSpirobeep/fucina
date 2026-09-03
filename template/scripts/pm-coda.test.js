"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const { decidi, estraiSezioniMancanti, identificativoTask } = require("./pm-coda.js");

const FIXTURES = path.join(__dirname, "fixtures");
const SCRIPT = path.join(__dirname, "pm-coda.js");

function leggiFixture(nome) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES, nome), "utf8"));
}

function leggiCorpo(nome) {
  return fs.readFileSync(path.join(FIXTURES, nome), "utf8");
}

// --- Tabella delle 12 fixture del contratto ------------------------------

const TABELLA_FIXTURE = [
  ["stato-vuoto.json", { azione: "niente" }],
  ["stato-coda.json", { azione: "avvia-task", dettagli: { task: "T002" } }],
  ["stato-coda-bloccata.json", { azione: "niente" }],
  ["stato-coda-suffissi.json", { azione: "avvia-task", dettagli: { task: "T004a" } }],
  ["stato-pr-verde.json", { azione: "revisione", numero: 40 }],
  ["stato-pr-rossa.json", { azione: "rimanda-check-rossi" }],
  ["stato-pr-in-corso.json", { azione: "attendi-check" }],
  [
    "stato-pr-senza-sezioni.json",
    { azione: "rimanda-corpo-incompleto", dettagli: { manca: ["Non fatto", "Fatto in più"] } },
  ],
  ["stato-priorita.json", { azione: "revisione", numero: 40 }],
  ["stato-domanda.json", { azione: "domanda" }],
  ["stato-domanda-vista.json", { azione: "niente" }],
  ["stato-pr-umano.json", { azione: "niente" }],
];

for (const [file, atteso] of TABELLA_FIXTURE) {
  test(`decidi: ${file} produce ${atteso.azione}`, () => {
    const decisione = decidi(leggiFixture(file));
    assert.equal(decisione.azione, atteso.azione);
    if (atteso.numero !== undefined) assert.equal(decisione.numero, atteso.numero);
    if (atteso.dettagli) {
      for (const [chiave, valore] of Object.entries(atteso.dettagli)) {
        assert.deepEqual(decisione.dettagli[chiave], valore);
      }
    }
  });
}

// --- Regole 1a-1d, 2, 3, 4 (almeno un test ciascuna) ----------------------

test("regola 1a: PR needs-review con check rosso -> rimanda-check-rossi", () => {
  const decisione = decidi(leggiFixture("stato-pr-rossa.json"));
  assert.equal(decisione.azione, "rimanda-check-rossi");
  assert.equal(decisione.numero, 41);
});

test("regola 1b: PR needs-review con check in corso -> attendi-check", () => {
  const decisione = decidi(leggiFixture("stato-pr-in-corso.json"));
  assert.equal(decisione.azione, "attendi-check");
  assert.equal(decisione.numero, 42);
});

test("regola 1c: PR needs-review con check verdi e sezioni mancanti -> rimanda-corpo-incompleto", () => {
  const decisione = decidi(leggiFixture("stato-pr-senza-sezioni.json"));
  assert.equal(decisione.azione, "rimanda-corpo-incompleto");
  assert.deepEqual(decisione.dettagli.manca, ["Non fatto", "Fatto in più"]);
});

test("regola 1d: PR needs-review con check verdi e corpo completo -> revisione", () => {
  const decisione = decidi(leggiFixture("stato-pr-verde.json"));
  assert.equal(decisione.azione, "revisione");
  assert.equal(decisione.numero, 40);
  assert.equal(decisione.dettagli.issue, 5);
});

test("regola 2: issue needs-human non ancora vista dal PM -> domanda", () => {
  const decisione = decidi(leggiFixture("stato-domanda.json"));
  assert.equal(decisione.azione, "domanda");
  assert.equal(decisione.numero, 30);
});

test("regola 2: issue needs-human già commentata dal PM -> niente", () => {
  const decisione = decidi(leggiFixture("stato-domanda-vista.json"));
  assert.equal(decisione.azione, "niente");
});

test("regola 3: nulla di attivo, task in coda -> avvia-task con identificativo più basso", () => {
  const decisione = decidi(leggiFixture("stato-coda.json"));
  assert.equal(decisione.azione, "avvia-task");
  assert.equal(decisione.dettagli.task, "T002");
});

test("regola 3: un task in-progress blocca l'avvio del successivo", () => {
  const decisione = decidi(leggiFixture("stato-coda-bloccata.json"));
  assert.equal(decisione.azione, "niente");
});

test("regola 4: nessuna PR, nessuna issue -> niente", () => {
  const decisione = decidi(leggiFixture("stato-vuoto.json"));
  assert.deepEqual(decisione, {
    azione: "niente",
    numero: null,
    motivo: decisione.motivo,
    dettagli: {},
  });
});

// --- Ordine di priorità: REQ-210 ------------------------------------------

test("priorità: PR verde batte issue needs-human e task in coda", () => {
  const decisione = decidi(leggiFixture("stato-priorita.json"));
  assert.equal(decisione.azione, "revisione");
  assert.equal(decisione.numero, 40);
});

// --- Ordine dei task in coda ------------------------------------------

test("ordine dei task: T004 < T004a < T004b < T005", () => {
  const stato = {
    rapporto: null,
    pr: [],
    issue: [
      { numero: 4, titolo: "T004: base", labels: ["in-coda"], ultimoCommentoPm: false },
      { numero: 5, titolo: "T004b: rifinitura", labels: ["in-coda"], ultimoCommentoPm: false },
      { numero: 6, titolo: "T004a: variante", labels: ["in-coda"], ultimoCommentoPm: false },
      { numero: 7, titolo: "T005: successivo", labels: ["in-coda"], ultimoCommentoPm: false },
    ],
  };
  assert.equal(decidi(stato).dettagli.task, "T004");

  const senzaBase = { ...stato, issue: stato.issue.filter((i) => i.numero !== 4) };
  assert.equal(decidi(senzaBase).dettagli.task, "T004a");

  const soloUltimi = { ...stato, issue: stato.issue.filter((i) => i.numero === 5 || i.numero === 7) };
  assert.equal(decidi(soloUltimi).dettagli.task, "T004b");
});

test("identificativoTask: ST001 non è un identificativo valido", () => {
  assert.equal(identificativoTask("ST001: falso positivo"), null);
});

test("identificativoTask: riconosce T seguito da almeno tre cifre e al più una lettera", () => {
  assert.equal(identificativoTask("T004: titolo"), "T004");
  assert.equal(identificativoTask("T004b - titolo"), "T004b");
  assert.equal(identificativoTask("(T0041) titolo"), "T0041");
  assert.equal(identificativoTask("nessun identificativo qui"), null);
});

// --- Note del contratto ----------------------------------------------------

test("issue in-coda con un'altra label di stato non viene avviata", () => {
  const stato = {
    rapporto: null,
    pr: [],
    issue: [
      { numero: 1, titolo: "T001: attivo ma anche in coda", labels: ["in-coda", "ready-for-dev"], ultimoCommentoPm: false },
    ],
  };
  assert.equal(decidi(stato).azione, "niente");
});

test("PR needs-review con needs-human blocca l'avvio dei task successivi", () => {
  const decisione = decidi(leggiFixture("stato-pr-umano.json"));
  assert.equal(decisione.azione, "niente");
});

// --- estraiSezioniMancanti -------------------------------------------------

test("estraiSezioniMancanti: riconosce ## e ###, maiuscole e spazi indifferenti", () => {
  assert.deepEqual(estraiSezioniMancanti("##Non Fatto\nnulla\n###   FATTO IN PIÙ   \nnulla\n"), []);
});

test("estraiSezioniMancanti: nessuna sezione -> entrambe mancanti", () => {
  assert.deepEqual(estraiSezioniMancanti("solo testo, nessuna intestazione"), ["Non fatto", "Fatto in più"]);
});

test("estraiSezioniMancanti: corpo vuoto o assente -> entrambe mancanti", () => {
  assert.deepEqual(estraiSezioniMancanti(""), ["Non fatto", "Fatto in più"]);
  assert.deepEqual(estraiSezioniMancanti(undefined), ["Non fatto", "Fatto in più"]);
});

test("estraiSezioniMancanti: corpo della PR #6 di fucina-lab, entrambe presenti", () => {
  assert.deepEqual(estraiSezioniMancanti(leggiCorpo("pr-body-6.md")), []);
});

test("estraiSezioniMancanti: corpo della PR #9 di fucina-lab, entrambe presenti", () => {
  assert.deepEqual(estraiSezioniMancanti(leggiCorpo("pr-body-9.md")), []);
});

test("estraiSezioniMancanti: corpo minimo del workflow, entrambe mancanti", () => {
  const decisione = decidi(leggiFixture("stato-pr-senza-sezioni.json"));
  assert.deepEqual(decisione.dettagli.manca, ["Non fatto", "Fatto in più"]);
});

// --- CLI --------------------------------------------------------------------

test("CLI: stato valido su stdin -> decisione JSON su stdout, exit 0", () => {
  const input = fs.readFileSync(path.join(FIXTURES, "stato-coda.json"), "utf8");
  const risultato = spawnSync(process.execPath, [SCRIPT], { input, encoding: "utf8" });
  assert.equal(risultato.status, 0);
  const decisione = JSON.parse(risultato.stdout);
  assert.equal(decisione.azione, "avvia-task");
});

test("CLI: input non JSON -> messaggio su stderr, exit 2", () => {
  const risultato = spawnSync(process.execPath, [SCRIPT], { input: "non è json", encoding: "utf8" });
  assert.equal(risultato.status, 2);
  assert.equal(risultato.stdout, "");
  assert.ok(risultato.stderr.length > 0);
});

test("CLI: JSON valido ma senza le chiavi pr/issue -> messaggio su stderr, exit 2", () => {
  const risultato = spawnSync(process.execPath, [SCRIPT], { input: "{}", encoding: "utf8" });
  assert.equal(risultato.status, 2);
  assert.ok(risultato.stderr.length > 0);
});

test("modulo: richiedere pm-coda.js non legge stdin", () => {
  assert.equal(process.stdin.listenerCount("data"), 0);
});
