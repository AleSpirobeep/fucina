export function versione() {
  return "0.1.0";
}

export function parseElencoRepo(testo) {
  return (testo || "")
    .split("\n")
    .map((riga) => riga.trim())
    .filter((riga) => riga.length > 0);
}

export function validaRepo(repo) {
  return /^[\w.-]+\/[\w.-]+$/.test(repo);
}

export function validaElencoRepo(testo) {
  const repos = parseElencoRepo(testo);
  if (repos.length === 0) {
    return { ok: false, repos: [], errore: "Inserisci almeno un repo." };
  }

  const nonValidi = repos.filter((repo) => !validaRepo(repo));
  if (nonValidi.length > 0) {
    return {
      ok: false,
      repos: [],
      errore: `Formato non valido (usa proprietario/nome): ${nonValidi.join(", ")}`,
    };
  }

  return { ok: true, repos, errore: null };
}

export function configurazioneValida({ repoTesto, token }) {
  return validaElencoRepo(repoTesto).ok && typeof token === "string" && token.trim().length > 0;
}

const GIORNI_FATTE = 14;
const MS_AL_GIORNO = 24 * 60 * 60 * 1000;

function nomiLabel(elemento) {
  return (elemento.labels || []).map((label) => (typeof label === "string" ? label : label.name));
}

function statoPiuAvanzato(nomi) {
  if (nomi.includes("needs-human")) return "bloccate";
  if (nomi.includes("in-progress")) return "inLavorazione";
  if (nomi.includes("ready-for-dev")) return "pronte";
  return "backlog";
}

const API_BASE = "https://api.github.com";

export function urlIssueAperte(repo) {
  return `${API_BASE}/repos/${repo}/issues?state=open&per_page=100`;
}

export function urlIssueChiuseDiRecente(repo) {
  return `${API_BASE}/repos/${repo}/issues?state=closed&sort=updated&direction=desc&per_page=100`;
}

export function urlPrAperte(repo) {
  return `${API_BASE}/repos/${repo}/pulls?state=open&per_page=100`;
}

export function urlCommentiIssue(repo, numero) {
  return `${API_BASE}/repos/${repo}/issues/${numero}/comments`;
}

export function urlCheckRuns(repo, ref) {
  return `${API_BASE}/repos/${repo}/commits/${ref}/check-runs`;
}

export function urlRunWorkflow(repo) {
  return `${API_BASE}/repos/${repo}/actions/workflows/dev-agent.yml/runs?per_page=50`;
}

export class ErroreGitHub extends Error {
  constructor(codice, messaggio) {
    super(messaggio);
    this.codice = codice;
  }
}

export function messaggioErroreHttp(status, repo) {
  if (status === 401) return "Token non valido o scaduto.";
  if (status === 404) return `Il repository ${repo} non esiste o non è raggiungibile.`;
  return `Richiesta a GitHub fallita (codice ${status}).`;
}

// Le run duplicano gli eventi (push, pull_request) sullo stesso commit: si aggregano tutte.
// Un rosso prevale sempre su un'attesa, anche se altre run dello stesso batch sono ancora in corso.
const CONCLUSIONI_ROSSE = new Set([
  "failure",
  "timed_out",
  "cancelled",
  "action_required",
  "startup_failure",
]);

export function interpretaStatoCheckRuns(checkRuns) {
  const run = checkRuns || [];
  if (run.length === 0) return "in attesa";

  let inAttesa = false;
  for (const r of run) {
    if (r.status !== "completed") {
      inAttesa = true;
      continue;
    }
    if (CONCLUSIONI_ROSSE.has(r.conclusion)) return "rosso";
  }

  return inAttesa ? "in attesa" : "verde";
}

export function classifica(issues, prs, oggi) {
  const risultato = {
    backlog: [],
    pronte: [],
    inLavorazione: [],
    inRevisione: [],
    bloccate: [],
    fatte: [],
  };

  const oggiMs = new Date(oggi).getTime();

  for (const issue of issues || []) {
    if (issue.pull_request) continue; // le PR mischiate nell'elenco issue non vanno mai in backlog

    if (issue.state === "closed") {
      if (!issue.closed_at) continue;
      const etaMs = oggiMs - new Date(issue.closed_at).getTime();
      if (etaMs >= 0 && etaMs <= GIORNI_FATTE * MS_AL_GIORNO) {
        risultato.fatte.push(issue);
      }
      continue;
    }

    risultato[statoPiuAvanzato(nomiLabel(issue))].push(issue);
  }

  for (const pr of prs || []) {
    if (pr.state !== "open") continue;
    if (nomiLabel(pr).includes("needs-review")) {
      risultato.inRevisione.push(pr);
    }
  }

  return risultato;
}
