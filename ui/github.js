// Client per l'API di GitHub: funzioni sottili, ognuna fa una sola chiamata fetch.
// La costruzione delle URL e l'interpretazione di stati ed errori vive in lib.js,
// dove è testabile senza rete e senza browser.
import {
  urlIssueRepo,
  urlPrRepo,
  urlCommentiIssue,
  urlStatoCheckPr,
  urlRunWorkflow,
  interpretaErroreHttp,
  interpretaStatoCheck,
  dataIsoGiorniFa,
  ErroreGitHub,
} from "./lib.js";

const GIORNI_CHIUSE_DI_RECENTE = 14;

async function richiediGitHub(url, token, repo) {
  if (!token) {
    throw new ErroreGitHub(0, "Token mancante.");
  }

  const risposta = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!risposta.ok) {
    const { codice, messaggio } = interpretaErroreHttp(risposta.status, repo);
    throw new ErroreGitHub(codice, messaggio);
  }

  return risposta.json();
}

export function issueAperte(repo, token) {
  return richiediGitHub(urlIssueRepo(repo, { stato: "open" }), token, repo);
}

export function issueChiuseDiRecente(repo, token, giorni = GIORNI_CHIUSE_DI_RECENTE) {
  const since = dataIsoGiorniFa(giorni);
  return richiediGitHub(urlIssueRepo(repo, { stato: "closed", since }), token, repo);
}

export function prAperte(repo, token) {
  return richiediGitHub(urlPrRepo(repo, { stato: "open" }), token, repo);
}

export function commentiIssue(repo, numero, token) {
  return richiediGitHub(urlCommentiIssue(repo, numero), token, repo);
}

export async function statoCheckPr(repo, ref, token) {
  const risultato = await richiediGitHub(urlStatoCheckPr(repo, ref), token, repo);
  return interpretaStatoCheck(risultato.state);
}

export function runWorkflow(repo, token, workflowFile) {
  return richiediGitHub(urlRunWorkflow(repo, workflowFile), token, repo);
}
