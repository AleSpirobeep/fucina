import { test } from "node:test";
import assert from "node:assert/strict";
import {
  testoStatoPm,
  pulsantePm,
  testoInCodaPm,
  testoUltimaEsecuzionePm,
  messaggioStatoPmNonAggiornato,
  rigaPm,
} from "./lib.js";

const ADESSO = "2026-09-04T20:00:00Z";

// --- testoStatoPm -------------------------------------------------------

test("testoStatoPm: acceso", () => {
  assert.equal(testoStatoPm("acceso"), "PM: acceso");
});

test("testoStatoPm: spento", () => {
  assert.equal(testoStatoPm("spento"), "PM: spento");
});

test("testoStatoPm: non-installato", () => {
  assert.equal(testoStatoPm("non-installato"), "PM non installato");
});

// --- pulsantePm: mai due pulsanti insieme (REQ-410) ----------------------

test("pulsantePm: acceso dà 'Ferma'", () => {
  assert.equal(pulsantePm("acceso"), "Ferma");
});

test("pulsantePm: spento dà 'Avvia'", () => {
  assert.equal(pulsantePm("spento"), "Avvia");
});

test("pulsantePm: non-installato non dà alcun pulsante", () => {
  assert.equal(pulsantePm("non-installato"), null);
});

// --- testoInCodaPm --------------------------------------------------------

test("testoInCodaPm mostra il numero di task in coda", () => {
  assert.equal(testoInCodaPm(0), "In coda: 0");
  assert.equal(testoInCodaPm(3), "In coda: 3");
});

// --- testoUltimaEsecuzionePm ----------------------------------------------

test("testoUltimaEsecuzionePm: nessuna esecuzione", () => {
  assert.equal(
    testoUltimaEsecuzionePm({ esito: "nessuna", data: null, url: null }, ADESSO),
    "Ultima esecuzione: nessuna",
  );
  assert.equal(testoUltimaEsecuzionePm(null, ADESSO), "Ultima esecuzione: nessuna");
});

test("testoUltimaEsecuzionePm: un'esecuzione conclusa mostra esito e tempo trascorso", () => {
  const ultimaEsecuzione = { esito: "success", data: "2026-09-04T19:55:00Z", url: "https://x" };
  assert.equal(
    testoUltimaEsecuzionePm(ultimaEsecuzione, ADESSO),
    "Ultima esecuzione: success (5 min fa)",
  );
});

// --- messaggioStatoPmNonAggiornato (REQ-403) -------------------------------

test("messaggioStatoPmNonAggiornato nomina l'errore", () => {
  assert.equal(
    messaggioStatoPmNonAggiornato("Token non valido o scaduto."),
    "Stato del PM non aggiornato: Token non valido o scaduto.",
  );
});

// --- rigaPm: la vista combinata -------------------------------------------

test("rigaPm con il PM acceso espone solo 'Ferma' e l'ultima esecuzione", () => {
  const ultimaEsecuzione = { esito: "success", data: "2026-09-04T19:55:00Z", url: "https://x" };
  const riga = rigaPm("acceso", 2, ultimaEsecuzione, ADESSO);
  assert.equal(riga.testoStato, "PM: acceso");
  assert.equal(riga.pulsante, "Ferma");
  assert.equal(riga.testoInCoda, "In coda: 2");
  assert.equal(riga.ultimaEsecuzione, ultimaEsecuzione);
  assert.equal(riga.testoUltimaEsecuzione, "Ultima esecuzione: success (5 min fa)");
});

test("rigaPm con il PM spento espone solo 'Avvia'", () => {
  const riga = rigaPm("spento", 0, { esito: "nessuna", data: null, url: null }, ADESSO);
  assert.equal(riga.pulsante, "Avvia");
});

test("rigaPm con 'non-installato' non ha pulsante né ultima esecuzione", () => {
  const riga = rigaPm("non-installato", 0, { esito: "success", data: ADESSO, url: "https://x" }, ADESSO);
  assert.equal(riga.pulsante, null);
  assert.equal(riga.ultimaEsecuzione, null);
  assert.equal(riga.testoUltimaEsecuzione, null);
});
