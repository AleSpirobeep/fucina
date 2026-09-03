import test from "node:test";
import assert from "node:assert/strict";
import {
  formattaOra,
  creaStatoSezione,
  aggiornaStatoRepo,
  creaStatoAggiornamento,
  avviaAggiornamento,
  terminaAggiornamento,
} from "./lib.js";

test("formattaOra restituisce l'orario nel formato HH:MM:SS", () => {
  const iso = "2026-09-03T14:07:05.000Z";
  const d = new Date(iso);
  const due = (n) => String(n).padStart(2, "0");
  const atteso = `${due(d.getHours())}:${due(d.getMinutes())}:${due(d.getSeconds())}`;

  assert.strictEqual(formattaOra(iso), atteso);
  assert.match(formattaOra(iso), /^\d{2}:\d{2}:\d{2}$/);
});

test("formattaOra riempie con zero le cifre singole", () => {
  const iso = "2026-01-01T00:05:09.000Z";
  const d = new Date(iso);
  const due = (n) => String(n).padStart(2, "0");
  const atteso = `${due(d.getHours())}:${due(d.getMinutes())}:${due(d.getSeconds())}`;

  assert.strictEqual(formattaOra(iso), atteso);
});

test("creaStatoSezione parte vuoto", () => {
  assert.deepStrictEqual(creaStatoSezione(), {});
});

test("aggiornaStatoRepo salva i dati in caso di successo", () => {
  const stato = aggiornaStatoRepo(creaStatoSezione(), "a/b", { ok: true, dati: { x: 1 } });
  assert.deepStrictEqual(stato["a/b"], { dati: { x: 1 }, errore: null, nonAggiornato: false });
});

test("aggiornaStatoRepo mantiene i dati precedenti in caso di errore", () => {
  let stato = aggiornaStatoRepo(creaStatoSezione(), "a/b", { ok: true, dati: { x: 1 } });
  stato = aggiornaStatoRepo(stato, "a/b", { ok: false, errore: "Token non valido." });
  assert.deepStrictEqual(stato["a/b"], {
    dati: { x: 1 },
    errore: "Token non valido.",
    nonAggiornato: true,
  });
});

test("aggiornaStatoRepo senza dati precedenti lascia i dati assenti in caso di errore", () => {
  const stato = aggiornaStatoRepo(creaStatoSezione(), "a/b", { ok: false, errore: "Token non valido." });
  assert.deepStrictEqual(stato["a/b"], { dati: undefined, errore: "Token non valido.", nonAggiornato: true });
});

test("aggiornaStatoRepo non tocca lo stato degli altri repo", () => {
  let stato = aggiornaStatoRepo(creaStatoSezione(), "a/b", { ok: true, dati: 1 });
  stato = aggiornaStatoRepo(stato, "c/d", { ok: true, dati: 2 });
  assert.strictEqual(stato["a/b"].dati, 1);
  assert.strictEqual(stato["c/d"].dati, 2);
});

test("creaStatoAggiornamento parte senza aggiornamento in corso e senza ora", () => {
  assert.deepStrictEqual(creaStatoAggiornamento(), { inCorso: false, ultimoAggiornamento: null });
});

test("avviaAggiornamento passa a in corso quando è libero", () => {
  const stato = avviaAggiornamento(creaStatoAggiornamento());
  assert.deepStrictEqual(stato, { inCorso: true, ultimoAggiornamento: null });
});

test("avviaAggiornamento rifiuta un secondo avvio mentre uno è già in corso", () => {
  const stato = avviaAggiornamento(creaStatoAggiornamento());
  assert.strictEqual(avviaAggiornamento(stato), null);
});

test("terminaAggiornamento registra l'ora quando il ciclo non ha errori", () => {
  const stato = avviaAggiornamento(creaStatoAggiornamento());
  const finale = terminaAggiornamento(stato, "2026-09-03T14:07:30.000Z", false);
  assert.deepStrictEqual(finale, { inCorso: false, ultimoAggiornamento: "2026-09-03T14:07:30.000Z" });
});

test("terminaAggiornamento mantiene l'ora precedente se il ciclo ha errori", () => {
  let stato = avviaAggiornamento(creaStatoAggiornamento());
  stato = terminaAggiornamento(stato, "2026-09-03T14:07:30.000Z", false);
  stato = avviaAggiornamento(stato);
  const finale = terminaAggiornamento(stato, "2026-09-03T14:08:30.000Z", true);
  assert.deepStrictEqual(finale, { inCorso: false, ultimoAggiornamento: "2026-09-03T14:07:30.000Z" });
});
