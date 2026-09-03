import {
  ErroreGitHub,
  messaggioErroreHttp,
  interpretaStatoCheckRuns,
  urlIssueAperte,
  urlIssueChiuseDiRecente,
  urlPrAperte,
  urlCommentiIssue,
  urlCheckRuns,
  urlRunWorkflow,
} from "./lib.js";

async function richiesta(url, token, repo) {
  if (!token) {
    throw new ErroreGitHub("TOKEN_MANCANTE", "Token mancante.");
  }

  const risposta = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!risposta.ok) {
    throw new ErroreGitHub(risposta.status, messaggioErroreHttp(risposta.status, repo));
  }

  return risposta.json();
}

export function issueAperte(token, repo) {
  return richiesta(urlIssueAperte(repo), token, repo);
}

export function issueChiuseDiRecente(token, repo) {
  return richiesta(urlIssueChiuseDiRecente(repo), token, repo);
}

export function prAperte(token, repo) {
  return richiesta(urlPrAperte(repo), token, repo);
}

export function commentiIssue(token, repo, numero) {
  return richiesta(urlCommentiIssue(repo, numero), token, repo);
}

export async function statoCheckPr(token, repo, ref) {
  const dati = await richiesta(urlCheckRuns(repo, ref), token, repo);
  return interpretaStatoCheckRuns(dati.check_runs);
}

export async function runWorkflow(token, repo) {
  const dati = await richiesta(urlRunWorkflow(repo), token, repo);
  return dati.workflow_runs;
}
