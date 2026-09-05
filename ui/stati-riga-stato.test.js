import { test } from "node:test";
import assert from "node:assert/strict";
import {
  situazioneRigaStato,
  testoRigaStatoCaricamento,
  testoRigaStatoIncompleto,
  aggiornaStatoRepo,
  creaStatoSezione,
} from "./lib.js";

function voceRiuscita(dati) {
  return aggiornaStatoRepo(creaStatoSezione(), "x/y", { ok: true, dati })["x/y"];
}

function voceFallita(precedente, errore) {
  return aggiornaStatoRepo(precedente ? { "x/y": precedente } : creaStatoSezione(), "x/y", {
    ok: false,
    errore,
  })["x/y"];
}

// --- situazioneRigaStato ---------------------------------------------------

test("situazioneRigaStato: nessuna fonte ha mai completato un giro dà «caricamento»", () => {
  assert.equal(situazioneRigaStato(undefined, undefined, undefined), "caricamento");
});

test("situazioneRigaStato: una sola fonte mancante dà comunque «caricamento»", () => {
  const pm = voceRiuscita("acceso");
  const agenti = voceRiuscita([]);
  assert.equal(situazioneRigaStato(pm, agenti, undefined), "caricamento");
});

test("situazioneRigaStato: tutte e tre le fonti riuscite dà «riuscito»", () => {
  const pm = voceRiuscita("acceso");
  const agenti = voceRiuscita([]);
  const avanzamento = voceRiuscita({ totale: 0 });
  assert.equal(situazioneRigaStato(pm, agenti, avanzamento), "riuscito");
});

test("situazioneRigaStato: una fonte fallita al primo giro dà «incompleto», non «caricamento»", () => {
  const pm = voceRiuscita("acceso");
  const agenti = voceRiuscita([]);
  const avanzamento = voceFallita(undefined, "errore di rete");
  assert.equal(situazioneRigaStato(pm, agenti, avanzamento), "incompleto");
  // il giro è comunque concluso: la voce esiste, solo senza dati.
  assert.equal(avanzamento.dati, undefined);
});

test("situazioneRigaStato: una fonte che smette di rispondere dopo un giro riuscito resta «incompleto», mai «riuscito»", () => {
  const pm = voceRiuscita("acceso");
  const agenti = voceRiuscita([]);
  const avanzamentoRiuscito = voceRiuscita({ totale: 3 });
  assert.equal(situazioneRigaStato(pm, agenti, avanzamentoRiuscito), "riuscito");

  const avanzamentoFallito = voceFallita(avanzamentoRiuscito, "errore di rete");
  // il dato vecchio resta in memoria (REQ-122, spec 002)...
  assert.deepEqual(avanzamentoFallito.dati, { totale: 3 });
  // ...ma non è mai letto come fresco.
  assert.equal(situazioneRigaStato(pm, agenti, avanzamentoFallito), "incompleto");
});

// --- testoRigaStatoCaricamento ----------------------------------------------

test("testoRigaStatoCaricamento: nomina il repo con tono neutro", () => {
  assert.match(testoRigaStatoCaricamento("uno/due"), /uno\/due/);
  assert.match(testoRigaStatoCaricamento("uno/due"), /caricamento/i);
});

// --- testoRigaStatoIncompleto ------------------------------------------------

test("testoRigaStatoIncompleto: nomina il repo senza ripetere il testo integrale dell'errore", () => {
  const testoOriginaleErrore = "errore di rete: 503 Service Unavailable su /repos/uno/due/issues";
  const testo = testoRigaStatoIncompleto("uno/due");
  assert.match(testo, /uno\/due/);
  assert.ok(!testo.includes(testoOriginaleErrore));
});

// --- nessuna chiamata di rete ------------------------------------------------

test("situazioneRigaStato, testoRigaStatoCaricamento, testoRigaStatoIncompleto: nessuna chiamata di rete", () => {
  const originale = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("non deve chiamare fetch");
  };
  try {
    const pm = voceRiuscita("acceso");
    situazioneRigaStato(pm, undefined, undefined);
    testoRigaStatoCaricamento("x/y");
    testoRigaStatoIncompleto("x/y");
  } finally {
    globalThis.fetch = originale;
  }
});
