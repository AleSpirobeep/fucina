import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifica,
  tabellaAvanzamento,
  idDettaglioAvanzamento,
  dettagliApertiDaTesto,
  testoDettagliAperti,
  alternaDettaglioAperto,
  dettagliApertiValidi,
} from "./lib.js";

const OGGI = "2026-09-05T12:00:00.000Z";

function issue(numero) {
  return {
    number: numero,
    title: `issue ${numero}`,
    html_url: `https://github.com/x/y/issues/${numero}`,
    state: "open",
    labels: [{ name: "in-coda" }],
  };
}

// --- tabellaAvanzamento con i task in coda ---------------------------------

test("tabellaAvanzamento senza il secondo parametro resta sulle sei colonne", () => {
  const r = tabellaAvanzamento(classifica([], [], OGGI));
  assert.equal(r.length, 6);
  assert.equal(r.some((c) => c.chiave === "inCoda"), false);
});

test("tabellaAvanzamento con gli issue in coda aggiunge la settima colonna con titoli e link", () => {
  const inCoda = [issue(10), issue(11)];
  const r = tabellaAvanzamento(classifica([], [], OGGI), inCoda);
  assert.equal(r.length, 7);
  const voce = r.find((c) => c.chiave === "inCoda");
  assert.equal(voce.etichetta, "In coda");
  assert.equal(voce.conteggio, 2);
  assert.deepEqual(voce.elementi, [
    { titolo: "issue 10", url: "https://github.com/x/y/issues/10" },
    { titolo: "issue 11", url: "https://github.com/x/y/issues/11" },
  ]);
});

test("un elenco in coda vuoto produce una settima colonna a conteggio zero", () => {
  const r = tabellaAvanzamento(classifica([], [], OGGI), []);
  const voce = r.find((c) => c.chiave === "inCoda");
  assert.equal(voce.conteggio, 0);
  assert.deepEqual(voce.elementi, []);
});

// --- l'id del dettaglio -----------------------------------------------------

test("idDettaglioAvanzamento distingue lo stesso conteggio fra repo diversi", () => {
  assert.notEqual(
    idDettaglioAvanzamento("proprietario/uno", "fatte"),
    idDettaglioAvanzamento("proprietario/due", "fatte"),
  );
});

test("idDettaglioAvanzamento distingue conteggi diversi dello stesso repo", () => {
  assert.notEqual(
    idDettaglioAvanzamento("proprietario/uno", "fatte"),
    idDettaglioAvanzamento("proprietario/uno", "backlog"),
  );
});

// --- la memoria dei dettagli aperti -----------------------------------------

test("dettagliApertiDaTesto non concede memoria quando manca", () => {
  assert.deepEqual(dettagliApertiDaTesto(null), []);
  assert.deepEqual(dettagliApertiDaTesto(undefined), []);
  assert.deepEqual(dettagliApertiDaTesto(""), []);
});

test("dettagliApertiDaTesto ignora un testo malformato invece di lanciare un errore", () => {
  assert.deepEqual(dettagliApertiDaTesto("{non è json"), []);
  assert.deepEqual(dettagliApertiDaTesto('{"a":1}'), []);
  assert.deepEqual(dettagliApertiDaTesto("[1, 2, {}]"), []);
});

test("testoDettagliAperti e dettagliApertiDaTesto fanno andata e ritorno", () => {
  const id = idDettaglioAvanzamento("proprietario/uno", "fatte");
  assert.deepEqual(dettagliApertiDaTesto(testoDettagliAperti([id])), [id]);
  assert.deepEqual(dettagliApertiDaTesto(testoDettagliAperti([])), []);
});

test("alternaDettaglioAperto apre un conteggio chiuso", () => {
  const id = idDettaglioAvanzamento("proprietario/uno", "fatte");
  assert.deepEqual(alternaDettaglioAperto([], id), [id]);
});

test("alternaDettaglioAperto richiude un conteggio aperto", () => {
  const id = idDettaglioAvanzamento("proprietario/uno", "fatte");
  assert.deepEqual(alternaDettaglioAperto([id], id), []);
});

test("alternaDettaglioAperto non muta l'elenco ricevuto", () => {
  const id = idDettaglioAvanzamento("proprietario/uno", "fatte");
  const originale = [];
  alternaDettaglioAperto(originale, id);
  assert.deepEqual(originale, []);
});

test("dettagliApertiValidi dimentica un conteggio del repo tornato a zero", () => {
  const idFatte = idDettaglioAvanzamento("proprietario/uno", "fatte");
  const idBacklog = idDettaglioAvanzamento("proprietario/uno", "backlog");
  const risultato = dettagliApertiValidi([idFatte, idBacklog], "proprietario/uno", [idBacklog]);
  assert.deepEqual(risultato, [idBacklog]);
});

test("dettagliApertiValidi non tocca i conteggi di un altro repo", () => {
  const idAltroRepo = idDettaglioAvanzamento("proprietario/due", "fatte");
  const risultato = dettagliApertiValidi([idAltroRepo], "proprietario/uno", []);
  assert.deepEqual(risultato, [idAltroRepo]);
});

test("dettagliApertiValidi tiene un conteggio del repo che è ancora apribile", () => {
  const idFatte = idDettaglioAvanzamento("proprietario/uno", "fatte");
  const risultato = dettagliApertiValidi([idFatte], "proprietario/uno", [idFatte]);
  assert.deepEqual(risultato, [idFatte]);
});
