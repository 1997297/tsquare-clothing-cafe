export function isRequestEligibleForConversion(request: {
  status: string;
  customerId?: string | null;
  approvedAt?: string | null;
  revision?: number | null;
  approvedRevision?: number | null;
}): boolean {
  return Boolean(
    request.customerId &&
    request.status === "confirmed" &&
    request.approvedAt &&
    request.revision === request.approvedRevision
  );
}

export function isOrderEligibleForWardrobe(order: { status: string }): boolean {
  return order.status === "completed";
}

export function nextMeasurementVersionNumber(versions: number[]): number {
  const validVersions = versions.filter((version) => Number.isSafeInteger(version) && version > 0);
  return (validVersions.length > 0 ? Math.max(...validVersions) : 0) + 1;
}

export function canCreateWardrobeItem(
  order: { id: string; status: string },
  existingOrderIds: readonly string[]
): boolean {
  return isOrderEligibleForWardrobe(order) && !existingOrderIds.includes(order.id);
}

export function paymentIdempotencyKey(provider: string, providerReference: string): string {
  return `${provider.trim().toLowerCase()}:${providerReference.trim()}`;
}
