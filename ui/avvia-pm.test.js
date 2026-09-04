import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ErroreGitHub,
  urlRepoInfo,
  urlAbilitaPm,
  urlGiroDiRecuperoPm,
  esitoAvvia,
  messaggioConfermaAvvia,
  messaggioErroreFase,
  FASE_RAMO_DEFAULT,
  FASE_ABILITAZIONE,
  FASE_GIRO_DI_RECUPERO,
} from "./lib.js";
import {
  ramoDefaultRepo,
  abilitaPm,
  avviaGiroDiRecuperoPm,
  avviaPm,
  ErroreFase,
} from "./github.js";

const REPO = "AleSpirobeep/fucina";

function usaFetchFinto(gestore) {
  const originale = globalThis.fetch;
  globalThis.fetch = gestore;
  return () => {
    globalThis.fetch = originale;
  };
}

// --- parte pura: costruzione delle URL (L4, S2, S3 del contratto) ----------

test("urlRepoInfo punta all'endpoint del repository", () => {
  assert.equal(urlRepoInfo(REPO), "https://api.github.com/repos/AleSpirobeep/fucina");
});

test("urlAbilitaPm punta all'endpoint enable del workflow pm-agent.yml", () => {
  assert.equal(
    urlAbilitaPm(REPO),
    "https://api.github.com/repos/AleSpirobeep/fucina/actions/workflows/pm-agent.yml/enable",
  );
});

test("urlGiroDiRecuperoPm punta all'endpoint dispatches del workflow pm-agent.yml", () => {
  assert.equal(
    urlGiroDiRecuperoPm(REPO),
    "https://api.github.com/repos/AleSpirobeep/fucina/actions/workflows/pm-agent.yml/dispatches",
  );
});

// --- parte pura: il testo della conferma ------------------------------------

test("messaggioConfermaAvvia nomina il repo e dice che il giro di recupero chiama il modello", () => {
  const messaggio = messaggioConfermaAvvia(REPO);
  assert.match(messaggio, new RegExp(REPO.replace("/", "\\/")));
  assert.match(messaggio, /giro di recupero/);
  assert.match(messaggio, /modello/);
});

// --- parte pura: i tre esiti -------------------------------------------------

test("esitoAvvia dà 'riuscito' quando abilitazione e giro di recupero riescono entrambi", () => {
  assert.equal(esitoAvvia(true, true), "riuscito");
});

test("esitoAvvia dà 'solo-abilitato' quando l'abilitazione riesce ma il giro fallisce", () => {
  assert.equal(esitoAvvia(true, false), "solo-abilitato");
});

test("esitoAvvia dà 'non-abilitato' quando l'abilitazione fallisce, qualunque cosa succeda al giro", () => {
  assert.equal(esitoAvvia(false, false), "non-abilitato");
  assert.equal(esitoAvvia(false, true), "non-abilitato");
});

// --- parte pura: i messaggi d'errore per fase -------------------------------

test("messaggioErroreFase nomina l'abilitazione del PM", () => {
  assert.equal(
    messaggioErroreFase(FASE_ABILITAZIONE, "Richiesta a GitHub fallita (codice 403)."),
    "Errore nell'abilitazione del PM: Richiesta a GitHub fallita (codice 403).",
  );
});

test("messaggioErroreFase nomina il giro di recupero", () => {
  assert.equal(
    messaggioErroreFase(FASE_GIRO_DI_RECUPERO, "Richiesta a GitHub fallita (codice 500)."),
    "Errore nell'avviare il giro di recupero: Richiesta a GitHub fallita (codice 500).",
  );
});

test("messaggioErroreFase nomina la lettura del ramo di default", () => {
  assert.equal(
    messaggioErroreFase(FASE_RAMO_DEFAULT, "Il repository x/y non esiste o non è raggiungibile."),
    "Errore nel leggere il ramo di default: Il repository x/y non esiste o non è raggiungibile.",
  );
});

// --- le tre chiamate fetch sottili -------------------------------------------

test("ramoDefaultRepo legge default_branch dall'endpoint del repository (L4)", async () => {
  let urlChiamato;
  const ripristina = usaFetchFinto((url) => {
    urlChiamato = url;
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ default_branch: "sviluppo" }) });
  });
  try {
    assert.equal(await ramoDefaultRepo("un-token", REPO), "sviluppo");
    assert.equal(urlChiamato, urlRepoInfo(REPO));
  } finally {
    ripristina();
  }
});

