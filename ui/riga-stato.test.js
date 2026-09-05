import { test } from "node:test";
import assert from "node:assert/strict";
import { rigaStato, creaStatoSezione, aggiornaStatoRepo } from "./lib.js";

function agente(titolo) {
  return { titolo, url: `https://github.com/x/y/actions/runs/${titolo}`, avviatoA: "2026-09-05T00:00:00.000Z" };
}

// Costruisce, per un repo, i tre stati-sezione già "affidabili" (un solo giro
// riuscito), nella stessa forma prodotta da caricaPm/caricaAgentiAttivi/
// caricaAvanzamento in ui/index.html.
function statoRepoCompleto(repo, { pm = "acceso", agenti = [], lavoroTotale = 0 } = {}) {
  const statoPm = aggiornaStatoRepo(creaStatoSezione(), repo, {
    ok: true,
    dati: { stato: pm, ultimaEsecuzione: null },
  });
  const statoAgenti = aggiornaStatoRepo(creaStatoSezione(), repo, { ok: true, dati: agenti });
  const statoAvanzamento = aggiornaStatoRepo(creaStatoSezione(), repo, {
    ok: true,
    dati: { classificazione: {}, inCoda: 0, lavoro: { totale: lavoroTotale } },
  });
  return { statoPm, statoAgenti, statoAvanzamento };
}

function unisci(...voci) {
  return Object.assign({}, ...voci);
}

// --- configurazione assente -------------------------------------------------

test("rigaStato: senza repo configurati rimanda alla configurazione invece di tre zeri", () => {
  const r = rigaStato([], {}, {}, {});
  assert.deepEqual(r, { configurato: false });
});

// --- repo del tutto a riposo -------------------------------------------------

test("rigaStato: un repo del tutto a riposo lo dice esplicitamente", () => {
  const repo = "o/riposo";
  const { statoPm, statoAgenti, statoAvanzamento } = statoRepoCompleto(repo, {
    pm: "spento",
    agenti: [],
    lavoroTotale: 0,
  });
  const r = rigaStato([repo], statoPm, statoAgenti, statoAvanzamento);
  assert.equal(r.configurato, true);
  assert.equal(r.completo, true);
  assert.equal(r.testo, "PM: spento · nessun agente al lavoro · niente in attesa");
});

test("rigaStato: PM non installato è distinto da spento", () => {
  const repo = "o/non-installato";
  const { statoPm, statoAgenti, statoAvanzamento } = statoRepoCompleto(repo, { pm: "non-installato" });
  const r = rigaStato([repo], statoPm, statoAgenti, statoAvanzamento);
  assert.equal(r.testo, "PM non installato · nessun agente al lavoro · niente in attesa");
});

// --- dato mai caricato --------------------------------------------------------

test("rigaStato: un repo senza nessun dato caricato è incompleto, non zero", () => {
  const repo = "o/mai-caricato";
  const r = rigaStato([repo], {}, {}, {});
  assert.equal(r.configurato, true);
  assert.equal(r.completo, false);
  assert.match(r.testo, /incomplet/i);
});

// --- un repo risponde, uno no (anche dopo un giro riuscito) -------------------

test("rigaStato: un repo che risponde e uno mai caricato segnalano incompletezza, senza sommare", () => {
  const a = statoRepoCompleto("o/a", { pm: "acceso", agenti: [agente("1")], lavoroTotale: 4 });
  const r = rigaStato(
    ["o/a", "o/mai-caricato"],
    a.statoPm,
    a.statoAgenti,
    a.statoAvanzamento,
  );
  assert.equal(r.completo, false);
  assert.equal(r.testo, "Dati incompleti: 1 repo su 2 non risponde.");
  assert.doesNotMatch(r.testo, /agente al lavoro/);
  assert.doesNotMatch(r.testo, /in attesa/);
});

