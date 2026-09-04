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

const ADESSO = "2026-09-04T12:00:00.000Z";

// --- testoStatoPm -------------------------------------------------------

test("testoStatoPm: 'acceso' dà «PM: acceso»", () => {
  assert.equal(testoStatoPm("acceso"), "PM: acceso");
});

test("testoStatoPm: 'spento' dà «PM: spento»", () => {
  assert.equal(testoStatoPm("spento"), "PM: spento");
});

test("testoStatoPm: 'non-installato' dà «PM non installato»", () => {
  assert.equal(testoStatoPm("non-installato"), "PM non installato");
});

// --- pulsantePm: mai due pulsanti insieme -------------------------------

test("pulsantePm: 'acceso' dà «Ferma»", () => {
  assert.equal(pulsantePm("acceso"), "Ferma");
});

test("pulsantePm: 'spento' dà «Avvia»", () => {
  assert.equal(pulsantePm("spento"), "Avvia");
});

test("pulsantePm: 'non-installato' non dà alcun pulsante", () => {
  assert.equal(pulsantePm("non-installato"), null);
});

// --- testoInCodaPm -------------------------------------------------------

test("testoInCodaPm formatta il conteggio", () => {
  assert.equal(testoInCodaPm(3), "In coda: 3");
});

test("testoInCodaPm con zero task in coda", () => {
  assert.equal(testoInCodaPm(0), "In coda: 0");
});

// --- testoUltimaEsecuzionePm ---------------------------------------------

test("testoUltimaEsecuzionePm: nessuna esecuzione", () => {
  const risultato = testoUltimaEsecuzionePm({ esito: "nessuna", data: null, url: null }, ADESSO);
  assert.equal(risultato.testo, "Ultima esecuzione: nessuna");
  assert.equal(risultato.url, null);
});

test("testoUltimaEsecuzionePm: un'esecuzione riuscita porta esito, tempo trascorso e link", () => {
  const risultato = testoUltimaEsecuzionePm(
    { esito: "success", data: "2026-09-04T11:30:00.000Z", url: "https://github.com/x/y/actions/runs/1" },
    ADESSO,
  );
  assert.equal(risultato.testo, "Ultima esecuzione: riuscita, 30 min fa");
  assert.equal(risultato.url, "https://github.com/x/y/actions/runs/1");
});

test("testoUltimaEsecuzionePm: un'esecuzione ancora in corso usa lo status", () => {
  const risultato = testoUltimaEsecuzionePm(
    { esito: "in_progress", data: "2026-09-04T11:55:00.000Z", url: "https://github.com/x/y/actions/runs/2" },
    ADESSO,
  );
  assert.equal(risultato.testo, "Ultima esecuzione: in corso, 5 min fa");
});

// --- messaggioStatoPmNonAggiornato ----------------------------------------

test("messaggioStatoPmNonAggiornato nomina la causa", () => {
  assert.equal(
    messaggioStatoPmNonAggiornato("Token non valido o scaduto."),
    "Stato del PM non aggiornato: Token non valido o scaduto.",
  );
});

// --- rigaPm: la vista combinata -------------------------------------------

test("rigaPm con PM acceso: pulsante «Ferma» e ultima esecuzione presenti", () => {
  const risultato = rigaPm(
    "acceso",
    2,
    { esito: "success", data: "2026-09-04T11:30:00.000Z", url: "https://github.com/x/y/actions/runs/1" },
    ADESSO,
  );
  assert.equal(risultato.testoStato, "PM: acceso");
  assert.equal(risultato.pulsante, "Ferma");
  assert.equal(risultato.testoInCoda, "In coda: 2");
  assert.ok(risultato.ultimaEsecuzione);
  assert.equal(risultato.ultimaEsecuzione.url, "https://github.com/x/y/actions/runs/1");
});

test("rigaPm con PM spento: pulsante «Avvia»", () => {
  const risultato = rigaPm("spento", 0, { esito: "nessuna", data: null, url: null }, ADESSO);
  assert.equal(risultato.pulsante, "Avvia");
});

test("rigaPm con 'non-installato': nessun pulsante e nessuna ultima esecuzione, ma il conteggio in-coda resta", () => {
  const risultato = rigaPm("non-installato", 4, null, ADESSO);
  assert.equal(risultato.pulsante, null);
  assert.equal(risultato.ultimaEsecuzione, null);
  assert.equal(risultato.testoInCoda, "In coda: 4");
});
