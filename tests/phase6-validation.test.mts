import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { atelierCountsResponse } from "../src/lib/atelier-counts-response.ts";
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

test("atelier counts retain authenticated output and private no-store caching", async () => {
  const counts = { pending_appointments: 2, unread_concierge_messages: 1 };
  const response = await atelierCountsResponse(async () => counts);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.deepEqual(await response.json(), counts);
});

test("atelier counts distinguish missing authentication and denied staff access", async () => {
  for (const [reason, status, message] of [
    ["AUTH_REQUIRED", 401, "Authentication required"],
    ["STAFF_ACCESS_DENIED", 403, "Access denied"],
  ] as const) {
    const response = await atelierCountsResponse(async () => { throw new Error(reason); });
    assert.equal(response.status, status);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.deepEqual(await response.json(), { error: message });
  }
});

test("atelier count outages stay unavailable without disclosing backend details", async () => {
  for (const error of [new Error("STAFF_AUTHORIZATION_UNAVAILABLE"), new Error("private backend detail"), "unexpected failure"]) {
    const response = await atelierCountsResponse(async () => { throw error; });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.deepEqual(await response.json(), { error: "Atelier counts unavailable" });
  }
});
