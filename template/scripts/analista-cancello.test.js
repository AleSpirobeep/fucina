"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const {
  verifica,
  estraiRequisiti,
  estraiTask,
  requisitiCitati,
  percorsiCitati,
  puntiAperti,
  haSezione,
  leggiConfigurazione,
  combacia,
  riferisci,
} = require("./analista-cancello.js");

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

// Una cartella completa e sana, da cui ogni caso negativo deriva con un solo difetto.
function cartella(modifiche = {}) {
  const documenti = {
    "spec.md": SPEC,
    "plan.md": PLAN,
    "tasks.md": TASKS,
    "checklists/requirements.md": CHECKLIST,
    ...(modifiche.documenti || {}),
  };
  for (const [nome, valore] of Object.entries(modifiche.documenti || {})) {
    if (valore === null) delete documenti[nome];
  }
  return {
    documenti,
    configurazione: modifiche.configurazione || CONFIGURAZIONE,
    fileEsistenti: modifiche.fileEsistenti || [],
  };
}

function codici(esito) {
  return esito.problemi.map((problema) => problema.codice);
}

// --- il caso verde -----------------------------------------------------------

test("una cartella completa passa il cancello", () => {
  const esito = verifica(cartella());
  assert.deepEqual(esito.problemi, []);
  assert.equal(esito.esito, "positivo");
  assert.equal(esito.conteggi.requisiti, 3);
  assert.equal(esito.conteggi.task, 2);
  assert.equal(esito.conteggi.taskManuali, 1);
  assert.equal(esito.conteggi.requisitiCoperti, 3);
});

test("il marcatore nella checklist non è un punto aperto: la checklist ne parla, non ne contiene", () => {
  assert.match(CHECKLIST, /NEEDS CLARIFICATION/);
  assert.deepEqual(puntiAperti({ "checklists/requirements.md": CHECKLIST }), []);
});

// --- un caso negativo per ciascun problema bloccante (REQ-321) ---------------

test("punto aperto: un marcatore in spec.md blocca, con file e riga", () => {
  const guasta = SPEC.replace(
    "- **REQ-903** — Lo stato della luce è leggibile in ogni momento.",
    "- **REQ-903** — Lo stato della luce è leggibile [NEEDS CLARIFICATION: ogni quanto?]."
  );
  const esito = verifica(cartella({ documenti: { "spec.md": guasta } }));
  const problema = esito.problemi.find((voce) => voce.codice === "punto-aperto");
  assert.equal(esito.esito, "negativo");
  assert.equal(problema.file, "spec.md");
  assert.ok(problema.riga > 0);
});

test("punto aperto: anche il marcatore in italiano blocca", () => {
  const guasta = `${PLAN}\n\nDove metterlo: [DA CHIARIRE con Alessio].\n`;
  assert.equal(puntiAperti({ "plan.md": guasta }).length, 1);
});

test("documento mancante: senza plan.md il cancello è rosso", () => {
  const esito = verifica(cartella({ documenti: { "plan.md": null } }));
  assert.ok(codici(esito).includes("documento-mancante"));
});

test("documento mancante: un file vuoto conta come mancante", () => {
  const esito = verifica(cartella({ documenti: { "plan.md": "   \n" } }));
  assert.ok(codici(esito).includes("documento-mancante"));
});

test("sezione mancante: senza «Assunzioni» il cancello è rosso e la nomina", () => {
  const guasta = SPEC.replace("## Assunzioni", "## Note sparse");
  const esito = verifica(cartella({ documenti: { "spec.md": guasta } }));
  const problema = esito.problemi.find((voce) => voce.codice === "sezione-mancante");
  assert.match(problema.messaggio, /Assunzioni/);
});

test("requisito senza verifica: P2 applicato riga per riga", () => {
  const guasta = SPEC.replace("  *Verifica:* premere il pulsante due volte: nessun errore.\n", "");
  const esito = verifica(cartella({ documenti: { "spec.md": guasta } }));
  const problema = esito.problemi.find((voce) => voce.codice === "requisito-senza-verifica");
  assert.match(problema.messaggio, /REQ-902/);
});

