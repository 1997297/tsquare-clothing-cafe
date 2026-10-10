export const CATALOGUE_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const CATALOGUE_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
};

export function validateCatalogueImage(file: { type: string; size: number }) {
  if (!CATALOGUE_IMAGE_EXTENSIONS[file.type] || file.size < 12 || file.size > CATALOGUE_IMAGE_MAX_BYTES) {
    throw new Error("Choose JPEG, PNG or WebP photographs between 12 bytes and 8 MB each.");
  }
}

export function validateCatalogueImageBytes(mime: string, bytes: Uint8Array) {
  validateCatalogueImage({ type: mime, size: bytes.length });
  const start = (values: number[]) => values.every((value, index) => bytes[index] === value);
  const text = (a: number, b: number) => String.fromCharCode(...bytes.slice(a, b));
  const valid = mime === "image/jpeg" ? start([255, 216, 255])
    : mime === "image/png" ? start([137, 80, 78, 71, 13, 10, 26, 10])
      : text(0, 4) === "RIFF" && text(8, 12) === "WEBP";
  if (!valid) throw new Error("The photograph contents do not match its image format.");
}
