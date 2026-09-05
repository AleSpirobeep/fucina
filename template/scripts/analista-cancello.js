"use strict";

// analista-cancello.js — la verifica che separa un'analisi da una coda di task.
//
// Data la cartella di una spec, dice se è consegnabile alla fucina: elenca i problemi
// bloccanti, uno per riga, e esce con codice 1 se ce n'è almeno uno (REQ-320, REQ-324).
// È deterministica e non chiama alcun modello: l'analista non può convincerla (P9).
//
// Uso:
//   node scripts/analista-cancello.js specs/004-analista [.fucina.yml]
//
// Vedi specs/004-analista/contracts/cancello.md per il contratto completo.

const fs = require("node:fs");
const path = require("node:path");

const MARCATORI_PUNTO_APERTO = [/\[NEEDS CLARIFICATION/i, /\[DA CHIARIRE/i];

// I documenti che devono esistere e non essere vuoti (REQ-312).
const DOCUMENTI_OBBLIGATORI = ["spec.md", "plan.md", "tasks.md", "checklists/requirements.md"];

// Le sezioni che spec.md deve avere, come titolo o come voce in grassetto (REQ-312).
const SEZIONI_OBBLIGATORIE = [
  "Input",
  "Chiarimenti",
  "Scenari d'uso",
  "Casi limite",
  "Requisiti",
  "Criteri di successo",
  "Assunzioni",
];

// La checklist parla dei marcatori invece di contenerne: non va scandagliata.
const NON_SCANDAGLIATI = ["checklists/requirements.md"];

const PERCORSO_WORKFLOW = ".github/workflows/";
const LABEL_TEST = "allow-test-changes";

const REQ_RE = /^\s*-\s*\*\*(REQ-\d{3})\*\*/;
const TASK_RE = /^\s*-\s*\[([ xX])\]\s*(T\d{3}[a-z]?)\b/;
const TITOLO_RE = /^(#{1,6})\s+(.*)$/;
const VERIFICA_RE = /verifica\s*:?\s*\*?\s*\S/i;
const CATENA_REQ_RE = /REQ-(\d{3})((?:\s*(?:\([^)]*\))?\s*,\s*\d{3})*)/g;
const PERCORSO_RE = /`([^`\s]+)`/g;

function righe(testo) {
  return String(testo || "").split(/\r?\n/);
}

function normalizza(testo) {
  return String(testo || "")
    .toLowerCase()
    .replace(/[*_`#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// --- lettura dei documenti ---------------------------------------------------

// Ogni punto ancora da chiarire è bloccante: l'analista non riempie i buchi (REQ-305, 321).
function puntiAperti(documenti) {
  const problemi = [];
  for (const nome of Object.keys(documenti).sort()) {
    if (NON_SCANDAGLIATI.includes(nome)) continue;
    righe(documenti[nome]).forEach((riga, indice) => {
      if (MARCATORI_PUNTO_APERTO.some((marcatore) => marcatore.test(riga))) {
        problemi.push({
          codice: "punto-aperto",
          file: nome,
          riga: indice + 1,
          messaggio: `punto ancora aperto: ${riga.trim().slice(0, 120)}`,
        });
      }
    });
  }
  return problemi;
}

function haSezione(testo, nome) {
  const cercata = normalizza(nome);
  return righe(testo).some((riga) => {
    const titolo = TITOLO_RE.exec(riga);
    if (titolo) return normalizza(titolo[2]).startsWith(cercata);
    const grassetto = /^\s*\*\*([^*]+)\*\*\s*:/.exec(riga);
    return Boolean(grassetto) && normalizza(grassetto[1]) === cercata;
  });
}

// Un requisito è un elenco puntato "- **REQ-NNN** — ...", seguito dalla sua riga di
// verifica. Il blocco finisce al requisito successivo o al titolo successivo.
function estraiRequisiti(testoSpec) {
  const elenco = [];
  let corrente = null;
  righe(testoSpec).forEach((riga, indice) => {
    const inizio = REQ_RE.exec(riga);
    if (inizio) {
      corrente = { id: inizio[1], riga: indice + 1, blocco: [riga] };
      elenco.push(corrente);
      return;
    }
    if (corrente && TITOLO_RE.test(riga)) {
      corrente = null;
      return;
    }
    if (corrente) corrente.blocco.push(riga);
  });
  return elenco.map((requisito) => ({
    id: requisito.id,
    riga: requisito.riga,
    haVerifica: requisito.blocco.slice(1).some((riga) => VERIFICA_RE.test(riga)),
  }));
}

