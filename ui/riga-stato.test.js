import { test } from "node:test";
import assert from "node:assert/strict";
import { rigaStato, creaStatoSezione, aggiornaStatoRepo } from "./lib.js";

// Costruisce uno stato "reale" con aggiornaStatoRepo, non un oggetto letterale:
// così un test copre anche il campo `nonAggiornato` come lo produce davvero
// la pagina, non solo la forma che *pensiamo* abbia.
function statoConSuccesso(dati) {
  return aggiornaStatoRepo(creaStatoSezione(), "x/repo", { ok: true, dati });
}

function pmDati(stato) {
  return { stato, ultimaEsecuzione: null };
}

function avanzamentoDati(totaleLavoro) {
  return { classificazione: {}, inCoda: 0, lavoro: { totale: totaleLavoro } };
}

// --- nessun repo configurato ------------------------------------------------

test("rigaStato: senza repo configurati rimanda alla configurazione invece di tre zeri", () => {
  const r = rigaStato([], {}, {}, {});
  assert.deepEqual(r, { configurato: false });
});

test("rigaStato: repos null si comporta come nessun repo", () => {
  const r = rigaStato(null, {}, {}, {});
  assert.deepEqual(r, { configurato: false });
});

// --- repo a riposo ----------------------------------------------------------

test("rigaStato: un repo del tutto a riposo lo dice esplicitamente", () => {
  const pm = statoConSuccesso(pmDati("spento"));
  const agenti = statoConSuccesso([]);
  const avanzamento = statoConSuccesso(avanzamentoDati(0));

  const r = rigaStato(["x/repo"], pm, agenti, avanzamento);

  assert.equal(r.configurato, true);
  assert.equal(r.righe.length, 1);
  const riga = r.righe[0];
  assert.equal(riga.completo, true);
  assert.equal(riga.errore, null);
  assert.match(riga.testo, /PM: spento/);
  assert.match(riga.testo, /nessun agente al lavoro/);
  assert.match(riga.testo, /niente in attesa/);
});

test("rigaStato: PM acceso con un agente e due cose in attesa", () => {
  const pm = statoConSuccesso(pmDati("acceso"));
  const agenti = statoConSuccesso([{ titolo: "run", url: "https://x", avviatoA: "2026-01-01" }]);
  const avanzamento = statoConSuccesso(avanzamentoDati(2));

  const r = rigaStato(["x/repo"], pm, agenti, avanzamento);
  const riga = r.righe[0];

  assert.equal(riga.completo, true);
  assert.equal(riga.testo, "PM: acceso · 1 agente al lavoro · 2 cose in attesa");
});

test("rigaStato: pluralizza correttamente gli agenti e il lavoro", () => {
  const pm = statoConSuccesso(pmDati("acceso"));
  const agenti = statoConSuccesso([
    { titolo: "a", url: "https://x/1", avviatoA: "2026-01-01" },
    { titolo: "b", url: "https://x/2", avviatoA: "2026-01-01" },
  ]);
  const avanzamento = statoConSuccesso(avanzamentoDati(5));

  const r = rigaStato(["x/repo"], pm, agenti, avanzamento);

  assert.match(r.righe[0].testo, /2 agenti al lavoro/);
  assert.match(r.righe[0].testo, /5 cose in attesa/);
});

test("rigaStato: PM non installato usa il proprio testo, senza prefisso «PM:»", () => {
  const pm = statoConSuccesso(pmDati("non-installato"));
  const agenti = statoConSuccesso([]);
  const avanzamento = statoConSuccesso(avanzamentoDati(0));

  const r = rigaStato(["x/repo"], pm, agenti, avanzamento);

  assert.match(r.righe[0].testo, /^PM non installato/);
});

// --- un repo mai caricato ----------------------------------------------------

test("rigaStato: un repo mai caricato (nessun giro concluso) non è un errore, solo incompleto", () => {
  const r = rigaStato(["x/repo"], {}, {}, {});
  const riga = r.righe[0];

  assert.equal(riga.completo, false);
  assert.equal(riga.testo, null);
  assert.equal(riga.errore, null);
});

// --- un dato che smette di rispondere dopo un giro riuscito (REQ-122) -------

