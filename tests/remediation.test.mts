import assert from "node:assert/strict";
import test from "node:test";
import { workflowOperation } from "../src/lib/workflow-operation.ts";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  canCreateWardrobeItem,
  isRequestEligibleForConversion,
  nextMeasurementVersionNumber,
  paymentIdempotencyKey,
} from "../src/lib/business-rules.ts";
import { minorToNaira, nairaToMinor, sumMinorUnits, parseNairaInput, formatMinor, MAX_MONEY_MINOR } from "../src/lib/payments/money.ts";
import { requestPosition, paymentPercent, type PaymentRequest, type PaymentSubmission, type VerifiedPayment } from "../src/lib/payments/manual.ts";
import { validateReceiptBytes, RECEIPT_MAX_BYTES } from "../src/lib/payments/receipt-validation.ts";
import { readStablePaymentSnapshot } from "../src/lib/payments/snapshot.ts";
import { calculateOrderPaymentPosition } from "../src/lib/payments/service.ts";
import {
  sanitizeInternalPath,
  isOwnedProfileAvatarReference,
  validateBespokeRequestPayload,
  validateContactEnquiry,
  validateMeasurementVersion,
  validateReferenceFile,
  validateStaffProfileUpdate,
} from "../src/lib/validation.ts";
import { STYLES } from "../src/data/styles.ts";
import { getStyleGallery, searchCatalogueStyles } from "../src/lib/catalogue.ts";
import { getPostAuthDestination, getRoleLabel } from "../src/lib/auth/roles.ts";
import {
  isOwnedCatalogueMediaPath,
  slugifyCatalogueValue,
  validateCategoryMutation,
  validateColourMutation,
  validateFitMutation,
} from "../src/lib/catalogue-admin.ts";
import {
  isOrderTransitionAllowed,
  isRequestTransitionAllowed,
  nextOrderStatus,
  normalizeRequestStatus,
  requestActionNeedsMessage,
} from "../src/lib/atelier-workflow.ts";

test("manual payment input uses exact minor units and rejects rounding/ambiguous amounts", () => {
  assert.equal(parseNairaInput("150000.01"), 15000001);
  assert.equal(parseNairaInput("0.29"), 29);
  assert.equal(parseNairaInput(" 100.1 "), 10010);
  assert.equal(parseNairaInput("9999999999.99"), MAX_MONEY_MINOR);
  for (const input of ["1.005", "-1", "1e5", "1,000", "NaN", "Infinity", ".50", "01.00", "", "10000000000", "0x10"]) assert.throws(() => parseNairaInput(input), input);
  assert.match(formatMinor(10001), /100\.01/);
  assert.equal(formatMinor(null), "Not agreed");
  assert.throws(() => formatMinor(-1));
  assert.throws(() => sumMinorUnits([Number.MAX_SAFE_INTEGER, 1]));
});

test("financial reads retry verification races instead of publishing mixed snapshots", async () => {
  let version = 1, reads = 0;
  const result = await readStablePaymentSnapshot(
    async () => [{ id: "order", lock_version: version }],
    async () => {
      reads++;
      if (reads === 1) { version++; return { verified: 0, submission: "verified" }; }
      return { verified: 10050, submission: "verified" };
    },
  );
  assert.equal(reads, 2);
  assert.deepEqual(result.data, { verified: 10050, submission: "verified" });
  assert.equal(result.orders[0].lock_version, 2);
});

test("financial reads detect new orders and fail closed during sustained changes", async () => {
  let calls = 0;
  const result = await readStablePaymentSnapshot(
    async () => ++calls === 1 ? [] : [{ id: "new-order", lock_version: 1 }],
    async orders => orders.length,
  );
  assert.equal(result.data, 1);
  let version = 0;
  await assert.rejects(readStablePaymentSnapshot(
    async () => [{ id: "order", lock_version: ++version }],
    async () => ({ verified: 0 }),
  ), /Financial records are changing/);
});

