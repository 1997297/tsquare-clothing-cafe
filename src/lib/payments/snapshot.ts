interface VersionedOrder { id: string; lock_version: number }

// Every Phase 5 write advances orders.lock_version in the same transaction.
// Fence all reads, including the summary RPC, so a response cannot mix states
// from either side of a verification/cancellation/price change.
export async function readStablePaymentSnapshot<O extends VersionedOrder, T>(
  readOrders: () => Promise<O[]>,
  readFinancials: (orders: O[]) => Promise<T>,
): Promise<{ orders: O[]; data: T }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = await readOrders();
    const data = await readFinancials(before);
    const after = await readOrders();
    const versions = new Map(after.map(order => [order.id, order.lock_version]));
    if (before.length === after.length && before.every(order => versions.get(order.id) === order.lock_version)) {
      return { orders: before, data };
    }
  }
  throw new Error("Financial records are changing. Please refresh before transferring.");
}
