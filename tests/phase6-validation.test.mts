import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { atelierInputRecord, atelierInteger, atelierText, atelierUuid, appointmentPurposeLabel } from "../src/lib/atelier-service.ts";

test("atelier mutation inputs reject identity, authority and unexpected fields", () => {
  for (const field of ["customerId", "staffId", "senderType", "sender_id", "status", "confirmed", "__proto__"]) {
    const value = JSON.parse(`{"message":"Hello","${field}":"forged"}`);
    assert.throws(() => atelierInputRecord(value, ["message"]), field);
  }
  for (const value of [null, "text", [], 7]) assert.throws(() => atelierInputRecord(value, ["message"]));
  assert.deepEqual(atelierInputRecord({ message: "Hello", operationKey: "key" }, ["message"]), { message: "Hello", operationKey: "key" });
});

test("atelier text is not silently truncated and markup stays inert text", () => {
  assert.equal(atelierText({ message: "  <script>alert(1)</script>  " }, "message", 4000, 1), "<script>alert(1)</script>");
  for (const value of [" ", "a".repeat(4001), "hello\0world", { text: "hello" }]) {
    assert.throws(() => atelierText({ message: value }, "message", 4000, 1));
  }
});

test("atelier identifiers and versions fail closed for malformed inputs", () => {
  const id = "195eefeb-2317-4811-8a50-bb723aded1dc";
  assert.equal(atelierUuid({ id }, "id"), id);
  assert.equal(atelierUuid({ id: "" }, "id", true), null);
  assert.throws(() => atelierUuid({ id: "someone-else" }, "id"));
  assert.equal(atelierInteger({ version: "2" }, "version", 1), 2);
  for (const value of [0, -1, "1e2", " ", 1.5, Number.MAX_SAFE_INTEGER + 1, null]) {
    assert.throws(() => atelierInteger({ version: value }, "version", 1));
  }
  assert.equal(appointmentPurposeLabel("pickup"), "Collection / pickup");
});

test("atelier form source preserves its pre-hydration privacy guards", () => {
  // Static regression guard; the browser suite separately checks disabled-JS DOM.
  const source = readFileSync(new URL("../src/components/atelier/AtelierForm.tsx", import.meta.url), "utf8");
  assert.match(source, /\[ready, setReady\] = useState\(false\)/);
  assert.match(source, /<form[^>]+method="post"/);
  assert.match(source, /<fieldset disabled=\{!ready \|\| busy \|\| disabled\}/);
  assert.match(source, /if \(!ready \|\| inFlight\.current \|\| disabled\) return/);
});
