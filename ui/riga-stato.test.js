import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rigaStato,
  testoAgentiAlLavoro,
  testoLavoroInAttesa,
  messaggioNessunRepoConfigurato,
  aggiornaStatoRepo,
  creaStatoSezione,
  lavoroInAttesa,
} from "./lib.js";

function statoPmCaricato(repo, stato) {
  return aggiornaStatoRepo(creaStatoSezione(), repo, {
    ok: true,
    dati: { stato, ultimaEsecuzione: { esito: "nessuna", data: null, url: null } },
  });
}

function statoAgentiCaricato(repo, agenti) {
  return aggiornaStatoRepo(creaStatoSezione(), repo, { ok: true, dati: agenti });
}

function statoAvanzamentoCaricato(repo, lavoro) {
  return aggiornaStatoRepo(creaStatoSezione(), repo, {
    ok: true,
    dati: { classificazione: {}, inCoda: 0, lavoro },
  });
}

// --- testoAgentiAlLavoro --------------------------------------------------

test("testoAgentiAlLavoro: zero dà «nessun agente al lavoro»", () => {
  assert.equal(testoAgentiAlLavoro(0), "nessun agente al lavoro");
});

test("testoAgentiAlLavoro: uno è singolare", () => {
  assert.equal(testoAgentiAlLavoro(1), "1 agente al lavoro");
});

test("testoAgentiAlLavoro: più di uno è plurale", () => {
  assert.equal(testoAgentiAlLavoro(3), "3 agenti al lavoro");
});

// --- testoLavoroInAttesa --------------------------------------------------

test("testoLavoroInAttesa: zero dà «niente in attesa»", () => {
  assert.equal(testoLavoroInAttesa(0), "niente in attesa");
});

test("testoLavoroInAttesa: un totale positivo lo riporta", () => {
  assert.equal(testoLavoroInAttesa(2), "2 in attesa");
});

// --- messaggioNessunRepoConfigurato ---------------------------------------

test("messaggioNessunRepoConfigurato rimanda alla configurazione", () => {
  assert.match(messaggioNessunRepoConfigurato(), /[Cc]onfigurazione/);
});

// --- rigaStato -------------------------------------------------------------

test("rigaStato: senza repo configurati dà configurato:false", () => {
  const risultato = rigaStato([], {}, {}, {});
  assert.equal(risultato.configurato, false);
  assert.deepEqual(risultato.righe, []);
});

test("rigaStato: repo configurato ma dati non ancora arrivati resta fuori dalle righe", () => {
  const risultato = rigaStato(["x/y"], {}, {}, {});
  assert.equal(risultato.configurato, true);
  assert.deepEqual(risultato.righe, []);
});

test("rigaStato: un repo del tutto a riposo lo dice esplicitamente", () => {
  const lavoro = lavoroInAttesa([], []);
  const statoPmRepo = statoPmCaricato("x/y", "spento");
  const statoAgentiAttiviRepo = statoAgentiCaricato("x/y", []);
  const statoAvanzamentoRepo = statoAvanzamentoCaricato("x/y", lavoro);

  const risultato = rigaStato(["x/y"], statoPmRepo, statoAgentiAttiviRepo, statoAvanzamentoRepo);

  assert.equal(risultato.configurato, true);
  assert.equal(risultato.righe.length, 1);
  const [riga] = risultato.righe;
  assert.equal(riga.repo, "x/y");
  assert.equal(riga.testoStato, "PM: spento");
  assert.equal(riga.testoAgenti, "nessun agente al lavoro");
  assert.equal(riga.testoLavoro, "niente in attesa");
});

test("rigaStato: un repo con agenti al lavoro e lavoro in attesa riporta entrambi i conteggi", () => {
  const lavoro = lavoroInAttesa(
    [{ number: 1, title: "domanda", html_url: "https://x", state: "open", labels: [{ name: "needs-human" }] }],
    [],
  );
  const statoPmRepo = statoPmCaricato("x/y", "acceso");
  const statoAgentiAttiviRepo = statoAgentiCaricato("x/y", [
    { titolo: "run 1", url: "https://x/1", avviatoA: "2026-09-05T08:00:00.000Z" },
  ]);
  const statoAvanzamentoRepo = statoAvanzamentoCaricato("x/y", lavoro);

  const risultato = rigaStato(["x/y"], statoPmRepo, statoAgentiAttiviRepo, statoAvanzamentoRepo);

  const [riga] = risultato.righe;
  assert.equal(riga.testoStato, "PM: acceso");
  assert.equal(riga.testoAgenti, "1 agente al lavoro");
  assert.equal(riga.testoLavoro, "1 in attesa");
});

test("rigaStato: con due repo, uno caricato e l'altro no, riporta solo quello caricato", () => {
  const lavoro = lavoroInAttesa([], []);
  let statoPmRepo = statoPmCaricato("uno/a", "acceso");
  let statoAgentiAttiviRepo = statoAgentiCaricato("uno/a", []);
  let statoAvanzamentoRepo = statoAvanzamentoCaricato("uno/a", lavoro);

  // "due/b" non ha ancora concluso nessuno dei tre caricamenti.
  const risultato = rigaStato(
    ["uno/a", "due/b"],
    statoPmRepo,
    statoAgentiAttiviRepo,
    statoAvanzamentoRepo,
  );

  assert.equal(risultato.righe.length, 1);
  assert.equal(risultato.righe[0].repo, "uno/a");
});

test("rigaStato: non fa alcuna richiesta di rete", () => {
  const originale = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("rigaStato non deve chiamare fetch");
  };
  try {
    const lavoro = lavoroInAttesa([], []);
    const statoPmRepo = statoPmCaricato("x/y", "spento");
    const statoAgentiAttiviRepo = statoAgentiCaricato("x/y", []);
    const statoAvanzamentoRepo = statoAvanzamentoCaricato("x/y", lavoro);
    rigaStato(["x/y"], statoPmRepo, statoAgentiAttiviRepo, statoAvanzamentoRepo);
  } finally {
    globalThis.fetch = originale;
  }
});
