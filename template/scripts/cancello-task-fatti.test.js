"use strict";

// I task che il cancello ha già visto fondere non devono produrre rilievi che
// predicono una PR futura: quella PR non esisterà mai più (issue #107, REQ-321,
// REQ-324). Il file di test del cancello, analista-cancello.test.js, è protetto e
// non si tocca: questi test stanno a fianco, in un file nuovo.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const { verifica, estraiTask, leggiConfigurazione } = require("./analista-cancello.js");

const FIXTURES = path.join(__dirname, "fixtures");
const SCRIPT = path.join(__dirname, "analista-cancello.js");

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

test("estraiTask espone fatto: spuntato per [x] e [X], non spuntato per [ ]", () => {
  const testo = ["- [ ] T001 Uno.", "- [x] T002 Due.", "- [X] T003 Tre."].join("\n");
  const task = estraiTask(testo);
  assert.deepEqual(
    task.map((voce) => [voce.id, voce.fatto]),
    [
      ["T001", false],
      ["T002", true],
      ["T003", true],
    ]
  );
});

test("task su percorso protetto: fatto non produce rilievo, la stessa casella aperta sì", () => {
  const fatto = TASKS.replace(
    "- [ ] T001 Funzione",
    "- [x] T001 Funzione"
  );
  const esitoFatto = verifica(
    cartella({ documenti: { "tasks.md": fatto }, fileEsistenti: ["luce/interruttore.test.js"] })
  );
  assert.ok(!codici(esitoFatto).includes("task-su-percorso-protetto"));

  const esitoAperto = verifica(cartella({ fileEsistenti: ["luce/interruttore.test.js"] }));
  assert.ok(codici(esitoAperto).includes("task-su-percorso-protetto"));
});

test("task su workflow: fatto non produce rilievo, la stessa casella aperta sì", () => {
  const base = TASKS.replace(
    "- [ ] T002 Lettura dello stato in `luce/stato.js` (REQ-903).",
    "- [ ] T002 Nuovo `.github/workflows/luce.yml` (REQ-903)."
  );
  const fatto = base.replace(
    "- [ ] T002 Nuovo `.github/workflows/luce.yml` (REQ-903).",
    "- [x] T002 Nuovo `.github/workflows/luce.yml` (REQ-903)."
  );

  const esitoFatto = verifica(cartella({ documenti: { "tasks.md": fatto } }));
  assert.ok(!codici(esitoFatto).includes("task-su-workflow"));

  const esitoAperto = verifica(cartella({ documenti: { "tasks.md": base } }));
  assert.ok(codici(esitoAperto).includes("task-su-workflow"));
});

test("requisito citato solo da un task fatto resta coperto", () => {
  const fatto = TASKS.replace(
    "- [ ] T002 Lettura dello stato in `luce/stato.js` (REQ-903).",
    "- [x] T002 Lettura dello stato in `luce/stato.js` (REQ-903)."
  );
  const esito = verifica(cartella({ documenti: { "tasks.md": fatto } }));
  assert.ok(!codici(esito).includes("requisito-non-coperto"));
  assert.equal(esito.conteggi.requisitiCoperti, 3);
});

test("script a riga di comando: T001 fuso (casella [x]) non blocca più il cancello", () => {
  const cartellaTemp = fs.mkdtempSync(path.join(os.tmpdir(), "cancello-task-fatti-"));
  try {
    const specDir = path.join(cartellaTemp, "specs", "009-esempio");
    fs.mkdirSync(path.join(specDir, "checklists"), { recursive: true });
    fs.mkdirSync(path.join(cartellaTemp, "luce"), { recursive: true });
    fs.writeFileSync(path.join(specDir, "spec.md"), SPEC);
    fs.writeFileSync(path.join(specDir, "plan.md"), PLAN);
    fs.writeFileSync(path.join(specDir, "checklists", "requirements.md"), CHECKLIST);
    fs.writeFileSync(path.join(cartellaTemp, ".fucina.yml"), leggi("analista-fucina.yml"));
    // Il file protetto esiste già, in cima al repo: T001 lo ha creato in una fusione
    // precedente. I percorsi dei task sono relativi alla radice del repo, non alla spec.
    fs.writeFileSync(path.join(cartellaTemp, "luce", "interruttore.test.js"), "// test già fuso\n");
    const fucinaYml = path.join(cartellaTemp, ".fucina.yml");

    fs.writeFileSync(path.join(specDir, "tasks.md"), TASKS);
    const esitoAperto = spawnSync(process.execPath, [SCRIPT, specDir, fucinaYml]);
    assert.equal(esitoAperto.status, 1);

    const tasksFatti = TASKS.replace("- [ ] T001 Funzione", "- [x] T001 Funzione");
    fs.writeFileSync(path.join(specDir, "tasks.md"), tasksFatti);
    const esitoFatto = spawnSync(process.execPath, [SCRIPT, specDir, fucinaYml]);
    assert.equal(esitoFatto.status, 0);
  } finally {
    fs.rmSync(cartellaTemp, { recursive: true, force: true });
  }
});