test("task senza criteri: manca la riga di verifica", () => {
  const guasta = TASKS.replace(
    "      Verifica: la funzione restituisce `acceso` o `spento` e nient'altro.\n",
    ""
  );
  const esito = verifica(cartella({ documenti: { "tasks.md": guasta } }));
  const problema = esito.problemi.find((voce) => voce.codice === "task-senza-criteri");
  assert.match(problema.messaggio, /T002/);
});

test("task senza requisito: non si sa cosa stia realizzando", () => {
  const guasta = TASKS.replace(" (REQ-903)", "");
  const esito = verifica(cartella({ documenti: { "tasks.md": guasta } }));
  assert.ok(codici(esito).includes("task-senza-requisito"));
});

test("requisito non coperto: nessun task lo realizza", () => {
  const guasta = TASKS.replace(" (REQ-903)", " (REQ-901)");
  const esito = verifica(cartella({ documenti: { "tasks.md": guasta } }));
  const problema = esito.problemi.find((voce) => voce.codice === "requisito-non-coperto");
  assert.match(problema.messaggio, /REQ-903/);
  assert.equal(problema.file, "spec.md");
});

test("requisito inesistente: il task rimanda a un REQ che in spec.md non c'è", () => {
  const guasta = TASKS.replace("(REQ-903)", "(REQ-999)");
  const esito = verifica(cartella({ documenti: { "tasks.md": guasta } }));
  const problema = esito.problemi.find((voce) => voce.codice === "requisito-inesistente");
  assert.match(problema.messaggio, /REQ-999/);
});

test("task duplicato: due T001 nella stessa lista", () => {
  const guasta = TASKS.replace("- [ ] T002", "- [ ] T001");
  const esito = verifica(cartella({ documenti: { "tasks.md": guasta } }));
  assert.ok(codici(esito).includes("task-duplicato"));
});

test("task fuori ordine: gli identificativi vanno crescendo", () => {
  const guasta = TASKS.replace("- [ ] T002", "- [ ] T000");
  const esito = verifica(cartella({ documenti: { "tasks.md": guasta } }));
  assert.ok(codici(esito).includes("task-fuori-ordine"));
});

test("nessun task da lavorare: solo fasi manuali", () => {
  const guasta = "# Task\n\n## Fase 1 (a cura di Alessio — non sono issue)\n\n- [ ] T001 Provare a mano.\n";
  const esito = verifica(cartella({ documenti: { "tasks.md": guasta } }));
  assert.ok(codici(esito).includes("nessun-task"));
});

test("test_command vuoto: senza arbitro la CI non verifica nulla (P3)", () => {
  const esito = verifica(
    cartella({ configurazione: { test_command: "", percorsi_protetti: [] } })
  );
  const problema = esito.problemi.find((voce) => voce.codice === "test-command-vuoto");
  assert.equal(problema.file, ".fucina.yml");
});

