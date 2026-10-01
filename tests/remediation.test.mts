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
import { minorToNaira, nairaToMinor, sumMinorUnits } from "../src/lib/payments/money.ts";
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
