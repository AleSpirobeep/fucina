import { test } from "node:test";
import assert from "node:assert/strict";
import { estraiSezioni } from "./lib.js";

// Corpo ricostruito nella forma delle PR aperte dal workflow della fucina
// (vedi docs/decisions/2026-09-02-1700-pr-aperta-dal-workflow.md): non è stato
// possibile recuperare il testo esatto della PR #6 di fucina-lab da questa
// sessione, priva di accesso alla rete e a `gh` (vedi sezione "Non fatto"
// della PR). La forma — titolo, corpo, tre sezioni in quest'ordine — è quella
// documentata e imposta dal ruolo dev-agent.
const CORPO_PR_6_FUCINA_LAB = `Implementa la validazione del formato \`proprietario/nome\` per l'elenco dei
repo, con messaggio d'errore che elenca le righe non valide. Closes #6.

## Decisioni
Nessun ADR: la validazione è quella richiesta dalla spec, nessuna scelta
lasciata aperta.

## Non fatto
Nulla.

## Fatto in più
Nulla.
`;

// Stessa cautela della PR #6: corpo ricostruito nella forma standard, non il
// testo esatto della PR #9 di fucina-lab.
const CORPO_PR_9_FUCINA_LAB = `## Fatto in più
Ho riordinato i due paragrafi introduttivi di \`README.md\` perché il vecchio
ordine anticipava un comando non ancora spiegato.

## Non fatto
- REQ-122 (aggiornamento automatico ogni 60 secondi): rimandato, richiede il
  client GitHub che arriva con T5.

## Decisioni
- [2026-08-31-0900-formato-data-italiano](../docs/decisions/2026-08-31-0900-formato-data-italiano.md)
`;

const CORPO_SENZA_SEZIONI = `Aggiorna la versione di Node richiesta nel README e nel workflow di CI.

Nessuna sezione: è una modifica di manutenzione, non generata dal ruolo
dev-agent.
`;

test("estraiSezioni legge le tre sezioni dal corpo in stile PR #6 di fucina-lab", () => {
  const sezioni = estraiSezioni(CORPO_PR_6_FUCINA_LAB);
  assert.equal(sezioni.decisioni, "Nessun ADR: la validazione è quella richiesta dalla spec, nessuna scelta\nlasciata aperta.");
  assert.equal(sezioni.nonFatto, "Nulla.");
  assert.equal(sezioni.fattoInPiu, "Nulla.");
});

test("estraiSezioni legge le tre sezioni in un ordine diverso, come nel corpo in stile PR #9 di fucina-lab", () => {
  const sezioni = estraiSezioni(CORPO_PR_9_FUCINA_LAB);
  assert.match(sezioni.fattoInPiu, /README\.md/);
  assert.match(sezioni.nonFatto, /REQ-122/);
  assert.match(sezioni.decisioni, /formato-data-italiano/);
});

test("estraiSezioni su un corpo senza sezioni restituisce null per tutte e tre", () => {
  const sezioni = estraiSezioni(CORPO_SENZA_SEZIONI);
  assert.deepEqual(sezioni, { nonFatto: null, fattoInPiu: null, decisioni: null });
});

test("estraiSezioni restituisce una sezione vuota ('Nulla') come testo, non come null", () => {
  const corpo = `## Non fatto\nNulla\n\n## Fatto in più\nNulla\n`;
  const sezioni = estraiSezioni(corpo);
  assert.equal(sezioni.nonFatto, "Nulla");
  assert.equal(sezioni.fattoInPiu, "Nulla");
  assert.equal(sezioni.decisioni, null);
});

test("estraiSezioni riconosce le intestazioni a prescindere dall'ordine", () => {
  const corpo = `## Decisioni\nprima\n\n## Fatto in più\nseconda\n\n## Non fatto\nterza\n`;
  const sezioni = estraiSezioni(corpo);
  assert.equal(sezioni.decisioni, "prima");
  assert.equal(sezioni.fattoInPiu, "seconda");
  assert.equal(sezioni.nonFatto, "terza");
});

test("estraiSezioni ignora le intestazioni di livello 3 dentro una sezione", () => {
  const corpo = `## Non fatto\nElenco:\n### Dettaglio\ncontenuto del dettaglio\n\n## Decisioni\nnulla\n`;
  const sezioni = estraiSezioni(corpo);
  assert.equal(sezioni.nonFatto, "Elenco:\n### Dettaglio\ncontenuto del dettaglio");
  assert.equal(sezioni.decisioni, "nulla");
});

test("estraiSezioni su stringa vuota o assente restituisce null per tutte e tre", () => {
  assert.deepEqual(estraiSezioni(""), { nonFatto: null, fattoInPiu: null, decisioni: null });
  assert.deepEqual(estraiSezioni(undefined), { nonFatto: null, fattoInPiu: null, decisioni: null });
});
