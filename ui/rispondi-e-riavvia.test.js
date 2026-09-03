import { test } from "node:test";
import assert from "node:assert/strict";
import {
  urlLabelIssue,
  urlRimuoviLabelIssue,
  urlCommentiIssue,
  testoRispostaValido,
  messaggioConfermaRisposta,
  messaggioErroreFase,
  FASE_COMMENTO,
  FASE_RIMUOVI_NEEDS_HUMAN,
  FASE_AGGIUNGI_READY_FOR_DEV,
  ErroreGitHub,
} from "./lib.js";
import {
  pubblicaCommento,
  rimuoviLabel,
  aggiungiLabel,
  rispondiERiavvia,
  ErroreFase,
} from "./github.js";

const REPO = "AleSpirobeep/fucina";

// --- parte pura: costruzione delle URL -------------------------------------

test("urlLabelIssue punta all'endpoint delle etichette della issue", () => {
  assert.equal(
    urlLabelIssue(REPO, 22),
    "https://api.github.com/repos/AleSpirobeep/fucina/issues/22/labels",
  );
});

test("urlRimuoviLabelIssue include il nome dell'etichetta nel percorso", () => {
  assert.equal(
    urlRimuoviLabelIssue(REPO, 22, "needs-human"),
    "https://api.github.com/repos/AleSpirobeep/fucina/issues/22/labels/needs-human",
  );
});

test("urlRimuoviLabelIssue codifica i caratteri speciali dell'etichetta", () => {
  assert.equal(
    urlRimuoviLabelIssue(REPO, 22, "in progress"),
    "https://api.github.com/repos/AleSpirobeep/fucina/issues/22/labels/in%20progress",
  );
});

// --- parte pura: validazione del campo di testo -----------------------------

test("testoRispostaValido rifiuta il campo vuoto", () => {
  assert.equal(testoRispostaValido(""), false);
});

test("testoRispostaValido rifiuta le sole spaziature", () => {
  assert.equal(testoRispostaValido("   \n\t"), false);
});

test("testoRispostaValido rifiuta valori non testuali", () => {
  assert.equal(testoRispostaValido(undefined), false);
  assert.equal(testoRispostaValido(null), false);
});

test("testoRispostaValido accetta un testo non vuoto", () => {
  assert.equal(testoRispostaValido("Ecco la risposta"), true);
});

// --- parte pura: messaggio di conferma --------------------------------------

test("messaggioConfermaRisposta mostra titolo, numero e testo della issue", () => {
  const issue = { number: 22, title: "Comando 'Rispondi e riavvia'" };
  const messaggio = messaggioConfermaRisposta(issue, "Va bene così, procedi.");
  assert.match(messaggio, /Comando 'Rispondi e riavvia'/);
  assert.match(messaggio, /#22/);
  assert.match(messaggio, /Va bene così, procedi\./);
});

// --- parte pura: messaggio d'errore per fase --------------------------------

test("messaggioErroreFase nomina la pubblicazione del commento", () => {
  assert.equal(
    messaggioErroreFase(FASE_COMMENTO, "Token non valido o scaduto."),
    "Errore nel pubblicare il commento: Token non valido o scaduto.",
  );
});

test("messaggioErroreFase nomina la rimozione di needs-human", () => {
  assert.equal(
    messaggioErroreFase(FASE_RIMUOVI_NEEDS_HUMAN, "Richiesta a GitHub fallita (codice 403)."),
    "Errore nel togliere l'etichetta needs-human: Richiesta a GitHub fallita (codice 403).",
  );
});

test("messaggioErroreFase nomina l'aggiunta di ready-for-dev", () => {
  assert.equal(
    messaggioErroreFase(FASE_AGGIUNGI_READY_FOR_DEV, "Richiesta a GitHub fallita (codice 500)."),
    "Errore nell'aggiungere l'etichetta ready-for-dev: Richiesta a GitHub fallita (codice 500).",
  );
});

// --- funzioni fetch sottili, con fetch globale sostituito da un finto -------

function usaFetchFinto(gestore) {
  const originale = globalThis.fetch;
  globalThis.fetch = gestore;
  return () => {
    globalThis.fetch = originale;
  };
}

test("pubblicaCommento fa una POST sull'endpoint dei commenti con il testo nel corpo", async () => {
  let urlChiamato;
  let opzioniChiamate;
  const ripristina = usaFetchFinto((url, opzioni) => {
    urlChiamato = url;
    opzioniChiamate = opzioni;
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 1 }) });
  });
  try {
    await pubblicaCommento("un-token", REPO, 22, "Va bene, procedi.");
    assert.equal(urlChiamato, urlCommentiIssue(REPO, 22));
    assert.equal(opzioniChiamate.method, "POST");
    assert.equal(opzioniChiamate.headers.Authorization, "Bearer un-token");
    assert.deepEqual(JSON.parse(opzioniChiamate.body), { body: "Va bene, procedi." });
  } finally {
    ripristina();
  }
});