test("abilitaPm fa una PUT sull'endpoint enable (S2)", async () => {
  let urlChiamato;
  let opzioniChiamate;
  const ripristina = usaFetchFinto((url, opzioni) => {
    urlChiamato = url;
    opzioniChiamate = opzioni;
    return Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve(null) });
  });
  try {
    await abilitaPm("un-token", REPO);
    assert.equal(urlChiamato, urlAbilitaPm(REPO));
    assert.equal(opzioniChiamate.method, "PUT");
  } finally {
    ripristina();
  }
});

test("avviaGiroDiRecuperoPm fa una POST sull'endpoint dispatches con il ramo come ref (S3)", async () => {
  let urlChiamato;
  let opzioniChiamate;
  const ripristina = usaFetchFinto((url, opzioni) => {
    urlChiamato = url;
    opzioniChiamate = opzioni;
    return Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve(null) });
  });
  try {
    await avviaGiroDiRecuperoPm("un-token", REPO, "sviluppo");
    assert.equal(urlChiamato, urlGiroDiRecuperoPm(REPO));
    assert.equal(opzioniChiamate.method, "POST");
    assert.deepEqual(JSON.parse(opzioniChiamate.body), { ref: "sviluppo" });
  } finally {
    ripristina();
  }
});

// --- avviaPm: L4 poi S2 poi S3, nell'ordine fisso (REQ-414) -----------------

test("avviaPm esegue ramo di default, enable e dispatches in quest'ordine, con il ramo letto come ref", async () => {
  const chiamate = [];
  const ripristina = usaFetchFinto((url, opzioni) => {
    chiamate.push({ url, metodo: (opzioni && opzioni.method) || "GET", corpo: opzioni && opzioni.body });
    if (url === urlRepoInfo(REPO)) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ default_branch: "sviluppo" }) });
    }
    return Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve(null) });
  });
  try {
    const risultato = await avviaPm("un-token", REPO);
    assert.deepEqual(chiamate, [
      { url: urlRepoInfo(REPO), metodo: "GET", corpo: undefined },
      { url: urlAbilitaPm(REPO), metodo: "PUT", corpo: undefined },
      { url: urlGiroDiRecuperoPm(REPO), metodo: "POST", corpo: JSON.stringify({ ref: "sviluppo" }) },
    ]);
    assert.deepEqual(risultato, { esito: "riuscito", errore: null });
  } finally {
    ripristina();
  }
});

test("avviaPm non abilita nulla se la lettura del ramo di default fallisce", async () => {
  const chiamate = [];
  const ripristina = usaFetchFinto((url) => {
    chiamate.push(url);
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  });
  try {
    await assert.rejects(
      () => avviaPm("un-token", REPO),
      (errore) => {
        assert.ok(errore instanceof ErroreFase);
        assert.equal(errore.fase, FASE_RAMO_DEFAULT);
        assert.ok(errore.causa instanceof ErroreGitHub);
        return true;
      },
    );
    assert.deepEqual(chiamate, [urlRepoInfo(REPO)]);
  } finally {
    ripristina();
  }
});

test("avviaPm non tenta il giro di recupero se l'abilitazione fallisce", async () => {
  const chiamate = [];
  const ripristina = usaFetchFinto((url, opzioni) => {
    chiamate.push(url);
    if (url === urlRepoInfo(REPO)) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ default_branch: "main" }) });
    }
    return Promise.resolve({ ok: false, status: 403, json: () => Promise.resolve({}) });
  });
  try {
    await assert.rejects(
      () => avviaPm("token-senza-permesso", REPO),
      (errore) => {
        assert.ok(errore instanceof ErroreFase);
        assert.equal(errore.fase, FASE_ABILITAZIONE);
        return true;
      },
    );
    assert.deepEqual(chiamate, [urlRepoInfo(REPO), urlAbilitaPm(REPO)]);
  } finally {
    ripristina();
  }
});

test("avviaPm con giro di recupero fallito resta 'solo-abilitato' e nomina il fallimento, senza rigettare", async () => {
  const ripristina = usaFetchFinto((url) => {
    if (url === urlRepoInfo(REPO)) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ default_branch: "main" }) });
    }
    if (url === urlAbilitaPm(REPO)) {
      return Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve(null) });
    }
    return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
  });
  try {
    const risultato = await avviaPm("un-token", REPO);
    assert.equal(risultato.esito, "solo-abilitato");
    assert.match(risultato.errore, /giro di recupero/);
  } finally {
    ripristina();
  }
});

test("avviaPm rifiuta il token mancante senza chiamare fetch", async () => {
  const ripristina = usaFetchFinto(() => {
    throw new Error("fetch non doveva essere chiamato");
  });
  try {
    await assert.rejects(
      () => avviaPm("", REPO),
      (errore) => {
        assert.ok(errore instanceof ErroreFase);
        assert.equal(errore.fase, FASE_RAMO_DEFAULT);
        return true;
      },
    );
  } finally {
    ripristina();
  }
});
