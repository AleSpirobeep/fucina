"use strict";

// Vedi specs/003-pm-a-cicli/contracts/pm-coda.md per il contratto completo.

const LABEL_QUEUE = "in-coda";
const LABEL_NEEDS_REVIEW = "needs-review";
const LABEL_NEEDS_HUMAN = "needs-human";
const LABEL_READY = "ready-for-dev";
const LABEL_IN_PROGRESS = "in-progress";

const SEZIONE_RE = /^#{2,3}\s*(non fatto|fatto in più)\s*$/i;
const CLOSES_RE = /closes\s*#(\d+)/i;
const TASK_RE = /(?:^|[^A-Za-z0-9])(T\d{3,}[a-z]?)(?=$|[^A-Za-z0-9])/;
const TASK_ID_RE = /^T(\d+)([a-z]?)$/;

function estraiSezioniMancanti(corpo) {
  const righe = (corpo || "").split("\n");
  let haNonFatto = false;
  let haFattoInPiu = false;

  for (const riga of righe) {
    const corrispondenza = SEZIONE_RE.exec(riga.trim());
    if (!corrispondenza) continue;
    const titolo = corrispondenza[1].toLowerCase();
    if (titolo === "non fatto") haNonFatto = true;
    else if (titolo === "fatto in più") haFattoInPiu = true;
  }

  const mancanti = [];
  if (!haNonFatto) mancanti.push("Non fatto");
  if (!haFattoInPiu) mancanti.push("Fatto in più");
  return mancanti;
}

function identificativoTask(titolo) {
  const corrispondenza = TASK_RE.exec(titolo || "");
  return corrispondenza ? corrispondenza[1] : null;
}

function confrontaTask(a, b) {
  const pa = TASK_ID_RE.exec(a);
  const pb = TASK_ID_RE.exec(b);
  const na = parseInt(pa[1], 10);
  const nb = parseInt(pb[1], 10);
  if (na !== nb) return na - nb;
  return pa[2] < pb[2] ? -1 : pa[2] > pb[2] ? 1 : 0;
}

function issueDaCorpo(corpo) {
  const corrispondenza = CLOSES_RE.exec(corpo || "");
  return corrispondenza ? parseInt(corrispondenza[1], 10) : null;
}

function decidi(stato) {
  const rapporto = stato.rapporto;
  const pr = (stato.pr || []).filter((p) => p.numero !== rapporto);
  const issue = (stato.issue || []).filter((i) => i.numero !== rapporto);

  // 1: PR pronte per la revisione (needs-review, senza needs-human, non ancora viste dal PM)
  const candidatiRevisione = pr
    .filter((p) => (p.labels || []).includes(LABEL_NEEDS_REVIEW))
    .filter((p) => !(p.labels || []).includes(LABEL_NEEDS_HUMAN))
    .filter((p) => p.ultimoCommentoPm === false)
    .sort((a, b) => a.numero - b.numero);

  if (candidatiRevisione.length > 0) {
    const scelta = candidatiRevisione[0];
    const issueChiusa = issueDaCorpo(scelta.corpo);

    if (scelta.check === "rosso") {
      return {
        azione: "rimanda-check-rossi",
        numero: scelta.numero,
        motivo: `PR #${scelta.numero} con almeno un check rosso`,
        dettagli: { issue: issueChiusa },
      };
    }
    if (scelta.check === "in-corso") {
      return {
        azione: "attendi-check",
        numero: scelta.numero,
        motivo: `PR #${scelta.numero} con check ancora in corso`,
        dettagli: {},
      };
    }
    const mancanti = estraiSezioniMancanti(scelta.corpo);
    if (mancanti.length > 0) {
      return {
        azione: "rimanda-corpo-incompleto",
        numero: scelta.numero,
        motivo: `PR #${scelta.numero} senza la sezione ${mancanti.join(", ")}`,
        dettagli: { issue: issueChiusa, manca: mancanti },
      };
    }
    return {
      azione: "revisione",
      numero: scelta.numero,
      motivo: `PR #${scelta.numero} con check verdi e corpo completo`,
      dettagli: { issue: issueChiusa },
    };
  }

  // 2: issue needs-human non ancora viste dal PM
  const candidatiDomanda = issue
    .filter((i) => (i.labels || []).includes(LABEL_NEEDS_HUMAN))
    .filter((i) => i.ultimoCommentoPm === false)
    .sort((a, b) => a.numero - b.numero);

  if (candidatiDomanda.length > 0) {
    const scelta = candidatiDomanda[0];
    return {
      azione: "domanda",
      numero: scelta.numero,
      motivo: `Issue #${scelta.numero} needs-human in attesa di una decisione`,
      dettagli: {},
    };
  }

  // 3: avvio del prossimo task in coda, solo se nulla è già attivo
  const esisteAttivo = issue.some((i) => {
    const labels = i.labels || [];
    return (
      labels.includes(LABEL_READY) ||
      labels.includes(LABEL_IN_PROGRESS) ||
      labels.includes(LABEL_NEEDS_HUMAN)
    );
  });
  const esistePrAperta = pr.some((p) => (p.labels || []).includes(LABEL_NEEDS_REVIEW));

  if (!esisteAttivo && !esistePrAperta) {
    const inCoda = issue
      .filter((i) => (i.labels || []).includes(LABEL_QUEUE))
      .map((i) => ({ issue: i, id: identificativoTask(i.titolo) }))
      .filter((x) => x.id !== null)
      .sort((a, b) => confrontaTask(a.id, b.id));

    if (inCoda.length > 0) {
      const scelta = inCoda[0];
      return {
        azione: "avvia-task",
        numero: scelta.issue.numero,
        motivo: `Task ${scelta.id} è il prossimo in coda`,
        dettagli: { task: scelta.id },
      };
    }
  }

  // 4: nessuna azione
  return { azione: "niente", numero: null, motivo: "nessuna azione da compiere", dettagli: {} };
}

function main() {
  let raw = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    raw += chunk;
  });
  process.stdin.on("end", () => {
    let stato;
    try {
      stato = JSON.parse(raw);
    } catch (errore) {
      process.stderr.write("Errore: l'input non è JSON valido.\n");
      process.exitCode = 2;
      return;
    }
    if (!stato || typeof stato !== "object" || !("pr" in stato) || !("issue" in stato)) {
      process.stderr.write("Errore: lo stato deve avere le chiavi 'pr' e 'issue'.\n");
      process.exitCode = 2;
      return;
    }
    process.stdout.write(JSON.stringify(decidi(stato)) + "\n");
  });
}

if (require.main === module) {
  main();
}

module.exports = { decidi, estraiSezioniMancanti, identificativoTask };