// "REQ-210, 211, 212" è una catena sola: il primo identificativo esteso e i numeri che
// lo seguono, anche quando una parentesi si intromette ("213 (decisione), 214").
// Fuori dalla catena, un numero da solo non è un requisito.
function requisitiCitati(testo) {
  const citati = new Set();
  const sorgente = String(testo || "");
  CATENA_REQ_RE.lastIndex = 0;
  let trovato = CATENA_REQ_RE.exec(sorgente);
  while (trovato) {
    citati.add(`REQ-${trovato[1]}`);
    const coda = trovato[2] || "";
    for (const numero of coda.match(/\d{3}/g) || []) citati.add(`REQ-${numero}`);
    trovato = CATENA_REQ_RE.exec(sorgente);
  }
  return [...citati].sort();
}

function percorsiCitati(testo) {
  const percorsi = new Set();
  const sorgente = String(testo || "");
  PERCORSO_RE.lastIndex = 0;
  let trovato = PERCORSO_RE.exec(sorgente);
  while (trovato) {
    const candidato = trovato[1];
    if (candidato.includes("/")) percorsi.add(candidato);
    trovato = PERCORSO_RE.exec(sorgente);
  }
  return [...percorsi].sort();
}

// Un task è "- [ ] TNNN ...": la riga più quelle rientrate che la seguono. È manuale se
// lo dice con [MANUALE] o se sta sotto una fase dichiarata a cura di Alessio. È fatto se
// la sua casella è già spuntata «[x]»: quel task non riceverà mai più una PR.
function estraiTask(testoTasks) {
  const elenco = [];
  let corrente = null;
  let titolo = "";
  righe(testoTasks).forEach((riga, indice) => {
    const intestazione = TITOLO_RE.exec(riga);
    if (intestazione) {
      titolo = intestazione[2];
      corrente = null;
      return;
    }
    const inizio = TASK_RE.exec(riga);
    if (inizio) {
      corrente = {
        id: inizio[2],
        riga: indice + 1,
        titolo,
        blocco: [riga],
        fatto: /[xX]/.test(inizio[1]),
      };
      elenco.push(corrente);
      return;
    }
    if (corrente && /^\s*-\s/.test(riga)) {
      corrente = null;
      return;
    }
    if (corrente) corrente.blocco.push(riga);
  });

  return elenco.map((task) => {
    const testo = task.blocco.join("\n");
    const fase = normalizza(task.titolo);
    const manuale =
      /\[MANUALE\]/.test(testo) ||
      fase.includes("a cura di alessio") ||
      fase.includes("non sono issue") ||
      fase.includes("non è una issue");
    return {
      id: task.id,
      riga: task.riga,
      manuale,
      fatto: task.fatto,
      requisiti: requisitiCitati(testo),
      percorsi: percorsiCitati(testo),
      haVerifica: VERIFICA_RE.test(testo),
      dichiaraLabelTest: testo.includes(LABEL_TEST),
    };
  });
}

// --- configurazione ----------------------------------------------------------

