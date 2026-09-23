import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatOfficeLocation(location: string): string {
  // Older saved appointments may still contain the previous office label.
  return /^(?:atelier abeokuta|abeokuta atelier)(?:,.*)?$/i.test(location.trim())
    ? "TCC office"
    : location;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
