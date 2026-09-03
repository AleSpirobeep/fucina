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

export function dataIsoGiorniFa(giorni, oggi = new Date()) {
  const oggiMs = new Date(oggi).getTime();
  return new Date(oggiMs - giorni * MS_AL_GIORNO).toISOString();
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

// --- Client per l'API di GitHub: parte pura (URL, interpretazione di stati ed errori). ---
// Le chiamate fetch vere e proprie sono in github.js, che usa queste funzioni.

const API_GITHUB = "https://api.github.com";

export function urlIssueRepo(repo, { stato = "open", since } = {}) {
  const parametri = new URLSearchParams({ state: stato, per_page: "100" });
  if (since) parametri.set("since", since);
  return `${API_GITHUB}/repos/${repo}/issues?${parametri}`;
}

export function urlPrRepo(repo, { stato = "open" } = {}) {
  const parametri = new URLSearchParams({ state: stato, per_page: "100" });
  return `${API_GITHUB}/repos/${repo}/pulls?${parametri}`;
}

export function urlCommentiIssue(repo, numero) {
  return `${API_GITHUB}/repos/${repo}/issues/${numero}/comments`;
}

export function urlStatoCheckPr(repo, ref) {
  return `${API_GITHUB}/repos/${repo}/commits/${ref}/status`;
}

export function urlRunWorkflow(repo, workflowFile = "dev-agent.yml") {
  const parametri = new URLSearchParams({ per_page: "20" });
  return `${API_GITHUB}/repos/${repo}/actions/workflows/${workflowFile}/runs?${parametri}`;
}

export function interpretaStatoCheck(statoCombinato) {
  switch (statoCombinato) {
    case "success":
      return "verde";
    case "failure":
    case "error":
      return "rosso";
    default:
      return "in attesa";
  }
}

export function interpretaErroreHttp(status, repo) {
  if (status === 401) {
    return { codice: 401, messaggio: "Token non valido o scaduto." };
  }
  if (status === 404) {
    return {
      codice: 404,
      messaggio: `Il repo ${repo} non esiste o non è raggiungibile.`,
    };
  }
  return {
    codice: status,
    messaggio: `Richiesta a GitHub fallita (codice ${status}).`,
  };
}

export class ErroreGitHub extends Error {
  constructor(codice, messaggio) {
    super(messaggio);
    this.name = "ErroreGitHub";
    this.codice = codice;
  }
}
