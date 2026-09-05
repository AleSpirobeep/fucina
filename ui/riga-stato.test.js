import { test } from "node:test";
import assert from "node:assert/strict";
import { rigaStato, testoAgentiRigaStato, testoLavoroRigaStato } from "./lib.js";

function statoConDati(dati) {
  return { "org/repo": { dati, errore: null, nonAggiornato: false } };
}

test("testoAgentiRigaStato dice esplicitamente quando non c'è nessuno al lavoro", () => {
  assert.equal(testoAgentiRigaStato(0), "nessun agente al lavoro");
});

test("testoAgentiRigaStato usa il singolare con un solo agente", () => {
  assert.equal(testoAgentiRigaStato(1), "1 agente al lavoro");
});

test("testoAgentiRigaStato usa il plurale con più agenti", () => {
  assert.equal(testoAgentiRigaStato(3), "3 agenti al lavoro");
});

test("testoLavoroRigaStato dice esplicitamente quando non c'è niente in attesa", () => {
  assert.equal(testoLavoroRigaStato(0), "niente in attesa");
});

test("testoLavoroRigaStato usa il singolare con una sola cosa in attesa", () => {
  assert.equal(testoLavoroRigaStato(1), "1 cosa in attesa");
});

test("testoLavoroRigaStato usa il plurale con più cose in attesa", () => {
  assert.equal(testoLavoroRigaStato(5), "5 cose in attesa");
});

test("rigaStato senza repo configurati rimanda alla configurazione", () => {
  const risultato = rigaStato([], {}, {}, {});
  assert.equal(risultato.configurato, false);
  assert.deepEqual(risultato.voci, []);
});

test("rigaStato con un repo del tutto a riposo lo dice esplicitamente", () => {
  const repos = ["org/repo"];
  const statoPm = statoConDati({ stato: "spento", ultimaEsecuzione: null });
  const statoAgenti = statoConDati([]);
  const statoAvanzamento = statoConDati({
    classificazione: {},
    inCoda: 0,
    lavoro: { prDaRevisionare: [], domande: [], inCoda: [], totale: 0 },
  });

  const risultato = rigaStato(repos, statoPm, statoAgenti, statoAvanzamento);

  assert.equal(risultato.configurato, true);
  assert.equal(risultato.voci.length, 1);
  const [voce] = risultato.voci;
  assert.equal(voce.completo, true);
  assert.match(voce.testo, /nessun agente al lavoro/);
  assert.match(voce.testo, /niente in attesa/);
  assert.notEqual(voce.testo.trim(), "");
});

test("rigaStato segnala l'incompletezza invece di trattare un dato mancante come zero", () => {
  const repos = ["org/repo"];
  const statoPm = statoConDati({ stato: "acceso", ultimaEsecuzione: null });
  const statoAgenti = {}; // la chiamata per gli agenti non ha ancora risposto
  const statoAvanzamento = statoConDati({
    classificazione: {},
    inCoda: 0,
    lavoro: { prDaRevisionare: [], domande: [], inCoda: [], totale: 2 },
  });

  const risultato = rigaStato(repos, statoPm, statoAgenti, statoAvanzamento);

  const [voce] = risultato.voci;
  assert.equal(voce.completo, false);
  assert.equal(voce.agenti, null);
  assert.match(voce.testo, /incomplet/i);
});

test("rigaStato con un repo che risponde e uno che no non somma dati parziali", () => {
  const repos = ["org/completo", "org/incompleto"];
  const statoPm = {
    "org/completo": { dati: { stato: "acceso", ultimaEsecuzione: null }, errore: null, nonAggiornato: false },
    "org/incompleto": { dati: undefined, errore: "Richiesta a GitHub fallita.", nonAggiornato: true },
  };
  const statoAgenti = {
    "org/completo": { dati: [{ titolo: "PR 1", url: "https://x", avviatoA: "2026-09-05T00:00:00Z" }], errore: null, nonAggiornato: false },
  };
  const statoAvanzamento = {
    "org/completo": {
      dati: { classificazione: {}, inCoda: 0, lavoro: { prDaRevisionare: [], domande: [], inCoda: [], totale: 4 } },
      errore: null,
      nonAggiornato: false,
    },
  };

  const risultato = rigaStato(repos, statoPm, statoAgenti, statoAvanzamento);

  assert.equal(risultato.voci.length, 2);
  const [completo, incompleto] = risultato.voci;

  assert.equal(completo.completo, true);
  assert.equal(completo.agenti, 1);
  assert.equal(completo.lavoro, 4);

  assert.equal(incompleto.completo, false);
  assert.equal(incompleto.pm, null);
  assert.equal(incompleto.agenti, null);
  assert.equal(incompleto.lavoro, null);
  assert.notEqual(incompleto.lavoro, 0);
});

test("rigaStato non fa richieste di rete", () => {
  const globaleFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("rigaStato non deve chiamare fetch");
  };
  try {
    rigaStato(["org/repo"], {}, {}, {});
  } finally {
    globalThis.fetch = globaleFetch;
  }
});