test("pending and rejected evidence never contribute to verified request funds", () => {
  const request = { id: "r1", requested_amount_minor: 20000000, status: "active" } as PaymentRequest;
  const pending = { request_id: "r1", reported_amount_minor: 20000000, status: "awaiting_verification" } as PaymentSubmission;
  assert.deepEqual(requestPosition(request, [], [pending]), { verified: 0, pending: 20000000, remaining: 20000000, status: "Awaiting verification" });
  const rejected = { ...pending, status: "rejected" } as PaymentSubmission;
  assert.equal(requestPosition(request, [], [rejected]).verified, 0);
  assert.equal(requestPosition(request, [], [rejected]).pending, 0);
  const payment = { payment_request_id: "r1", amount_minor: 15000000, status: "successful" } as VerifiedPayment;
  assert.deepEqual(requestPosition(request, [payment], [rejected]), { verified: 15000000, pending: 0, remaining: 5000000, status: "Partially satisfied" });
  assert.equal(requestPosition(request, [payment, { ...payment, amount_minor: 5000000 }], []).status, "Satisfied");
  assert.equal(requestPosition(request, [{ ...payment, status: "pending" }], []).verified, 0);
});

test("verified payment percentage cannot round an outstanding balance up to fully paid", () => {
  assert.equal(paymentPercent(40000000, 10000000), 25);
  assert.equal(paymentPercent(50000000, 50000000), 100);
  assert.equal(paymentPercent(MAX_MONEY_MINOR, MAX_MONEY_MINOR - 1), 99.99);
  assert.equal(paymentPercent(null, 0), 0);
});

test("receipt validation checks bytes, declared MIME, extension and bounded size", () => {
  const png = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
  const jpg = new Uint8Array([255,216,255,224,0,0,0,0,0,0,0,0]);
  const webp = new TextEncoder().encode("RIFF0000WEBPmore");
  const pdf = new TextEncoder().encode("%PDF-1.4\n%%EOF\n");
  assert.equal(validateReceiptBytes("receipt.PNG", "image/png", png), "png");
  assert.equal(validateReceiptBytes("receipt.jpeg", "image/jpeg", jpg), "jpeg");
  assert.equal(validateReceiptBytes("receipt.webp", "image/webp", webp), "webp");
  assert.equal(validateReceiptBytes("receipt.pdf", "application/pdf", pdf), "pdf");
  assert.throws(() => validateReceiptBytes("receipt.png", "image/png", pdf));
  assert.throws(() => validateReceiptBytes("receipt.pdf", "image/png", png));
  assert.throws(() => validateReceiptBytes("receipt.svg", "image/svg+xml", png));
  assert.throws(() => validateReceiptBytes("receipt.png.exe", "image/png", png));
  assert.throws(() => validateReceiptBytes("receipt.png", "image/png", png.slice(0, 4)));
  const huge = new Uint8Array(RECEIPT_MAX_BYTES + 1); huge.set(png);
  assert.throws(() => validateReceiptBytes("receipt.png", "image/png", huge));
});

test("workflow retries retain their key until the operation intent changes", () => {
  let keys = 0;
  const newKey = () => `operation-${++keys}`;
  const input = { requestId: "request", action: "approve", expectedVersion: 2 };
  const first = workflowOperation(null, input, newKey);
  assert.equal(workflowOperation(first, { ...input }, newKey), first);
  assert.equal(keys, 1);
  assert.notEqual(workflowOperation(first, { ...input, expectedVersion: 3 }, newKey).key, first.key);
  assert.notEqual(workflowOperation(first, { ...input, action: "decline" }, newKey).key, first.key);
});

test("catalogue contains four unique Fits per house category", () => {
  assert.equal(STYLES.length, 24);
  assert.equal(new Set(STYLES.map((style) => style.id)).size, 24);
  assert.equal(new Set(STYLES.map((style) => style.slug)).size, 24);
  assert.equal(new Set(STYLES.map((style) => style.code)).size, 24);

  for (const category of ["agbada", "senator", "kaftan", "traditional", "bespoke", "formal"] as const) {
    assert.equal(STYLES.filter((style) => style.category === category).length, 4);
  }
});

