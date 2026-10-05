export const NGN_CURRENCY = "NGN" as const;
export const MAX_MONEY_MINOR = 999_999_999_999;

// Parse decimal user input directly. Never round a floating-point amount into a
// financial command ("1.005" must be rejected, not silently rounded).
export function parseNairaInput(value: string): number {
  const input = value.trim();
  if (!/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(input)) {
    throw new Error("Enter a Naira amount with no commas and at most two decimal places.");
  }
  const [whole, fraction = ""] = input.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(minor) || minor > MAX_MONEY_MINOR) throw new Error("Amount is too large.");
  return minor;
}

export function formatMinor(minor: number | null | undefined): string {
  if (minor == null) return "Not agreed";
  if (!Number.isSafeInteger(minor) || minor < 0) throw new Error("Invalid financial amount");
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(minor / 100);
}

export function nairaToMinor(naira: number): number {
  if (!Number.isFinite(naira) || naira < 0) throw new Error("Invalid NGN amount");
  return Math.round((naira + Number.EPSILON) * 100);
}

export function minorToNaira(minor: number): number {
  if (!Number.isSafeInteger(minor) || minor < 0) throw new Error("Invalid NGN minor-unit amount");
  return minor / 100;
}

export function sumMinorUnits(values: number[]): number {
  return values.reduce((total, value) => {
    if (!Number.isSafeInteger(value)) throw new Error("Money values must use integer minor units");
    const next = total + value;
    if (!Number.isSafeInteger(next)) throw new Error("Money total exceeds safe integer range");
    return next;
  }, 0);
}
