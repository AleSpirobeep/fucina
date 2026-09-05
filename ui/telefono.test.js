import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Legge il vero index.html, come contrasto.test.js: il test verifica la pagina
// spedita, non una sua copia che potrebbe divergere.
const PERCORSO_INDEX = fileURLToPath(new URL("./index.html", import.meta.url));
const HTML = readFileSync(PERCORSO_INDEX, "utf8");
const BLOCCO_TESTA = HTML.match(/<head>([\s\S]*?)<\/head>/)[1];
const BLOCCO_STILE = HTML.match(/<style>([\s\S]*?)<\/style>/)[1];

// Stesso schema di contrasto.test.js: il gruppo di apertura non consuma la
// graffa di chiusura della regola precedente.
function tutteLeRegole(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selettore, dichiarazioni]) => ({
    selettore: selettore.trim(),
    dichiarazioni,
  }));
}

function regolaEsatta(css, selettoreAtteso) {
  return tutteLeRegole(css).find(
    (regola) => regola.selettore.replace(/\s+/g, " ") === selettoreAtteso,
  );
}

test("il meta viewport è presente e usa la larghezza del dispositivo", () => {
  const meta = BLOCCO_TESTA.match(/<meta\s+name="viewport"\s+content="([^"]+)"\s*\/?>/);
  assert.ok(meta, "nessun meta viewport trovato in <head>");
  assert.match(meta[1], /width=device-width/);
});

test("la regola body non impone una larghezza minima fissa", () => {
  const regola = regolaEsatta(BLOCCO_STILE, "body");
  assert.ok(regola, "nessuna regola per body");
  assert.doesNotMatch(regola.dichiarazioni, /min-width/);
});

test("nessuna regola del foglio di stile dichiara una min-width oltre l'area toccabile", () => {
  const larghezze = [...BLOCCO_STILE.matchAll(/min-width:\s*(\d+)px/g)].map((m) => Number(m[1]));
  assert.ok(larghezze.length > 0, "nessuna min-width in px trovata: il test non verifica nulla");
  for (const larghezza of larghezze) {
    assert.ok(larghezza <= 44, `min-width di ${larghezza}px supera l'area toccabile di 44px`);
  }
});

test("i pulsanti hanno un'area toccabile di almeno 44×44 px", () => {
  const regola = regolaEsatta(BLOCCO_STILE, "button");
  assert.ok(regola, "nessuna regola per il selettore 'button'");
  assert.match(regola.dichiarazioni, /min-width:\s*44px/);
  assert.match(regola.dichiarazioni, /min-height:\s*44px/);
});

test("sotto una soglia di almeno 360 px la griglia secondaria diventa una colonna", () => {
  const corrispondenza = BLOCCO_STILE.match(
    /@media\s*\(max-width:\s*(\d+)px\)\s*\{\s*\.griglia-secondaria\s*\{\s*grid-template-columns:\s*1fr;/,
  );
  assert.ok(corrispondenza, "nessuna media query trovata per .griglia-secondaria a una colonna");
  assert.ok(
    Number(corrispondenza[1]) >= 360,
    `la soglia (${corrispondenza[1]}px) è sotto i 360px richiesti`,
  );
});

test("i conteggi vanno a capo invece di scorrere lateralmente", () => {
  const regola = regolaEsatta(BLOCCO_STILE, ".conteggi-avanzamento");
  assert.ok(regola, "nessuna regola per .conteggi-avanzamento");
  assert.match(regola.dichiarazioni, /flex-wrap:\s*wrap/);
});

test("input e textarea occupano lo spazio disponibile invece di una larghezza fissa in caratteri", () => {
  const regola = regolaEsatta(BLOCCO_STILE, "input, textarea");
  assert.ok(regola, "nessuna regola per 'input, textarea'");
  assert.match(regola.dichiarazioni, /width:\s*100%/);
});

test("l'a-capo del testo del body arriva a un nome di repo lungo senza essere spento", () => {
  const regolaBody = regolaEsatta(BLOCCO_STILE, "body");
  assert.match(regolaBody.dichiarazioni, /overflow-wrap:\s*anywhere/);

  const regoleCheSpengono = tutteLeRegole(BLOCCO_STILE).filter((regola) =>
    /overflow-wrap:\s*(normal|break-word)/.test(regola.dichiarazioni),
  );
  assert.equal(regoleCheSpengono.length, 0, "una regola spegne overflow-wrap altrove nel foglio di stile");
});
