import assert from "node:assert/strict";
import test from "node:test";
import {
  canCreateWardrobeItem,
  isRequestEligibleForConversion,
  nextMeasurementVersionNumber,
  paymentIdempotencyKey,
} from "../src/lib/business-rules.ts";
import { minorToNaira, nairaToMinor, sumMinorUnits } from "../src/lib/payments/money.ts";
import { calculateOrderPaymentPosition } from "../src/lib/payments/service.ts";
import {
  sanitizeInternalPath,
  validateBespokeRequestPayload,
  validateContactEnquiry,
  validateMeasurementVersion,
  validateReferenceFile,
} from "../src/lib/validation.ts";

test("money uses deliberate integer minor-unit conversions", () => {
  assert.equal(nairaToMinor(1250.5), 125050);
  assert.equal(minorToNaira(125050), 1250.5);
  assert.equal(sumMinorUnits([100, 250, 650]), 1000);
  assert.throws(() => sumMinorUnits([10.5]));
});

test("financial position counts only verified successful payments", () => {
  const position = calculateOrderPaymentPosition(100_000, [
    { status: "successful", amount: 25_000 },
    { status: "pending", amount: 50_000 },
    { status: "failed", amount: 25_000 },
  ] as never);
  assert.equal(position.amountPaid, 25_000);
  assert.equal(position.outstandingBalance, 75_000);
  assert.equal(position.paymentStatus, "partially_paid");
});

test("request conversion requires ownership, eligible state and trusted quote", () => {
  assert.equal(isRequestEligibleForConversion({ status: "pricing_ready", customerId: "c1", quotedPriceMinor: 1 }), true);
  assert.equal(isRequestEligibleForConversion({ status: "submitted", customerId: "c1", quotedPriceMinor: 1 }), false);
  assert.equal(isRequestEligibleForConversion({ status: "pricing_ready", customerId: null, quotedPriceMinor: 1 }), false);
  assert.equal(isRequestEligibleForConversion({ status: "pricing_ready", customerId: "c1", quotedPriceMinor: 0 }), false);
});

test("measurement versions always advance beyond preserved history", () => {
  assert.equal(nextMeasurementVersionNumber([]), 1);
  assert.equal(nextMeasurementVersionNumber([3, 1, 2]), 4);
  assert.equal(nextMeasurementVersionNumber([0, -1, 2]), 3);
});

test("wardrobe eligibility prevents duplicates and incomplete orders", () => {
  assert.equal(canCreateWardrobeItem({ id: "o1", status: "completed" }, []), true);
  assert.equal(canCreateWardrobeItem({ id: "o1", status: "completed" }, ["o1"]), false);
  assert.equal(canCreateWardrobeItem({ id: "o2", status: "ready" }, []), false);
});

test("payment idempotency identity is normalized", () => {
  assert.equal(paymentIdempotencyKey(" Paystack ", " ref-123 "), "paystack:ref-123");
});

test("redirect sanitizer rejects external and protocol-relative targets", () => {
  assert.equal(sanitizeInternalPath("/account/orders?tab=open"), "/account/orders?tab=open");
  assert.equal(sanitizeInternalPath("//evil.example/path"), "/account");
  assert.equal(sanitizeInternalPath("https://evil.example"), "/account");
  assert.equal(sanitizeInternalPath("/\\evil.example"), "/account");
});

test("shared validation rejects malformed domain inputs", () => {
  assert.equal(validateContactEnquiry({ name: "A", email: "bad", subject: "x", message: "short" }).success, false);
  assert.equal(validateMeasurementVersion({ measurements: { chest: -2 }, unit: "cm" }).success, false);
  assert.equal(validateReferenceFile({ type: "image/svg+xml", size: 100 }).success, false);
  assert.equal(validateReferenceFile({ type: "image/png", size: 1024 }).success, true);
});

test("bespoke validation accepts a complete request and rejects non-durable references", () => {
  const payload = {
    requestId: "TCC-LOCAL-1",
    status: "submitted",
    createdAt: new Date().toISOString(),
    styleId: "tsq-agbada-024",
    styleCode: "TSQ AGBADA 024",
    styleName: "Imperial Grand Agbada",
    garmentCategory: "agbada",
    isIdeaPath: false,
    fabric: {
      id: "premium-wool-blend",
      name: "Premium Wool Blend",
      description: "A structured mid-weight fabric.",
      categories: ["agbada"],
    },
    colour: { id: "midnight", name: "Midnight", hex: "#111111" },
    preferences: { referenceImages: [] },
    fitPreference: "tailored",
    measurementMethod: "manual",
    measurementUnit: "cm",
    measurements: { chest: 102 },
    measurementConfidence: false,
    occasion: "wedding",
    requiredDate: "2099-12-31",
    contact: {
      firstName: "Adewale",
      lastName: "Okonkwo",
      email: "adewale@example.com",
      phone: "+234 800 000 0000",
      preferredContact: "whatsapp",
    },
  };

  assert.equal(validateBespokeRequestPayload(payload).success, true);
  assert.equal(validateBespokeRequestPayload({
    ...payload,
    preferences: {
      referenceImages: [{
        id: "550e8400-e29b-41d4-a716-446655440000",
        filename: "reference.png",
        mimeType: "image/png",
        sizeBytes: 1024,
      }],
    },
  }).success, false);
});