// Lettura mirata di .fucina.yml: solo le due chiavi che il cancello guarda. Non è un
// parser YAML e non pretende di esserlo (nessuna dipendenza, come da CLAUDE.md).
function leggiConfigurazione(testoYml) {
  const elenco = righe(testoYml);
  let testCommand = "";
  const percorsiProtetti = [];
  let dentroPercorsi = false;

  for (const riga of elenco) {
    if (/^\s*#/.test(riga)) continue;

    const comando = /^test_command\s*:\s*(.*)$/.exec(riga);
    if (comando) {
      testCommand = spoglia(comando[1]);
      dentroPercorsi = false;
      continue;
    }

    if (/^percorsi_protetti\s*:/.test(riga)) {
      dentroPercorsi = true;
      continue;
    }

    if (dentroPercorsi) {
      const voce = /^\s+-\s*(.+?)\s*$/.exec(riga);
      if (voce) {
        percorsiProtetti.push(spoglia(voce[1]));
        continue;
      }
      if (riga.trim() !== "") dentroPercorsi = false;
    }
  }

  return { test_command: testCommand, percorsi_protetti: percorsiProtetti };
}

function spoglia(valore) {
  const testo = String(valore || "").trim().replace(/\s+#.*$/, "").trim();
  if (testo.length >= 2 && /^["']/.test(testo) && testo.slice(-1) === testo[0]) {
    return testo.slice(1, -1);
  }
  return testo;
}

// Confronto alla glob, con ** che attraversa le cartelle e * che si ferma alla barra.
function combacia(percorso, modello) {
  const parti = String(modello || "")
    .split("**")
    .map((parte) =>
      parte
        .split("*")
        .map((pezzo) => pezzo.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
        .join("[^/]*")
    );
  return new RegExp(`^${parti.join(".*")}$`).test(String(percorso || ""));
}

// --- la verifica -------------------------------------------------------------

function verifica({ documenti = {}, configurazione = {}, fileEsistenti = [] } = {}) {
  const esistenti = new Set(fileEsistenti);
  const problemi = [];
  const aggiungi = (codice, file, riga, messaggio) =>
    problemi.push({ codice, file, riga, messaggio });

  for (const nome of DOCUMENTI_OBBLIGATORI) {
    if (!documenti[nome] || String(documenti[nome]).trim() === "") {
      aggiungi("documento-mancante", nome, 0, `manca il documento obbligatorio ${nome}`);
    }
  }

  problemi.push(...puntiAperti(documenti));

  const spec = documenti["spec.md"] || "";
  for (const sezione of SEZIONI_OBBLIGATORIE) {
    if (spec.trim() !== "" && !haSezione(spec, sezione)) {
      aggiungi("sezione-mancante", "spec.md", 0, `manca la sezione «${sezione}»`);
    }
  }

  const requisiti = estraiRequisiti(spec);
  if (spec.trim() !== "" && requisiti.length === 0) {
    aggiungi("nessun-requisito", "spec.md", 0, "la specifica non contiene alcun requisito");
  }
  for (const requisito of requisiti) {
    if (!requisito.haVerifica) {
      aggiungi(
        "requisito-senza-verifica",
        "spec.md",
        requisito.riga,
        `${requisito.id} non ha una riga di verifica: un requisito non verificabile non è un requisito (P2)`
      );
    }
  }

  const task = estraiTask(documenti["tasks.md"] || "");
  const daLavorare = task.filter((voce) => !voce.manuale);
  if ((documenti["tasks.md"] || "").trim() !== "" && daLavorare.length === 0) {
    aggiungi("nessun-task", "tasks.md", 0, "non c'è alcun task da lavorare");
  }

  const visti = new Map();
  let precedente = 0;
  for (const voce of task) {
    if (visti.has(voce.id)) {
      aggiungi(
        "task-duplicato",
        "tasks.md",
        voce.riga,
        `${voce.id} compare già alla riga ${visti.get(voce.id)}`
      );
    } else {
      visti.set(voce.id, voce.riga);
    }
    const numero = Number(voce.id.slice(1, 4));
    if (numero < precedente) {
      aggiungi(
        "task-fuori-ordine",
        "tasks.md",
        voce.riga,
        `${voce.id} viene dopo un task con numero più alto: gli identificativi vanno in ordine`
      );
    }
    precedente = numero;
  }

  const idRequisiti = new Set(requisiti.map((requisito) => requisito.id));
  const coperti = new Set();

  for (const voce of daLavorare) {
    if (voce.requisiti.length === 0) {
      aggiungi(
        "task-senza-requisito",
        "tasks.md",
        voce.riga,
        `${voce.id} non rimanda ad alcun requisito: non si sa cosa stia realizzando`
      );
    }
    if (!voce.haVerifica) {
      aggiungi(
        "task-senza-criteri",
        "tasks.md",
        voce.riga,
        `${voce.id} non ha criteri di accettazione: manca la riga «Verifica:»`
      );
    }
    for (const id of voce.requisiti) {
      if (idRequisiti.has(id)) {
        coperti.add(id);
      } else if (spec.trim() !== "") {
        aggiungi(
          "requisito-inesistente",
          "tasks.md",
          voce.riga,
          `${voce.id} rimanda a ${id}, che in spec.md non esiste`
        );
      }
    }
    // I due controlli seguenti predicono un blocco del guard su una PR futura: un task
    // già fatto non ne aprirà mai più una, quindi non li riguardano.
    if (voce.fatto) continue;
    for (const percorso of voce.percorsi) {
      if (percorso.startsWith(PERCORSO_WORKFLOW)) {
        aggiungi(
          "task-su-workflow",
          "tasks.md",
          voce.riga,
          `${voce.id} tocca ${percorso}: l'agente sviluppatore non può scriverlo. Il file va in template/ e lo installa Alessio, oppure il task va marcato [MANUALE]`
        );
      }
      // Il guard blocca modifiche e cancellazioni, non le aggiunte: un file di test
      // nuovo si può scrivere, uno esistente no (guard-tests.yml, --diff-filter=MD).
      const protetto = (configurazione.percorsi_protetti || []).find((modello) =>
        combacia(percorso, modello)
      );
      if (protetto && esistenti.has(percorso) && !voce.dichiaraLabelTest) {
        aggiungi(
          "task-su-percorso-protetto",
          "tasks.md",
          voce.riga,
          `${voce.id} modifica ${percorso}, che esiste ed è protetto da «${protetto}»: il task deve dichiarare che serve la label ${LABEL_TEST}`
        );
      }
    }
  }

  for (const requisito of requisiti) {
    if (!coperti.has(requisito.id) && daLavorare.length > 0) {
      aggiungi(
        "requisito-non-coperto",
        "spec.md",
        requisito.riga,
        `${requisito.id} non è coperto da alcun task: resterebbe non realizzato`
      );
    }
  }

  if (!String(configurazione.test_command || "").trim()) {
    aggiungi(
      "test-command-vuoto",
      ".fucina.yml",
      0,
      "test_command è vuoto o assente: senza comando di test la CI non può fare da arbitro (P3)"
    );
  }

  return {
    esito: problemi.length === 0 ? "positivo" : "negativo",
    problemi,
    conteggi: {
      requisiti: requisiti.length,
      task: daLavorare.length,
      taskManuali: task.length - daLavorare.length,
      requisitiCoperti: coperti.size,
    },
  };
}

// --- input/uscita ------------------------------------------------------------

function leggiCartella(cartella, percorsoFucina) {
  const documenti = {};
  for (const nome of DOCUMENTI_OBBLIGATORI) {
    const percorso = path.join(cartella, nome);
    if (fs.existsSync(percorso)) documenti[nome] = fs.readFileSync(percorso, "utf8");
  }
  const contratti = path.join(cartella, "contracts");
  if (fs.existsSync(contratti)) {
    for (const nome of fs.readdirSync(contratti).sort()) {
      if (nome.endsWith(".md")) {
        documenti[`contracts/${nome}`] = fs.readFileSync(path.join(contratti, nome), "utf8");
      }
    }
  }
  const configurazione = fs.existsSync(percorsoFucina)
    ? leggiConfigurazione(fs.readFileSync(percorsoFucina, "utf8"))
    : { test_command: "", percorsi_protetti: [] };

  const radice = path.dirname(percorsoFucina) || ".";
  const fileEsistenti = [];
  for (const voce of estraiTask(documenti["tasks.md"] || "")) {
    for (const percorso of voce.percorsi) {
      if (fs.existsSync(path.join(radice, percorso))) fileEsistenti.push(percorso);
    }
  }

  return { documenti, configurazione, fileEsistenti };
}

function riferisci(esito) {
  const linee = [];
  for (const problema of esito.problemi) {
    const dove = problema.riga ? `${problema.file}:${problema.riga}` : problema.file;
    linee.push(`  [${problema.codice}] ${dove} — ${problema.messaggio}`);
  }
  if (esito.esito === "positivo") {
    linee.push(
      `Cancello verde: ${esito.conteggi.requisiti} requisiti, ${esito.conteggi.task} task da lavorare` +
        (esito.conteggi.taskManuali ? `, ${esito.conteggi.taskManuali} manuali` : "") +
        "."
    );
    linee.push("Resta la conferma di Alessio: la verifica da sola non consegna nulla.");
  } else {
    linee.unshift(`Cancello rosso: ${esito.problemi.length} problemi bloccanti.`);
    linee.push("Nessuna issue va creata finché questo elenco non è vuoto.");
  }
  return linee.join("\n");
}

function main(argomenti) {
  const cartella = argomenti[0];
  if (!cartella) {
    process.stderr.write("Uso: node analista-cancello.js <cartella-spec> [.fucina.yml]\n");
    return 2;
  }
  if (!fs.existsSync(cartella)) {
    process.stderr.write(`Errore: la cartella ${cartella} non esiste.\n`);
    return 2;
  }
  const percorsoFucina = argomenti[1] || ".fucina.yml";
  const esito = verifica(leggiCartella(cartella, percorsoFucina));
  process.stdout.write(riferisci(esito) + "\n");
  return esito.esito === "positivo" ? 0 : 1;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = {
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
  DOCUMENTI_OBBLIGATORI,
  SEZIONI_OBBLIGATORIE,
};
