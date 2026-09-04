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

export function ultimoCommento(commenti) {
  const lista = commenti || [];
  return lista.length === 0 ? null : lista[lista.length - 1].body;
}

export function elementoPrCoda(pr) {
  const sezioni = estraiSezioni(pr.body);
  return {
    numero: pr.number,
    titolo: pr.title,
    url: pr.html_url,
    nonFatto: sezioni.nonFatto,
    fattoInPiu: sezioni.fattoInPiu,
  };
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

export function urlStatoPm(repo) {
  return `${API_BASE}/repos/${repo}/actions/workflows/pm-agent.yml`;
}

// contracts/comandi-pm.md — L1: uno dei soli tre valori mostrati dal Registro.
// `state` è null quando L1 risponde 404 (il workflow non è installato), non un errore.
export function riduciStatoPm(state) {
  if (state == null) return "non-installato";
  return state === "active" ? "acceso" : "spento";
}

export function urlUltimaEsecuzionePm(repo) {
  return `${API_BASE}/repos/${repo}/actions/workflows/pm-agent.yml/runs?per_page=1`;
}

// contracts/comandi-pm.md — S1: l'unica scrittura del comando «Ferma».
export function urlFermaPm(repo) {
  return `${API_BASE}/repos/${repo}/actions/workflows/pm-agent.yml/disable`;
}

// contracts/comandi-pm.md — L3: le esecuzioni ancora in corso dopo un «Ferma» riuscito.
export function urlEsecuzioniInCorsoPm(repo) {
  return `${API_BASE}/repos/${repo}/actions/workflows/pm-agent.yml/runs?status=in_progress`;
}

// contracts/comandi-pm.md — L4: il ramo di default, letto solo al click su «Avvia»
// (docs/decisions/2026-09-04-1900-ramo-del-giro-di-recupero.md), mai a ogni aggiornamento.
export function urlRepoInfo(repo) {
  return `${API_BASE}/repos/${repo}`;
}

// contracts/comandi-pm.md — S2: l'abilitazione del comando «Avvia».
export function urlAbilitaPm(repo) {
  return `${API_BASE}/repos/${repo}/actions/workflows/pm-agent.yml/enable`;
}

// contracts/comandi-pm.md — S3: il giro di recupero, sul ramo letto da L4.
export function urlGiroDiRecuperoPm(repo) {
  return `${API_BASE}/repos/${repo}/actions/workflows/pm-agent.yml/dispatches`;
}

export function riduciEsecuzioniInCorsoPm(runs) {
  return (runs || []).map((run) => ({ titolo: run.display_title, url: run.html_url }));
}

// contracts/comandi-pm.md — L2: un run concluso espone la propria `conclusion`,
// uno ancora in corso espone il proprio `status`. Nessun run non è un errore:
// dà "nessuna" (a differenza del 404 di L1, qui un 404 resta un errore vero).
export function riduciUltimaEsecuzionePm(runs) {
  const lista = runs || [];
  if (lista.length === 0) {
    return { esito: "nessuna", data: null, url: null };
  }
  const run = lista[0];
  return {
    esito: run.status === "completed" ? run.conclusion : run.status,
    data: run.run_started_at,
    url: run.html_url,
  };
}

// REQ-401, 410: la riga del PM mostra un solo pulsante, mai due, e nessuno per non-installato.
export function testoStatoPm(stato) {
  if (stato === "acceso") return "PM: acceso";
  if (stato === "spento") return "PM: spento";
  return "PM non installato";
}

export function pulsantePm(stato) {
  if (stato === "acceso") return "Ferma";
  if (stato === "spento") return "Avvia";
  return null;
}

export function testoInCodaPm(numero) {
  return `In coda: ${numero}`;
}

const ESITI_ULTIMA_ESECUZIONE_PM = {
  success: "riuscita",
  failure: "fallita",
  cancelled: "annullata",
  timed_out: "scaduta",
  action_required: "richiede azione",
  startup_failure: "non partita",
  in_progress: "in corso",
  queued: "in coda",
};

// REQ-402: esito e tempo trascorso dall'ultima esecuzione, con il link per chi vuole i dettagli.
export function testoUltimaEsecuzionePm(ultimaEsecuzione, adesso) {
  if (!ultimaEsecuzione || ultimaEsecuzione.esito === "nessuna") {
    return { testo: "Ultima esecuzione: nessuna", url: null };
  }
  const esito = ESITI_ULTIMA_ESECUZIONE_PM[ultimaEsecuzione.esito] || ultimaEsecuzione.esito;
  const trascorso = formattaTempoTrascorso(ultimaEsecuzione.data, adesso);
  return { testo: `Ultima esecuzione: ${esito}, ${trascorso} fa`, url: ultimaEsecuzione.url };
}

// REQ-403: il testo che dice che lo stato del PM non è aggiornato, senza far sparire la riga.
export function messaggioStatoPmNonAggiornato(errore) {
  return `Stato del PM non aggiornato: ${errore}`;
}

// REQ-412: dopo «Ferma», la pagina dice cosa finirà il proprio ciclo, o che non c'è niente.
export function testoEsecuzioniInCorsoPm(esecuzioni) {
  const lista = esecuzioni || [];
  return lista.length === 0 ? "Nessuna esecuzione del PM in corso." : "Finiranno il proprio ciclo:";
}

// REQ-402, 404: con "non-installato" niente pulsante e niente ultima esecuzione (L2 non si
// chiama nemmeno), ma il conteggio in-coda resta: non dipende dall'installazione del PM.
export function rigaPm(stato, inCoda, ultimaEsecuzione, adesso) {
  const installato = stato !== "non-installato";
  return {
    testoStato: testoStatoPm(stato),
    pulsante: pulsantePm(stato),
    testoInCoda: testoInCodaPm(inCoda),
    ultimaEsecuzione: installato ? testoUltimaEsecuzionePm(ultimaEsecuzione, adesso) : null,
  };
}

export function urlLabelIssue(repo, numero) {
  return `${API_BASE}/repos/${repo}/issues/${numero}/labels`;
}

export function urlRimuoviLabelIssue(repo, numero, nomeLabel) {
  return `${API_BASE}/repos/${repo}/issues/${numero}/labels/${encodeURIComponent(nomeLabel)}`;
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

// contracts/comandi-pm.md — i messaggi delle chiamate L1, L2, L3, L4, S1, S2, S3: in
// italiano, nominano la causa, mai il token (REQ-430, REQ-431). L1 tratta il proprio
// 404 come stato "non-installato" prima di arrivare qui (contracts/comandi-pm.md),
// quindi in pratica solo i suoi codici diversi da 200 e 404 passano da qui.
export function messaggioErroreComandoPm(status, repo) {
  if (status === 403) {
    return "Al token manca il permesso «Actions: read and write». Concedilo nelle impostazioni del token fine-grained su GitHub (Settings → Developer settings → Personal access tokens), poi riprova.";
  }
  if (status === 404) {
    return `Il workflow pm-agent.yml non risulta installato su ${repo}.`;
  }
  if (status === 401) {
    return "Il token non è valido o è scaduto. Aggiornalo in «Configurazione».";
  }
  return messaggioErroreHttp(status, repo);
}

// REQ-130/131: le tre chiamate di "Rispondi e riavvia", nell'ordine in cui vanno eseguite.
export const FASE_COMMENTO = "commento";
export const FASE_RIMUOVI_NEEDS_HUMAN = "rimuoviNeedsHuman";
export const FASE_AGGIUNGI_READY_FOR_DEV = "aggiungiReadyForDev";

// contracts/comandi-pm.md — le fasi del comando «Avvia»: L4, poi S2, poi S3 (REQ-414, 415).
export const FASE_RAMO_DEFAULT = "ramoDefault";
export const FASE_ABILITAZIONE = "abilitazione";
export const FASE_GIRO_DI_RECUPERO = "giroDiRecupero";

const DESCRIZIONE_FASE = {
  [FASE_COMMENTO]: "nel pubblicare il commento",
  [FASE_RIMUOVI_NEEDS_HUMAN]: "nel togliere l'etichetta needs-human",
  [FASE_AGGIUNGI_READY_FOR_DEV]: "nell'aggiungere l'etichetta ready-for-dev",
  [FASE_RAMO_DEFAULT]: "nel leggere il ramo di default",
  [FASE_ABILITAZIONE]: "nell'abilitazione del PM",
  [FASE_GIRO_DI_RECUPERO]: "nell'avviare il giro di recupero",
};

export function messaggioErroreFase(fase, messaggioOriginale) {
  return `Errore ${DESCRIZIONE_FASE[fase] || fase}: ${messaggioOriginale}`;
}

export function testoRispostaValido(testo) {
  return typeof testo === "string" && testo.trim().length > 0;
}

export function messaggioConfermaRisposta(issue, testo) {
  return `Pubblicare questo commento su "${issue.title}" (#${issue.number}) e riavviare l'agente?\n\n${testo}`;
}

// contracts/comandi-pm.md, REQ-413: stessa forma nativa di messaggioConfermaRisposta
// (ADR 2026-09-03-1425). Nomina il repo e avverte che il giro di recupero chiama il modello.
export function messaggioConfermaAvvia(repo) {
  return `Avviare il PM su "${repo}"? Subito dopo parte un giro di recupero, che chiama il modello.`;
}

// contracts/comandi-pm.md — i tre esiti di «Avvia» (REQ-414, 415). Un fallimento di L4 o
// S2 conta come `abilitazioneRiuscita: false`: S3 non viene nemmeno tentata.
export function esitoAvvia(abilitazioneRiuscita, giroDiRecuperoRiuscito) {
  if (!abilitazioneRiuscita) return "non-abilitato";
  return giroDiRecuperoRiuscito ? "riuscito" : "solo-abilitato";
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

// REQ-402: conta le issue in-coda dai dati già scaricati per la tabella di
// REQ-120 (spec 002) — nessuna chiamata nuova, nessun conteggio ripetuto.
export function contaInCoda(issues) {
  return (issues || []).filter((issue) => {
    if (issue.pull_request) return false; // le PR mischiate nell'elenco issue non contano
    if (issue.state === "closed") return false;
    return nomiLabel(issue).includes("in-coda");
  }).length;
}

// contracts/comandi-pm.md — il lavoro in attesa, dai dati già scaricati per la tabella
// di REQ-120 (spec 002): nessuna chiamata nuova (REQ-420).
export function lavoroInAttesa(issues, prs) {
  const prDaRevisionare = (prs || []).filter(
    (pr) => pr.state === "open" && nomiLabel(pr).includes("needs-review"),
  );

  const issueAperte = (issues || []).filter(
    (issue) => !issue.pull_request && issue.state === "open",
  );

  const domande = issueAperte.filter((issue) => {
    const nomi = nomiLabel(issue);
    return nomi.includes("needs-human") && !nomi.includes("rapporto-pm");
  });

  const inCoda = issueAperte.filter((issue) => nomiLabel(issue).includes("in-coda"));

  return {
    prDaRevisionare,
    domande,
    inCoda,
    totale: prDaRevisionare.length + domande.length + inCoda.length,
  };
}

// contracts/comandi-pm.md — l'avviso compare solo con il PM spento e lavoro in attesa
// (REQ-420); con «acceso» o «non-installato» non compare mai, qualunque sia il lavoro
// (REQ-421).
export function avvisoPmSpento(stato, lavoro) {
  if (stato !== "spento" || !lavoro || lavoro.totale === 0) return null;
  return lavoro;
}

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

export function formattaOra(iso) {
  const d = new Date(iso);
  const due = (n) => String(n).padStart(2, "0");
  return `${due(d.getHours())}:${due(d.getMinutes())}:${due(d.getSeconds())}`;
}

// Stato per repo di una sezione della dashboard: su un errore i dati della
// chiamata precedente restano (REQ-122 chiede di non farli sparire), solo
// marcati come non aggiornati.
export function creaStatoSezione() {
  return {};
}

export function aggiornaStatoRepo(stato, repo, risultato) {
  const precedente = stato[repo];
  const voce = risultato.ok
    ? { dati: risultato.dati, errore: null, nonAggiornato: false }
    : { dati: precedente ? precedente.dati : undefined, errore: risultato.errore, nonAggiornato: true };
  return { ...stato, [repo]: voce };
}

// Coordina i cicli di aggiornamento: `avviaAggiornamento` restituisce null se
// uno è già in corso, così un click manuale durante il timer automatico non
// genera un secondo giro di richieste.
export function creaStatoAggiornamento() {
  return { inCorso: false, ultimoAggiornamento: null };
}

export function avviaAggiornamento(stato) {
  return stato.inCorso ? null : { ...stato, inCorso: true };
}

export function terminaAggiornamento(stato, adesso, haErrori) {
  return {
    inCorso: false,
    ultimoAggiornamento: haErrori ? stato.ultimoAggiornamento : adesso,
  };
}
