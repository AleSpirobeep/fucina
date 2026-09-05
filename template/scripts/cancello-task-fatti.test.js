"use strict";

// Il cancello non deve rilevare come difettoso un task che ha già visto fondere: quella PR
// non esisterà mai più (issue #107). Questi test isolano il campo `fatto` che la distingue
// da un task ancora da lavorare, accanto a quelli esistenti in analista-cancello.test.js.

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

// T001 in TASKS copre REQ-901, 902 e tocca `luce/interruttore.test.js`. T002 copre
// REQ-903 e tocca `luce/stato.js`. Nessuno dei due parte marcato fatto.
const T001_FATTO = TASKS.replace("- [ ] T001", "- [x] T001");
const T002_FATTO = TASKS.replace("- [ ] T002", "- [x] T002");

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

test("estraiTask: una casella «[ ]» non è fatta, una «[x]» sì", () => {
  const [t001, t002] = estraiTask(TASKS);
  assert.equal(t001.fatto, false);
  assert.equal(t002.fatto, false);

  const [dopo] = estraiTask(T001_FATTO);
  assert.equal(dopo.id, "T001");
  assert.equal(dopo.fatto, true);
});

// --- task-su-percorso-protetto salta i task fatto -----------------------------

test("task non fatto su percorso protetto esistente: il rilievo compare", () => {
  const esito = verifica(cartella({ fileEsistenti: ["luce/interruttore.test.js"] }));
  assert.ok(codici(esito).includes("task-su-percorso-protetto"));
});

test("lo stesso task, ma fatto, su percorso protetto esistente: nessun rilievo", () => {
  const esito = verifica(
    cartella({
      documenti: { "tasks.md": T001_FATTO },
      fileEsistenti: ["luce/interruttore.test.js"],
    })
  );
  assert.ok(!codici(esito).includes("task-su-percorso-protetto"));
});

// --- task-su-workflow salta i task fatto --------------------------------------

test("task fatto su .github/workflows/: nessun rilievo, quella PR non esisterà più", () => {
  const suWorkflow = T002_FATTO.replace(
    "Lettura dello stato in `luce/stato.js` (REQ-903).",
    "Nuovo `.github/workflows/luce.yml` (REQ-903)."
  );
  const esito = verifica(cartella({ documenti: { "tasks.md": suWorkflow } }));
  assert.ok(!codici(esito).includes("task-su-workflow"));
});

// --- la copertura dei requisiti non esclude i task fatto ----------------------

test("un requisito citato solo da un task fatto risulta ancora coperto", () => {
  const esito = verifica(cartella({ documenti: { "tasks.md": T001_FATTO } }));
  assert.ok(!codici(esito).includes("requisito-non-coperto"));
  assert.equal(esito.conteggi.requisitiCoperti, 3);
});
