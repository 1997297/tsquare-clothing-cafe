export const RECEIPT_MAX_BYTES = 3 * 1024 * 1024;
export const RECEIPT_MIME_EXTENSIONS: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"], "image/png": ["png"], "image/webp": ["webp"], "application/pdf": ["pdf"],
};
export function validateReceiptBytes(name: string, mime: string, bytes: Uint8Array): string {
  if (bytes.length < 12 || bytes.length > RECEIPT_MAX_BYTES) throw new Error("Receipt must be a valid file no larger than 3 MB.");
  const extension = name.toLowerCase().split(".").pop() ?? "";
  if (!RECEIPT_MIME_EXTENSIONS[mime]?.includes(extension)) throw new Error("Use a JPEG, PNG, WebP or PDF receipt with its correct extension.");
  const starts = (values: number[]) => values.every((v, i) => bytes[i] === v);
  const text = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  const valid = mime === "image/jpeg" ? starts([255, 216, 255])
    : mime === "image/png" ? starts([137, 80, 78, 71, 13, 10, 26, 10])
      : mime === "image/webp" ? text(0, 4) === "RIFF" && text(8, 12) === "WEBP"
        : mime === "application/pdf" && text(0, 5) === "%PDF-";
  if (!valid) throw new Error("The receipt contents do not match the selected file format.");
  return extension;
}
