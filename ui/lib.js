export function versione() {
  return "0.1.0";
}

const INTESTAZIONI_SEZIONI = {
  "Non fatto": "nonFatto",
  "Fatto in più": "fattoInPiu",
  "Decisioni": "decisioni",
};

// Il workflow accoda `Closes #N` (ed eventualmente una riga "Generated with
// Claude Code ...") dopo l'ultima sezione del corpo (ADR 2026-09-02-1700):
// non fa parte del testo della sezione che precede.
const CODA_WORKFLOW_RE = /^(Closes #\d+|Generated with Claude Code\b.*)$/;

function rimuoviCodaWorkflow(testo) {
  const righe = testo.split("\n");
  while (righe.length > 0) {
    const ultima = righe[righe.length - 1].trim();
    if (ultima === "" || CODA_WORKFLOW_RE.test(ultima)) {
      righe.pop();
      continue;
    }
    break;
  }
  return righe.join("\n");
}

export function estraiSezioni(corpo) {
  const testo = rimuoviCodaWorkflow(corpo || "");
  const risultato = { nonFatto: null, fattoInPiu: null, decisioni: null };

  const corrispondenze = [...testo.matchAll(/^## (.+)$/gm)];

  for (let i = 0; i < corrispondenze.length; i++) {
    const corrispondenza = corrispondenze[i];
    const chiave = INTESTAZIONI_SEZIONI[corrispondenza[1].trim()];
    if (!chiave) continue;

    const inizio = corrispondenza.index + corrispondenza[0].length;
    const fine = i + 1 < corrispondenze.length ? corrispondenze[i + 1].index : testo.length;
    risultato[chiave] = testo.slice(inizio, fine).trim();
  }

  return risultato;
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

export const COLONNE_AVANZAMENTO = [
  { chiave: "backlog", etichetta: "Backlog" },
  { chiave: "pronte", etichetta: "Pronte" },
  { chiave: "inLavorazione", etichetta: "In lavorazione" },
  { chiave: "inRevisione", etichetta: "In revisione" },
  { chiave: "bloccate", etichetta: "Bloccate" },
  { chiave: "fatte", etichetta: "Fatte" },
];

export function tabellaAvanzamento(classificazione) {
  return COLONNE_AVANZAMENTO.map(({ chiave, etichetta }) => {
    const elementi = (classificazione[chiave] || []).map((elemento) => ({
      titolo: elemento.title,
      url: elemento.html_url,
    }));
    return { chiave, etichetta, conteggio: elementi.length, elementi };
  });
}

const STATI_RUN_ATTIVI = new Set(["in_progress", "queued"]);

export function agentiAttivi(runs) {
  return (runs || [])
    .filter((run) => STATI_RUN_ATTIVI.has(run.status))
    .map((run) => ({
      titolo: run.display_title,
      url: run.html_url,
      avviatoA: run.run_started_at,
    }));
}

const MS_AL_MINUTO = 60 * 1000;
const MINUTI_ALL_ORA = 60;

export function formattaTempoTrascorso(avviatoA, adesso) {
  const minuti = Math.max(
    0,
    Math.floor((new Date(adesso).getTime() - new Date(avviatoA).getTime()) / MS_AL_MINUTO),
  );

  if (minuti < 1) return "meno di 1 min";
  if (minuti < MINUTI_ALL_ORA) return `${minuti} min`;

  const ore = Math.floor(minuti / MINUTI_ALL_ORA);
  const minutiResto = minuti % MINUTI_ALL_ORA;
  return minutiResto === 0 ? `${ore} h` : `${ore} h ${minutiResto} min`;
}