test("task su workflow: l'agente sviluppatore non può scrivere .github/workflows/", () => {
  const guasta = TASKS.replace(
    "Lettura dello stato in `luce/stato.js` (REQ-903).",
    "Nuovo `.github/workflows/luce.yml` (REQ-903)."
  );
  const esito = verifica(cartella({ documenti: { "tasks.md": guasta } }));
  const problema = esito.problemi.find((voce) => voce.codice === "task-su-workflow");
  assert.match(problema.messaggio, /template\//);
});

test("task su workflow marcato [MANUALE]: passa, perché lo installa Alessio", () => {
  const guasta = TASKS.replace(
    "- [ ] T002 Lettura dello stato in `luce/stato.js` (REQ-903).",
    "- [ ] T002 [MANUALE] Nuovo `.github/workflows/luce.yml` e lettura in `luce/stato.js` (REQ-903)."
  );
  const esito = verifica(cartella({ documenti: { "tasks.md": guasta } }));
  assert.ok(!codici(esito).includes("task-su-workflow"));
  // Marcato manuale, il task non copre più REQ-903: il cancello lo dice comunque.
  assert.ok(codici(esito).includes("requisito-non-coperto"));
});

test("task su percorso protetto esistente: serve la label dichiarata", () => {
  const esito = verifica(cartella({ fileEsistenti: ["luce/interruttore.test.js"] }));
  const problema = esito.problemi.find((voce) => voce.codice === "task-su-percorso-protetto");
  assert.match(problema.messaggio, /allow-test-changes/);
});

test("task su percorso protetto esistente, con la label dichiarata: passa", () => {
  const guasta = TASKS.replace(
    "      Verifica: `node --test` verde; due pressioni consecutive non sollevano errore.",
    "      Serve la label allow-test-changes.\n      Verifica: `node --test` verde."
  );
  const esito = verifica(
    cartella({
      documenti: { "tasks.md": guasta },
      fileEsistenti: ["luce/interruttore.test.js"],
    })
  );
  assert.ok(!codici(esito).includes("task-su-percorso-protetto"));
});

test("un file di test nuovo non è una modifica: il guard lascia passare le aggiunte", () => {
  const esito = verifica(cartella({ fileEsistenti: [] }));
  assert.ok(!codici(esito).includes("task-su-percorso-protetto"));
});

// --- le funzioni pure --------------------------------------------------------

test("estraiRequisiti trova identificativo, riga e presenza della verifica", () => {
  const requisiti = estraiRequisiti(SPEC);
  assert.deepEqual(
    requisiti.map((voce) => voce.id),
    ["REQ-901", "REQ-902", "REQ-903"]
  );
  assert.ok(requisiti.every((voce) => voce.haVerifica));
  assert.ok(requisiti[0].riga > 0);
});

test("estraiRequisiti non attribuisce a un requisito la verifica di un'altra sezione", () => {
  const testo = "## Requisiti\n\n- **REQ-901** — Qualcosa.\n\n## Note\n\nVerifica: altrove.\n";
  assert.equal(estraiRequisiti(testo)[0].haVerifica, false);
});

test("estraiTask distingue i task da lavorare da quelli manuali", () => {
  const task = estraiTask(TASKS);
  assert.deepEqual(
    task.map((voce) => voce.id),
    ["T001", "T002", "T003"]
  );
  assert.deepEqual(
    task.map((voce) => voce.manuale),
    [false, false, true]
  );
});

test("requisitiCitati espande la catena REQ-901, 902", () => {
  assert.deepEqual(requisitiCitati("Copre REQ-901, 902."), ["REQ-901", "REQ-902"]);
  assert.deepEqual(requisitiCitati("(REQ-903)"), ["REQ-903"]);
  assert.deepEqual(requisitiCitati("nessun riferimento"), []);
});

test("requisitiCitati non scambia per requisito un numero isolato", () => {
  assert.deepEqual(requisitiCitati("entro 903 millisecondi"), []);
});

test("percorsiCitati prende solo i percorsi tra apici inversi", () => {
  const percorsi = percorsiCitati("Vedi `luce/stato.js` e `acceso`, non `spento`.");
  assert.deepEqual(percorsi, ["luce/stato.js"]);
});

test("haSezione riconosce sia un titolo sia una voce in grassetto", () => {
  assert.equal(haSezione(SPEC, "Input"), true);
  assert.equal(haSezione(SPEC, "Requisiti"), true);
  assert.equal(haSezione(SPEC, "Fuori ambito"), false);
});

test("leggiConfigurazione prende test_command e percorsi_protetti, ignorando i commenti", () => {
  assert.equal(CONFIGURAZIONE.test_command, 'node --test "luce/**/*.test.js"');
  assert.deepEqual(CONFIGURAZIONE.percorsi_protetti, ["luce/*.test.js", ".github/workflows/**"]);
});

test("leggiConfigurazione su un file senza le due chiavi restituisce valori vuoti", () => {
  const vuota = leggiConfigurazione("version: 1\n# test_command: commentato\n");
  assert.equal(vuota.test_command, "");
  assert.deepEqual(vuota.percorsi_protetti, []);
});

test("combacia: * si ferma alla barra, ** la attraversa", () => {
  assert.equal(combacia("luce/stato.test.js", "luce/*.test.js"), true);
  assert.equal(combacia("luce/dentro/stato.test.js", "luce/*.test.js"), false);
  assert.equal(combacia("luce/dentro/stato.test.js", "luce/**/*.test.js"), true);
  assert.equal(combacia(".github/workflows/ci.yml", ".github/workflows/**"), true);
  assert.equal(combacia("luce/stato.js", "luce/*.test.js"), false);
});

test("riferisci elenca i problemi e ricorda che la verifica da sola non consegna", () => {
  const verde = riferisci(verifica(cartella()));
  assert.match(verde, /Cancello verde/);
  assert.match(verde, /conferma di Alessio/);

  const rosso = riferisci(verifica(cartella({ documenti: { "plan.md": null } })));
  assert.match(rosso, /Cancello rosso/);
  assert.match(rosso, /documento-mancante/);
  assert.match(rosso, /Nessuna issue/);
});

// --- la riga di comando (REQ-324) --------------------------------------------

function cartellaTemporanea(documenti) {
  const radice = fs.mkdtempSync(path.join(os.tmpdir(), "analista-"));
  const spec = path.join(radice, "specs", "009-esempio");
  fs.mkdirSync(path.join(spec, "checklists"), { recursive: true });
  for (const [nome, testo] of Object.entries(documenti)) {
    fs.writeFileSync(path.join(spec, nome), testo, "utf8");
  }
  fs.writeFileSync(path.join(radice, ".fucina.yml"), leggi("analista-fucina.yml"), "utf8");
  return { radice, spec };
}

function esegui(radice, spec) {
  return spawnSync(process.execPath, [SCRIPT, spec, path.join(radice, ".fucina.yml")], {
    encoding: "utf8",
  });
}

test("da riga di comando: cartella completa, esce 0", () => {
  const { radice, spec } = cartellaTemporanea({
    "spec.md": SPEC,
    "plan.md": PLAN,
    "tasks.md": TASKS,
    "checklists/requirements.md": CHECKLIST,
  });
  const esito = esegui(radice, spec);
  assert.equal(esito.status, 0);
  assert.match(esito.stdout, /Cancello verde/);
});

test("da riga di comando: cartella difettosa, stampa i problemi ed esce 1", () => {
  const { radice, spec } = cartellaTemporanea({
    "spec.md": SPEC,
    "tasks.md": TASKS,
    "checklists/requirements.md": CHECKLIST,
  });
  const esito = esegui(radice, spec);
  assert.equal(esito.status, 1);
  assert.match(esito.stdout, /plan\.md/);
});

test("da riga di comando: senza argomenti esce 2 con l'uso", () => {
  const esito = spawnSync(process.execPath, [SCRIPT], { encoding: "utf8" });
  assert.equal(esito.status, 2);
  assert.match(esito.stderr, /Uso:/);
});

test("da riga di comando: una cartella inesistente esce 2", () => {
  const esito = spawnSync(process.execPath, [SCRIPT, "specs/999-non-esiste"], {
    encoding: "utf8",
  });
  assert.equal(esito.status, 2);
  assert.match(esito.stderr, /non esiste/);
});

test("requisitiCitati regge una parentesi in mezzo alla catena", () => {
  assert.deepEqual(
    requisitiCitati("Copre REQ-210, 211, 212, 213 (decisione), 214 (decisione), 215, 216."),
    ["REQ-210", "REQ-211", "REQ-212", "REQ-213", "REQ-214", "REQ-215", "REQ-216"]
  );
});

test("requisitiCitati non salta a un numero dopo una frase intera", () => {
  assert.deepEqual(requisitiCitati("Copre REQ-210. Il tetto è 215 minuti."), ["REQ-210"]);
});