test("catalogue images are local and every Fit resolves a truthful gallery", () => {
  for (const style of STYLES) {
    const gallery = getStyleGallery(style);
    assert.ok(gallery.length >= 1, `${style.code} has no gallery`);
    for (const image of gallery) {
      assert.ok(image.src.startsWith("/images/"), `${style.code} has a remote image`);
      assert.ok(
        existsSync(join(process.cwd(), "public", image.src.replace(/^\/+/, ""))),
        `${style.code} image is missing: ${image.src}`
      );
      assert.ok(image.alt.length > 5, `${style.code} image needs useful alt text`);
    }
  }
});

test("new Fit fabrics and colours are searchable configuration data", () => {
  const garnet = STYLES.find((style) => style.id === "tsq-agbada-031");
  assert.ok(garnet);
  assert.ok((garnet.availableFabrics?.length ?? 0) >= 2);
  assert.ok(garnet.availableColours.length >= 2);
  assert.equal(searchCatalogueStyles(STYLES, "Silk-Wool Damask")[0]?.id, garnet.id);
});

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

test("request conversion requires ownership and current-revision approval, not payment", () => {
  assert.equal(isRequestEligibleForConversion({ status: "confirmed", customerId: "c1", approvedAt: "2026-09-29T12:00:00Z", revision: 2, approvedRevision: 2 }), true);
  assert.equal(isRequestEligibleForConversion({ status: "pricing_ready", customerId: "c1", approvedAt: "2026-09-29T12:00:00Z", revision: 2, approvedRevision: 2 }), false);
  assert.equal(isRequestEligibleForConversion({ status: "confirmed", customerId: null, approvedAt: "2026-09-29T12:00:00Z", revision: 2, approvedRevision: 2 }), false);
  assert.equal(isRequestEligibleForConversion({ status: "confirmed", customerId: "c1", approvedAt: null, revision: 2, approvedRevision: 2 }), false);
  assert.equal(isRequestEligibleForConversion({ status: "confirmed", customerId: "c1", approvedAt: "2026-09-29T12:00:00Z", revision: 3, approvedRevision: 2 }), false);
});

