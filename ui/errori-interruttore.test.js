import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ErroreGitHub,
  messaggioErroreComandoPm,
  aggiornaStatoRepo,
  creaStatoSezione,
} from "./lib.js";
import {
  statoPm,
  ultimaEsecuzionePm,
  esecuzioniInCorsoPm,
  fermaPm,
  ramoDefaultRepo,
  abilitaPm,
  avviaGiroDiRecuperoPm,
  avviaPm,
  ErroreFase,
} from "./github.js";

const REPO = "AleSpirobeep/fucina";
const REPO_INESISTENTE = "AleSpirobeep/non-esiste";
const TOKEN_DI_SOLA_LETTURA = "ghp_solaLetturaSuActionsXYZ123";

function usaFetchFinto(gestore) {
  const originale = globalThis.fetch;
  globalThis.fetch = gestore;
  return () => {
    globalThis.fetch = originale;
  };
}

function rispostaErrore(status) {
  return () => Promise.resolve({ ok: false, status, json: () => Promise.resolve({}) });
}

// --- parte pura: la tabella dei messaggi del contratto ----------------------

test("messaggioErroreComandoPm per 403 nomina il permesso Actions: read and write e dove si concede", () => {
  const messaggio = messaggioErroreComandoPm(403, REPO);
  assert.match(messaggio, /Actions: read and write/);
  assert.match(messaggio, /token/i);
});

test("messaggioErroreComandoPm per 404 dice che pm-agent.yml non risulta installato", () => {
  const messaggio = messaggioErroreComandoPm(404, REPO);
  assert.match(messaggio, /pm-agent\.yml/);
  assert.match(messaggio, /non risulta installato/);
  assert.match(messaggio, new RegExp(REPO.replace("/", "\\/")));
});

test("messaggioErroreComandoPm per 401 rimanda a «Configurazione»", () => {
  const messaggio = messaggioErroreComandoPm(401, REPO);
  assert.match(messaggio, /Configurazione/);
});

test("messaggioErroreComandoPm per altri codici usa il messaggio già usato dalla pagina", () => {
  assert.equal(
    messaggioErroreComandoPm(500, REPO),
    `Richiesta a GitHub fallita (codice 500).`,
  );
});

test("nessuno dei messaggi della tabella contiene un token", () => {
  for (const status of [401, 403, 404, 500]) {
    const messaggio = messaggioErroreComandoPm(status, REPO);
    assert.doesNotMatch(messaggio, /ghp_|github_pat_/);
  }
});

// --- S1 (Ferma) con un token in sola lettura su Actions: REQ-431 -----------

test("fermaPm con un token in sola lettura produce un messaggio che nomina il permesso e non contiene il token", async () => {
  const ripristina = usaFetchFinto(rispostaErrore(403));
  try {
    await assert.rejects(
      () => fermaPm(TOKEN_DI_SOLA_LETTURA, REPO),
      (errore) => {
        assert.ok(errore instanceof ErroreGitHub);
        assert.match(errore.message, /Actions: read and write/);
        assert.ok(!errore.message.includes(TOKEN_DI_SOLA_LETTURA));
        return true;
      },
    );
  } finally {
    ripristina();
  }
});

test("statoPm con token non valido rimanda a «Configurazione» senza contenere il token", async () => {
  const ripristina = usaFetchFinto(rispostaErrore(401));
  try {
    await assert.rejects(
      () => statoPm(TOKEN_DI_SOLA_LETTURA, REPO),
      (errore) => {
        assert.match(errore.message, /Configurazione/);
        assert.ok(!errore.message.includes(TOKEN_DI_SOLA_LETTURA));
        return true;
      },
    );
  } finally {
    ripristina();
  }
});

test("ultimaEsecuzionePm (L2) con 404 dice che pm-agent.yml non risulta installato", async () => {
  const ripristina = usaFetchFinto(rispostaErrore(404));
  try {
    await assert.rejects(
      () => ultimaEsecuzionePm(TOKEN_DI_SOLA_LETTURA, REPO),
      (errore) => {
        assert.match(errore.message, /pm-agent\.yml/);
        assert.match(errore.message, /non risulta installato/);
        return true;
      },
    );
  } finally {
    ripristina();
  }
});

