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
