export const NGN_CURRENCY = "NGN" as const;

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
    return total + value;
  }, 0);
}