test("esecuzioniInCorsoPm (L3) con 403 nomina il permesso mancante", async () => {
  const ripristina = usaFetchFinto(rispostaErrore(403));
  try {
    await assert.rejects(
      () => esecuzioniInCorsoPm(TOKEN_DI_SOLA_LETTURA, REPO),
      (errore) => {
        assert.match(errore.message, /Actions: read and write/);
        return true;
      },
    );
  } finally {
    ripristina();
  }
});

test("ramoDefaultRepo (L4) con 403 nomina il permesso mancante", async () => {
  const ripristina = usaFetchFinto(rispostaErrore(403));
  try {
    await assert.rejects(
      () => ramoDefaultRepo(TOKEN_DI_SOLA_LETTURA, REPO),
      (errore) => {
        assert.match(errore.message, /Actions: read and write/);
        return true;
      },
    );
  } finally {
    ripristina();
  }
});

test("abilitaPm (S2) con un token in sola lettura nomina il permesso mancante", async () => {
  const ripristina = usaFetchFinto(rispostaErrore(403));
  try {
    await assert.rejects(
      () => abilitaPm(TOKEN_DI_SOLA_LETTURA, REPO),
      (errore) => {
        assert.match(errore.message, /Actions: read and write/);
        assert.ok(!errore.message.includes(TOKEN_DI_SOLA_LETTURA));
        return true;
      },
    );
  } finally {
    ripristina();
  }
});

test("avviaGiroDiRecuperoPm (S3) con un token in sola lettura nomina il permesso mancante", async () => {
  const ripristina = usaFetchFinto(rispostaErrore(403));
  try {
    await assert.rejects(
      () => avviaGiroDiRecuperoPm(TOKEN_DI_SOLA_LETTURA, REPO, "main"),
      (errore) => {
        assert.match(errore.message, /Actions: read and write/);
        return true;
      },
    );
  } finally {
    ripristina();
  }
});

// «Avvia»: il fallimento su S2 (abilitazione) con un token in sola lettura si
// vede nella fase, non solo nel messaggio grezzo (REQ-415, 431).
test("avviaPm con un token in sola lettura fallisce nella fase di abilitazione nominando il permesso", async () => {
  const ripristina = usaFetchFinto((url) => {
    if (url === "https://api.github.com/repos/AleSpirobeep/fucina") {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ default_branch: "main" }) });
    }
    return rispostaErrore(403)();
  });
  try {
    await assert.rejects(
      () => avviaPm(TOKEN_DI_SOLA_LETTURA, REPO),
      (errore) => {
        assert.ok(errore instanceof ErroreFase);
        assert.match(errore.causa.message, /Actions: read and write/);
        return true;
      },
    );
  } finally {
    ripristina();
  }
});

// --- isolamento fra repo: REQ-432 -------------------------------------------

test("un repo inesistente nell'elenco resta isolato: gli altri restano leggibili e comandabili", () => {
  let stato = creaStatoSezione();
  stato = aggiornaStatoRepo(stato, REPO, {
    ok: true,
    dati: { stato: "acceso", ultimaEsecuzione: { esito: "riuscita", data: null, url: null } },
  });
  stato = aggiornaStatoRepo(stato, REPO_INESISTENTE, {
    ok: false,
    errore: messaggioErroreComandoPm(404, REPO_INESISTENTE),
  });

  assert.equal(stato[REPO].errore, null);
  assert.equal(stato[REPO].nonAggiornato, false);
  assert.deepEqual(stato[REPO].dati, {
    stato: "acceso",
    ultimaEsecuzione: { esito: "riuscita", data: null, url: null },
  });

  assert.equal(stato[REPO_INESISTENTE].nonAggiornato, true);
  assert.match(stato[REPO_INESISTENTE].errore, /pm-agent\.yml/);
});

test("l'errore di un repo non cancella i dati già letti di un altro aggiornato dopo", () => {
  let stato = creaStatoSezione();
  stato = aggiornaStatoRepo(stato, REPO_INESISTENTE, {
    ok: false,
    errore: messaggioErroreComandoPm(404, REPO_INESISTENTE),
  });
  stato = aggiornaStatoRepo(stato, REPO, {
    ok: true,
    dati: { stato: "spento", ultimaEsecuzione: { esito: "nessuna", data: null, url: null } },
  });

  assert.equal(stato[REPO_INESISTENTE].nonAggiornato, true);
  assert.equal(stato[REPO].nonAggiornato, false);
  assert.equal(stato[REPO].dati.stato, "spento");
});
