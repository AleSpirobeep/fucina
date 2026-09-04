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
  urlStatoPm,
  riduciStatoPm,
  urlLabelIssue,
  urlRimuoviLabelIssue,
  FASE_COMMENTO,
  FASE_RIMUOVI_NEEDS_HUMAN,
  FASE_AGGIUNGI_READY_FOR_DEV,
} from "./lib.js";

async function richiesta(url, token, repo, opzioni = {}) {
  if (!token) {
    throw new ErroreGitHub("TOKEN_MANCANTE", "Token mancante.");
  }

  const risposta = await fetch(url, {
    method: opzioni.metodo || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      ...(opzioni.corpo ? { "Content-Type": "application/json" } : {}),
    },
    ...(opzioni.corpo ? { body: JSON.stringify(opzioni.corpo) } : {}),
  });

  if (!risposta.ok) {
    throw new ErroreGitHub(risposta.status, messaggioErroreHttp(risposta.status, repo));
  }

  if (risposta.status === 204) return null;
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

// contracts/comandi-pm.md — L1: un 404 è lo stato "non-installato", non un errore;
// ogni altro codice diverso da 200 resta un ErroreGitHub come le altre letture.
export async function statoPm(token, repo) {
  try {
    const dati = await richiesta(urlStatoPm(repo), token, repo);
    return riduciStatoPm(dati.state);
  } catch (errore) {
    if (errore instanceof ErroreGitHub && errore.codice === 404) {
      return riduciStatoPm(null);
    }
    throw errore;
  }
}

export function pubblicaCommento(token, repo, numero, testo) {
  return richiesta(urlCommentiIssue(repo, numero), token, repo, {
    metodo: "POST",
    corpo: { body: testo },
  });
}

export function rimuoviLabel(token, repo, numero, nomeLabel) {
  return richiesta(urlRimuoviLabelIssue(repo, numero, nomeLabel), token, repo, { metodo: "DELETE" });
}

export function aggiungiLabel(token, repo, numero, nomeLabel) {
  return richiesta(urlLabelIssue(repo, numero), token, repo, {
    metodo: "POST",
    corpo: { labels: [nomeLabel] },
  });
}

// REQ-131: il commento va per primo, così un fallimento successivo lascia la
// domanda già risposta e la issue ancora needs-human — mai un riavvio senza
// risposta. ErroreFase dice quale delle tre chiamate si è fermata.
export class ErroreFase extends Error {
  constructor(fase, causa) {
    super(causa.message);
    this.fase = fase;
    this.causa = causa;
  }
}

export async function rispondiERiavvia(token, repo, numero, testo) {
  try {
    await pubblicaCommento(token, repo, numero, testo);
  } catch (causa) {
    throw new ErroreFase(FASE_COMMENTO, causa);
  }

  try {
    await rimuoviLabel(token, repo, numero, "needs-human");
  } catch (causa) {
    throw new ErroreFase(FASE_RIMUOVI_NEEDS_HUMAN, causa);
  }

  try {
    await aggiungiLabel(token, repo, numero, "ready-for-dev");
  } catch (causa) {
    throw new ErroreFase(FASE_AGGIUNGI_READY_FOR_DEV, causa);
  }
}
