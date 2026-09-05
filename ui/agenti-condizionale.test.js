import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sezioneAgentiAttiviVisibile,
  agentiAttivi,
  aggiornaStatoRepo,
  creaStatoSezione,
} from "./lib.js";

function statoAgentiCaricato(repo, agenti) {
  return aggiornaStatoRepo(creaStatoSezione(), repo, { ok: true, dati: agenti });
}

// --- sezioneAgentiAttiviVisibile -------------------------------------------

test("sezioneAgentiAttiviVisibile: senza repo configurati è false", () => {
  assert.equal(sezioneAgentiAttiviVisibile([], {}), false);
});

test("sezioneAgentiAttiviVisibile: repo configurato ma dati non ancora arrivati è false", () => {
  assert.equal(sezioneAgentiAttiviVisibile(["x/y"], {}), false);
});

test("sezioneAgentiAttiviVisibile: repo caricato senza agenti è false", () => {
  const stato = statoAgentiCaricato("x/y", []);
  assert.equal(sezioneAgentiAttiviVisibile(["x/y"], stato), false);
});

test("sezioneAgentiAttiviVisibile: un repo con un agente al lavoro è true", () => {
  const stato = statoAgentiCaricato("x/y", [
    { titolo: "esegui", url: "https://github.com/x/y/actions/runs/1", avviatoA: null },
  ]);
  assert.equal(sezioneAgentiAttiviVisibile(["x/y"], stato), true);
});

test("sezioneAgentiAttiviVisibile: true se anche un solo repo fra tanti ha agenti", () => {
  let stato = statoAgentiCaricato("x/a", []);
  stato = { ...stato, ...statoAgentiCaricato("x/b", [{ titolo: "t", url: "u", avviatoA: null }]) };
  assert.equal(sezioneAgentiAttiviVisibile(["x/a", "x/b"], stato), true);
});

test("sezioneAgentiAttiviVisibile: un repo non aggiornato (senza dati precedenti) resta false", () => {
  const stato = aggiornaStatoRepo(creaStatoSezione(), "x/y", { ok: false, errore: "boom" });
  assert.equal(sezioneAgentiAttiviVisibile(["x/y"], stato), false);
});

// --- coerenza con agentiAttivi, che alimenta lo stato ----------------------

test("sezioneAgentiAttiviVisibile riflette gli stati che agentiAttivi considera attivi", () => {
  const runs = [
    { status: "completed", display_title: "vecchia", html_url: "u1", run_started_at: null },
    { status: "queued", display_title: "in coda", html_url: "u2", run_started_at: null },
  ];
  const stato = statoAgentiCaricato("x/y", agentiAttivi(runs));
  assert.equal(sezioneAgentiAttiviVisibile(["x/y"], stato), true);
});

test("sezioneAgentiAttiviVisibile è false quando agentiAttivi non trova esecuzioni attive", () => {
  const runs = [{ status: "completed", display_title: "vecchia", html_url: "u1", run_started_at: null }];
  const stato = statoAgentiCaricato("x/y", agentiAttivi(runs));
  assert.equal(sezioneAgentiAttiviVisibile(["x/y"], stato), false);
});
