import { test } from "node:test";
import assert from "node:assert/strict";
import { versione } from "./lib.js";

test("versione restituisce 0.1.0", () => {
  assert.equal(versione(), "0.1.0");
});
