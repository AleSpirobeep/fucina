"use strict";

// Un task `- [x]` è già stato fuso: la PR che i controlli sui percorsi predicono non
// esisterà mai più. Questi test isolano il difetto descritto nella issue #107 (T006,
// spec 004-analista) con fixture controllate, senza dipendere dallo stato mutevole di
// specs/006-*.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { verifica, estraiTask, leggiConfigurazione } = require("./analista-cancello.js");

const FIXTURES = path.join(__dirname, "fixtures");

function leggi(nome) {
  return fs.readFileSync(path.join(FIXTURES, nome), "utf8");
}

const SPEC = leggi("analista-spec-completa.md");
const TASKS = leggi("analista-tasks-completa.md");
const PLAN = leggi("analista-plan.md");
const CHECKLIST = leggi("analista-checklist.md");
const CONFIGURAZIONE = leggiConfigurazione(leggi("analista-fucina.yml"));

function cartella(modifiche = {}) {
  const documenti = {
    "spec.md": SPEC,
    "plan.md": PLAN,
    "tasks.md": TASKS,
    "checklists/requirements.md": CHECKLIST,
    ...(modifiche.documenti || {}),
  };
  return {
    documenti,
    configurazione: modifiche.configurazione || CONFIGURAZIONE,
    fileEsistenti: modifiche.fileEsistenti || [],
  };
}

function codici(esito) {
  return esito.problemi.map((problema) => problema.codice);
}

// --- estraiTask espone `fatto` ------------------------------------------------

test("estraiTask cattura la casella ed espone fatto accanto a manuale", () => {
  const task = estraiTask(TASKS.replace("- [ ] T001", "- [x] T001"));
  assert.deepEqual(
    task.map((voce) => voce.fatto),
    [true, false, false]
  );
});

// --- task-su-percorso-protetto ------------------------------------------------

test("task su percorso protetto già fuso ([x]): nessun rilievo", () => {
  const guasta = TASKS.replace("- [ ] T001", "- [x] T001");
  const esito = verifica(
    cartella({
      documenti: { "tasks.md": guasta },
      fileEsistenti: ["luce/interruttore.test.js"],
    })
  );
  assert.ok(!codici(esito).includes("task-su-percorso-protetto"));
});

test("lo stesso task ancora da fare ([ ]) produce il rilievo", () => {
  const esito = verifica(cartella({ fileEsistenti: ["luce/interruttore.test.js"] }));
  assert.ok(codici(esito).includes("task-su-percorso-protetto"));
});

// --- task-su-workflow ----------------------------------------------------------

test("task su workflow già fuso ([x]): nessun rilievo", () => {
  const guasta = TASKS.replace(
    "- [ ] T002 Lettura dello stato in `luce/stato.js` (REQ-903).",
    "- [x] T002 Nuovo `.github/workflows/luce.yml` (REQ-903)."
  );
  const esito = verifica(cartella({ documenti: { "tasks.md": guasta } }));
  assert.ok(!codici(esito).includes("task-su-workflow"));
});

test("lo stesso task ancora da fare ([ ]) produce il rilievo", () => {
  const guasta = TASKS.replace(
    "- [ ] T002 Lettura dello stato in `luce/stato.js` (REQ-903).",
    "- [ ] T002 Nuovo `.github/workflows/luce.yml` (REQ-903)."
  );
  const esito = verifica(cartella({ documenti: { "tasks.md": guasta } }));
  assert.ok(codici(esito).includes("task-su-workflow"));
});

// --- la trappola: la copertura dei requisiti non esclude i task fatto ---------

test("un requisito citato solo da un task [x] resta coperto", () => {
  const guasta = TASKS.replace("- [ ] T001", "- [x] T001");
  const esito = verifica(cartella({ documenti: { "tasks.md": guasta } }));
  assert.ok(!codici(esito).includes("requisito-non-coperto"));
  assert.equal(esito.conteggi.requisitiCoperti, 3);
});
