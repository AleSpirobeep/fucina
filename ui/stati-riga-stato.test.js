import { test } from "node:test";
import assert from "node:assert/strict";
import {
  situazioneRigaStato,
  testoRigaStatoCaricamento,
  testoRigaStatoIncompleto,
  creaStatoSezione,
  aggiornaStatoRepo,
} from "./lib.js";

const VOCE_FRESCA = { dati: { valore: 1 }, errore: null, nonAggiornato: false };

test("situazioneRigaStato: caricamento quando nessuna delle tre fonti ha mai completato un giro", () => {
  assert.equal(situazioneRigaStato(undefined, undefined, undefined), "caricamento");
});

test("situazioneRigaStato: caricamento quando manca anche una sola fonte", () => {
  assert.equal(situazioneRigaStato(VOCE_FRESCA, VOCE_FRESCA, undefined), "caricamento");
  assert.equal(situazioneRigaStato(undefined, VOCE_FRESCA, VOCE_FRESCA), "caricamento");
  assert.equal(situazioneRigaStato(VOCE_FRESCA, undefined, VOCE_FRESCA), "caricamento");
});

test("situazioneRigaStato: riuscito solo quando tutte e tre le fonti sono fresche", () => {
  assert.equal(situazioneRigaStato(VOCE_FRESCA, VOCE_FRESCA, VOCE_FRESCA), "riuscito");
});

test("situazioneRigaStato: incompleto quando una fonte fallisce al proprio primo giro", () => {
  let statoAgenti = creaStatoSezione();
  statoAgenti = aggiornaStatoRepo(statoAgenti, "org/repo", { ok: false, errore: "500" });

  assert.equal(
    situazioneRigaStato(VOCE_FRESCA, statoAgenti["org/repo"], VOCE_FRESCA),
    "incompleto",
  );
});

test("situazioneRigaStato: una fonte che smette di rispondere dopo un giro riuscito resta incompleto, mai riuscito, e non perde i dati vecchi", () => {
  let statoPm = creaStatoSezione();
  statoPm = aggiornaStatoRepo(statoPm, "org/repo", { ok: true, dati: { stato: "acceso" } });
  const datiDelGiroRiuscito = statoPm["org/repo"].dati;

  statoPm = aggiornaStatoRepo(statoPm, "org/repo", { ok: false, errore: "Timeout" });

  assert.deepEqual(statoPm["org/repo"].dati, datiDelGiroRiuscito);
  assert.equal(statoPm["org/repo"].nonAggiornato, true);
  assert.equal(
    situazioneRigaStato(statoPm["org/repo"], VOCE_FRESCA, VOCE_FRESCA),
    "incompleto",
  );
});

test("testoRigaStatoCaricamento: nomina il repo, con tono neutro", () => {
  const testo = testoRigaStatoCaricamento("org/repo");
  assert.match(testo, /org\/repo/);
});

test("testoRigaStatoIncompleto: nomina il repo senza ripetere il testo integrale dell'errore", () => {
  const erroreOriginale = "Richiesta a GitHub fallita (codice 503): il servizio non risponde";
  const testo = testoRigaStatoIncompleto("org/repo");

  assert.match(testo, /org\/repo/);
  assert.doesNotMatch(testo, /503/);
  assert.doesNotMatch(testo, new RegExp(erroreOriginale.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("i due testi restano distinti fra loro", () => {
  assert.notEqual(testoRigaStatoCaricamento("org/repo"), testoRigaStatoIncompleto("org/repo"));
});

test("le funzioni non fanno richieste di rete", () => {
  const fetchOriginale = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("situazioneRigaStato e i suoi testi non devono chiamare fetch");
  };
  try {
    situazioneRigaStato(VOCE_FRESCA, VOCE_FRESCA, VOCE_FRESCA);
    situazioneRigaStato(undefined, undefined, undefined);
    testoRigaStatoCaricamento("org/repo");
    testoRigaStatoIncompleto("org/repo");
  } finally {
    globalThis.fetch = fetchOriginale;
  }
});
