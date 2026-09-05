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

// --- situazioneRigaStato ----------------------------------------------------

test("situazioneRigaStato: nessuna delle tre fonti ha ancora completato un giro dà «caricamento»", () => {
  assert.equal(situazioneRigaStato(undefined, undefined, undefined), "caricamento");
});

test("situazioneRigaStato: anche una sola fonte mai completata dà «caricamento»", () => {
  const pm = voceRiuscita({ stato: "acceso" });
  const agenti = voceRiuscita([]);
  assert.equal(situazioneRigaStato(pm, agenti, undefined), "caricamento");
});

test("situazioneRigaStato: tutte e tre completate con successo dà «riuscito»", () => {
  const pm = voceRiuscita({ stato: "acceso" });
  const agenti = voceRiuscita([]);
  const avanzamento = voceRiuscita({ lavoro: { totale: 0 } });
  assert.equal(situazioneRigaStato(pm, agenti, avanzamento), "riuscito");
});

test("situazioneRigaStato: una fonte il cui ultimo giro è fallito dà «incompleto», anche se non ha mai avuto dati", () => {
  const pm = voceFallita(null, "errore di rete");
  const agenti = voceRiuscita([]);
  const avanzamento = voceRiuscita({ lavoro: { totale: 0 } });
  assert.equal(situazioneRigaStato(pm, agenti, avanzamento), "incompleto");
});

test("situazioneRigaStato: una fonte che ha smesso di rispondere dopo un giro riuscito resta «incompleto», mai «riuscito»", () => {
  const pmRiuscita = voceRiuscita({ stato: "acceso" });
  const pmOraFallita = voceFallita(pmRiuscita, "token scaduto");
  const agenti = voceRiuscita([]);
  const avanzamento = voceRiuscita({ lavoro: { totale: 0 } });

  assert.equal(situazioneRigaStato(pmOraFallita, agenti, avanzamento), "incompleto");
  // il dato vecchio resta in memoria (REQ-122) ma non va mai presentato come aggiornato:
  // `nonAggiornato` lo segnala, `situazioneRigaStato` non lo ignora.
  assert.equal(pmOraFallita.nonAggiornato, true);
  assert.equal(pmOraFallita.dati.stato, "acceso");
});

// --- testoRigaStatoCaricamento -----------------------------------------------

test("testoRigaStatoCaricamento: nomina il repo, tono neutro", () => {
  assert.equal(testoRigaStatoCaricamento("owner/repo"), "owner/repo: caricamento…");
});

// --- testoRigaStatoIncompleto -------------------------------------------------

test("testoRigaStatoIncompleto: nomina il repo senza ripetere il testo integrale dell'errore", () => {
  const testo = testoRigaStatoIncompleto("owner/repo");
  assert.match(testo, /owner\/repo/);
  assert.doesNotMatch(testo, /errore di rete|token scaduto/);
});

// --- nessuna richiesta di rete -------------------------------------------------

test("situazioneRigaStato e i testi della riga non fanno alcuna richiesta di rete", () => {
  const originale = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("non deve chiamare fetch");
  };
  try {
    situazioneRigaStato(undefined, undefined, undefined);
    testoRigaStatoCaricamento("x/y");
    testoRigaStatoIncompleto("x/y");
  } finally {
    globalThis.fetch = originale;
  }
});