test("rimuoviLabel fa una DELETE sull'endpoint dell'etichetta needs-human", async () => {
  let urlChiamato;
  let opzioniChiamate;
  const ripristina = usaFetchFinto((url, opzioni) => {
    urlChiamato = url;
    opzioniChiamate = opzioni;
    return Promise.resolve({ ok: true, status: 204 });
  });
  try {
    const risultato = await rimuoviLabel("un-token", REPO, 22, "needs-human");
    assert.equal(urlChiamato, urlRimuoviLabelIssue(REPO, 22, "needs-human"));
    assert.equal(opzioniChiamate.method, "DELETE");
    assert.equal(risultato, null);
  } finally {
    ripristina();
  }
});

test("aggiungiLabel fa una POST sull'endpoint delle etichette con ready-for-dev", async () => {
  let urlChiamato;
  let opzioniChiamate;
  const ripristina = usaFetchFinto((url, opzioni) => {
    urlChiamato = url;
    opzioniChiamate = opzioni;
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
  try {
    await aggiungiLabel("un-token", REPO, 22, "ready-for-dev");
    assert.equal(urlChiamato, urlLabelIssue(REPO, 22));
    assert.equal(opzioniChiamate.method, "POST");
    assert.deepEqual(JSON.parse(opzioniChiamate.body), { labels: ["ready-for-dev"] });
  } finally {
    ripristina();
  }
});

// --- rispondiERiavvia: ordine e comportamento sui fallimenti (REQ-130/131) --

test("rispondiERiavvia esegue le tre chiamate nell'ordine giusto", async () => {
  const chiamate = [];
  const ripristina = usaFetchFinto((url, opzioni) => {
    chiamate.push(`${opzioni.method} ${url}`);
    return Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve({}) });
  });
  try {
    await rispondiERiavvia("un-token", REPO, 22, "Procedi pure.");
    assert.deepEqual(chiamate, [
      `POST ${urlCommentiIssue(REPO, 22)}`,
      `DELETE ${urlRimuoviLabelIssue(REPO, 22, "needs-human")}`,
      `POST ${urlLabelIssue(REPO, 22)}`,
    ]);
  } finally {
    ripristina();
  }
});

test("rispondiERiavvia si ferma alla prima chiamata se il token non ha permesso di scrittura", async () => {
  const chiamate = [];
  const ripristina = usaFetchFinto((url, opzioni) => {
    chiamate.push(url);
    return Promise.resolve({ ok: false, status: 403, json: () => Promise.resolve({}) });
  });
  try {
    await assert.rejects(
      () => rispondiERiavvia("token-senza-permesso", REPO, 22, "Procedi pure."),
      (errore) => {
        assert.ok(errore instanceof ErroreFase);
        assert.equal(errore.fase, FASE_COMMENTO);
        assert.ok(errore.causa instanceof ErroreGitHub);
        return true;
      },
    );
    assert.deepEqual(chiamate, [urlCommentiIssue(REPO, 22)]);
  } finally {
    ripristina();
  }
});

test("rispondiERiavvia con successo sul commento ma fallimento sulla rimozione dell'etichetta non aggiunge ready-for-dev", async () => {
  const chiamate = [];
  const ripristina = usaFetchFinto((url, opzioni) => {
    chiamate.push(url);
    if (opzioni.method === "DELETE") {
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
    }
    return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({}) });
  });
  try {
    await assert.rejects(
      () => rispondiERiavvia("un-token", REPO, 22, "Procedi pure."),
      (errore) => {
        assert.ok(errore instanceof ErroreFase);
        assert.equal(errore.fase, FASE_RIMUOVI_NEEDS_HUMAN);
        return true;
      },
    );
    assert.deepEqual(chiamate, [urlCommentiIssue(REPO, 22), urlRimuoviLabelIssue(REPO, 22, "needs-human")]);
  } finally {
    ripristina();
  }
});

test("rispondiERiavvia rifiuta il token mancante senza chiamare fetch", async () => {
  const ripristina = usaFetchFinto(() => {
    throw new Error("fetch non doveva essere chiamato");
  });
  try {
    await assert.rejects(
      () => rispondiERiavvia("", REPO, 22, "Procedi pure."),
      (errore) => {
        assert.ok(errore instanceof ErroreFase);
        assert.equal(errore.fase, FASE_COMMENTO);
        return true;
      },
    );
  } finally {
    ripristina();
  }
});