test("request and order lifecycle helpers reject skipped transitions", () => {
  assert.equal(normalizeRequestStatus("approved"), "confirmed");
  assert.equal(normalizeRequestStatus("changes_requested"), "needs_clarification");
  assert.equal(isRequestTransitionAllowed("submitted", "under_review"), true);
  assert.equal(isRequestTransitionAllowed("submitted", "confirmed"), false);
  assert.equal(isRequestTransitionAllowed("under_review", "needs_clarification"), true);
  assert.equal(isRequestTransitionAllowed("confirmed", "converted_to_order"), true);
  assert.equal(requestActionNeedsMessage("request_changes"), true);
  assert.equal(requestActionNeedsMessage("approve"), false);
  assert.equal(nextOrderStatus("order_confirmed"), "measurements_confirmed");
  assert.equal(isOrderTransitionAllowed("in_production", "finishing"), true);
  assert.equal(isOrderTransitionAllowed("order_confirmed", "ready"), false);
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

test("post-auth routing separates client, admin, CEO and inactive staff", () => {
  assert.equal(getPostAuthDestination("/account", "client", null), "/account");
  assert.equal(getPostAuthDestination("/admin/orders", "client", null), "/auth/access-denied");
  assert.equal(getPostAuthDestination("/account", "admin", "active"), "/admin");
  assert.equal(getPostAuthDestination("/admin/orders", "admin", "active"), "/admin/orders");
  assert.equal(getPostAuthDestination("/admin/staff", "ceo", "active"), "/admin/staff");
  assert.equal(getPostAuthDestination("/admin", "admin", "inactive"), "/auth/access-denied?reason=inactive");
  assert.equal(getRoleLabel("ceo"), "CEO / Super Admin");
});

test("staff profile validation allowlists personal fields and rejects authority injection", () => {
  assert.deepEqual(
    validateStaffProfileUpdate({
      firstName: "  Ada  ",
      lastName: "  Okafor ",
      phone: "+234 800 000 0000",
    }),
    {
      success: true,
      data: { firstName: "Ada", lastName: "Okafor", phone: "+234 800 000 0000" },
    }
  );
  assert.equal(
    validateStaffProfileUpdate({
      firstName: "Ada",
      lastName: "Okafor",
      phone: "+234 800 000 0000",
      role: "ceo",
    }).success,
    false
  );
  assert.equal(
    validateStaffProfileUpdate({
      firstName: "Ada",
      lastName: "Okafor",
      phone: "+234 800 000 0000",
      user_id: "00000000-0000-4000-8000-000000000000",
    }).success,
    false
  );
});

test("staff avatar references must stay inside the authenticated owner's folder", () => {
  const ownerId = "550e8400-e29b-41d4-a716-446655440000";
  const otherId = "123e4567-e89b-42d3-a456-426614174000";
  const reference = `${ownerId}/avatar-1727531234567-123e4567-e89b-42d3-a456-426614174000.webp`;

  assert.equal(isOwnedProfileAvatarReference(reference, ownerId), true);
  assert.equal(isOwnedProfileAvatarReference(reference, otherId), false);
  assert.equal(isOwnedProfileAvatarReference(`https://example.com/avatar.webp`, ownerId), false);
});

test("shared validation rejects malformed domain inputs", () => {
  assert.equal(validateContactEnquiry({ name: "A", email: "bad", subject: "x", message: "short" }).success, false);
  assert.equal(validateMeasurementVersion({ measurements: { chest: -2 }, unit: "cm" }).success, false);
  assert.equal(validateReferenceFile({ type: "image/svg+xml", size: 100 }).success, false);
  assert.equal(validateReferenceFile({ type: "image/png", size: 1024 }).success, true);
});

test("bespoke validation accepts a complete request and rejects non-durable references", () => {
  const payload = {
    submissionKey: "550e8400-e29b-41d4-a716-446655440000",
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

test("catalogue media references stay inside the intended Fit folder", () => {
  const fitId = "fit-550e8400-e29b-41d4-a716-446655440000";
  const objectId = "123e4567-e89b-42d3-a456-426614174000";
  assert.equal(isOwnedCatalogueMediaPath(`${fitId}/${objectId}.webp`, fitId), true);
  assert.equal(isOwnedCatalogueMediaPath(`fit-other/${objectId}.webp`, fitId), false);
  assert.equal(isOwnedCatalogueMediaPath(`${fitId}/../${objectId}.webp`, fitId), false);
  assert.equal(isOwnedCatalogueMediaPath(`https://example.com/${objectId}.webp`, fitId), false);
});

test("catalogue validators normalize inputs and reject authority injection", () => {
  const validFit = {
    name: "  Midnight Governor  ", code: " tcc 301 ", categorySlug: "senator",
    description: "A precise formal Fit.", longDescription: "", fabricInformation: "Mid-weight wool.",
    fitInformation: "Tailored through the shoulder.", occasions: ["Office", "Office"], featured: false,
    collectionName: "Civic Atelier", tags: ["Formal"], leadTimeWeeks: 4,
    craftsmanshipHighlights: ["Hand-finished"], displayOrder: 3, status: "draft",
    fabricIds: ["fab-wool"], colourIds: ["clr-black"],
  };
  const result = validateFitMutation(validFit);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.name, "Midnight Governor");
    assert.equal(result.data.code, "TCC 301");
    assert.deepEqual(result.data.occasions, ["Office"]);
  }
  assert.equal(validateFitMutation({ ...validFit, uploadedBy: "someone-else" }).success, false);
  assert.equal(validateColourMutation({ name: "Onyx", hex: "#0a0b0c", isActive: true }).success, true);
  assert.equal(validateColourMutation({ name: "Onyx", hex: "black", isActive: true }).success, false);
});

test("catalogue category validation permits only safe image references", () => {
  const base = { name: "Evening", tagline: "After-dark tailoring", description: "Formal evening Fits.", heroImage: "/images/editorial/hero-editorial.jpg", featuredQuote: "Made for arrival.", characteristics: ["Structured"], displayOrder: 7, isActive: true };
  assert.equal(validateCategoryMutation(base).success, true);
  assert.equal(validateCategoryMutation({ ...base, heroImage: "javascript:alert(1)" }).success, false);
  assert.equal(slugifyCatalogueValue(" Àṣẹ Evening / Edit "), "ase-evening-edit");
});