test("rigaStato: un repo che smette di rispondere dopo un giro riuscito resta incompleto (non i dati vecchi)", () => {
  const repoA = "o/a";
  const repoB = "o/b";

  const a = statoRepoCompleto(repoA, { pm: "acceso", agenti: [agente("1")], lavoroTotale: 2 });

  // repoB: un primo giro riuscito, poi un errore su tutti e tre gli stati —
  // aggiornaStatoRepo tiene i `dati` del giro precedente e alza `nonAggiornato`.
  let pmB = aggiornaStatoRepo(creaStatoSezione(), repoB, {
    ok: true,
    dati: { stato: "acceso", ultimaEsecuzione: null },
  });
  pmB = aggiornaStatoRepo(pmB, repoB, { ok: false, errore: "errore di rete" });

  let agentiB = aggiornaStatoRepo(creaStatoSezione(), repoB, { ok: true, dati: [] });
  agentiB = aggiornaStatoRepo(agentiB, repoB, { ok: false, errore: "errore di rete" });

  let avanzamentoB = aggiornaStatoRepo(creaStatoSezione(), repoB, {
    ok: true,
    dati: { classificazione: {}, inCoda: 0, lavoro: { totale: 5 } },
  });
  avanzamentoB = aggiornaStatoRepo(avanzamentoB, repoB, { ok: false, errore: "errore di rete" });

  const r = rigaStato(
    [repoA, repoB],
    unisci(a.statoPm, pmB),
    unisci(a.statoAgenti, agentiB),
    unisci(a.statoAvanzamento, avanzamentoB),
  );

  assert.equal(r.completo, false);
  assert.equal(r.testo, "Dati incompleti: 1 repo su 2 non risponde.");
  // i numeri vecchi di repoB (agente, 5 cose in attesa) non compaiono sommati
  // a quelli freschi di repoA come se la riga fosse completa.
  assert.doesNotMatch(r.testo, /\d+ agent/);
  assert.doesNotMatch(r.testo, /\d+ cos[ae] in attesa/);
});

test("rigaStato: nessun repo con dati affidabili dà un messaggio dedicato", () => {
  const r = rigaStato(["o/a", "o/b"], {}, {}, {});
  assert.equal(r.completo, false);
  assert.equal(r.testo, "Dati incompleti: nessuna informazione disponibile al momento.");
});

// --- pluralizzazioni -----------------------------------------------------------

test("rigaStato: un agente al lavoro usa il singolare", () => {
  const repo = "o/uno";
  const { statoPm, statoAgenti, statoAvanzamento } = statoRepoCompleto(repo, { agenti: [agente("1")] });
  const r = rigaStato([repo], statoPm, statoAgenti, statoAvanzamento);
  assert.match(r.testo, /· 1 agente al lavoro ·/);
});

test("rigaStato: più agenti al lavoro usano il plurale", () => {
  const repo = "o/due";
  const { statoPm, statoAgenti, statoAvanzamento } = statoRepoCompleto(repo, {
    agenti: [agente("1"), agente("2")],
  });
  const r = rigaStato([repo], statoPm, statoAgenti, statoAvanzamento);
  assert.match(r.testo, /· 2 agenti al lavoro ·/);
});

test("rigaStato: una sola cosa in attesa usa il singolare", () => {
  const repo = "o/unaCosa";
  const { statoPm, statoAgenti, statoAvanzamento } = statoRepoCompleto(repo, { lavoroTotale: 1 });
  const r = rigaStato([repo], statoPm, statoAgenti, statoAvanzamento);
  assert.match(r.testo, /1 cosa in attesa$/);
});

test("rigaStato: più cose in attesa usano il plurale", () => {
  const repo = "o/piuCose";
  const { statoPm, statoAgenti, statoAvanzamento } = statoRepoCompleto(repo, { lavoroTotale: 3 });
  const r = rigaStato([repo], statoPm, statoAgenti, statoAvanzamento);
  assert.match(r.testo, /3 cose in attesa$/);
});

// --- più repo, tutti affidabili: somma senza inventare dati -------------------

test("rigaStato: con più repo affidabili somma agenti e lavoro, e aggrega lo stato del PM", () => {
  const a = statoRepoCompleto("o/a", { pm: "acceso", agenti: [agente("1")], lavoroTotale: 2 });
  const b = statoRepoCompleto("o/b", { pm: "spento", agenti: [], lavoroTotale: 0 });

  const r = rigaStato(
    ["o/a", "o/b"],
    unisci(a.statoPm, b.statoPm),
    unisci(a.statoAgenti, b.statoAgenti),
    unisci(a.statoAvanzamento, b.statoAvanzamento),
  );

  assert.equal(r.completo, true);
  assert.equal(r.testo, "PM: 1 acceso, 1 spento · 1 agente al lavoro · 2 cose in attesa");
});

// --- nessuna chiamata di rete --------------------------------------------------

test("rigaStato: non fa richieste di rete", () => {
  const repo = "o/senzaRete";
  const { statoPm, statoAgenti, statoAvanzamento } = statoRepoCompleto(repo);
  const fetchOriginale = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("rigaStato non deve chiamare fetch");
  };
  try {
    rigaStato([repo], statoPm, statoAgenti, statoAvanzamento);
  } finally {
    globalThis.fetch = fetchOriginale;
  }
});