test("rigaStato: un repo che smette di rispondere dopo un giro riuscito resta incompleto, non finto fresco", () => {
  // Il PM aveva risposto una volta ("acceso"), poi il giro successivo fallisce:
  // aggiornaStatoRepo tiene i vecchi `dati` ma marca `nonAggiornato: true`
  // (REQ-122 spec 002). rigaStato non deve trattare quel dato come affidabile.
  let pm = aggiornaStatoRepo(creaStatoSezione(), "x/repo", { ok: true, dati: pmDati("acceso") });
  pm = aggiornaStatoRepo(pm, "x/repo", { ok: false, errore: "Richiesta a GitHub fallita (codice 503)." });

  const agenti = statoConSuccesso([]);
  const avanzamento = statoConSuccesso(avanzamentoDati(3));

  const r = rigaStato(["x/repo"], pm, agenti, avanzamento);
  const riga = r.righe[0];

  assert.equal(riga.completo, false);
  assert.doesNotMatch(riga.testo || "", /PM: acceso/);
  assert.match(riga.testo, /nessun agente al lavoro/);
  assert.match(riga.testo, /3 cose in attesa/);
  assert.match(riga.errore, /Richiesta a GitHub fallita \(codice 503\)\./);
});

// --- un repo risponde, uno no -----------------------------------------------

test("rigaStato: un repo risponde e uno no — riporta i conteggi del primo e segnala solo il secondo incompleto", () => {
  // Due repo nello stesso stato, come farebbe la pagina.
  let pm = creaStatoSezione();
  pm = aggiornaStatoRepo(pm, "a/uno", { ok: true, dati: pmDati("acceso") });
  pm = aggiornaStatoRepo(pm, "b/due", { ok: false, errore: "Il token non è valido o è scaduto." });

  let agenti = creaStatoSezione();
  agenti = aggiornaStatoRepo(agenti, "a/uno", { ok: true, dati: [] });
  agenti = aggiornaStatoRepo(agenti, "b/due", { ok: false, errore: "Il token non è valido o è scaduto." });

  let avanzamento = creaStatoSezione();
  avanzamento = aggiornaStatoRepo(avanzamento, "a/uno", { ok: true, dati: avanzamentoDati(4) });
  avanzamento = aggiornaStatoRepo(avanzamento, "b/due", { ok: false, errore: "Il token non è valido o è scaduto." });

  const r = rigaStato(["a/uno", "b/due"], pm, agenti, avanzamento);

  assert.equal(r.righe.length, 2);

  const rigaUno = r.righe.find((riga) => riga.repo === "a/uno");
  assert.equal(rigaUno.completo, true);
  assert.equal(rigaUno.testo, "PM: acceso · nessun agente al lavoro · 4 cose in attesa");
  assert.equal(rigaUno.errore, null);

  const rigaDue = r.righe.find((riga) => riga.repo === "b/due");
  assert.equal(rigaDue.completo, false);
  assert.equal(rigaDue.testo, null);
  assert.match(rigaDue.errore, /Il token non è valido o è scaduto\./);
});

test("rigaStato: un secondo repo affidabile per metà mostra ciò che ha, non lo scarta tutto", () => {
  // Solo il caricamento del PM è fallito per questo repo: agenti e lavoro
  // restano affidabili e vanno riportati comunque (non si somma un dato
  // parziale fingendolo totale, ma non si butta via nemmeno quello buono).
  let pm = creaStatoSezione();
  pm = aggiornaStatoRepo(pm, "x/repo", { ok: false, errore: "Errore nel caricamento dello stato del PM." });

  const agenti = statoConSuccesso([{ titolo: "a", url: "https://x", avviatoA: "2026-01-01" }]);
  const avanzamento = statoConSuccesso(avanzamentoDati(1));

  const r = rigaStato(["x/repo"], pm, agenti, avanzamento);
  const riga = r.righe[0];

  assert.equal(riga.completo, false);
  assert.equal(riga.testo, "1 agente al lavoro · 1 cosa in attesa");
  assert.match(riga.errore, /Errore nel caricamento dello stato del PM\./);
});

// --- la funzione non fa richieste di rete -----------------------------------

test("rigaStato: è pura, non chiama fetch", () => {
  const fetchOriginale = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("rigaStato non deve chiamare la rete");
  };
  try {
    const pm = statoConSuccesso(pmDati("acceso"));
    const agenti = statoConSuccesso([]);
    const avanzamento = statoConSuccesso(avanzamentoDati(0));
    rigaStato(["x/repo"], pm, agenti, avanzamento);
    rigaStato([], {}, {}, {});
  } finally {
    globalThis.fetch = fetchOriginale;
  }
});
