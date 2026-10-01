// Client-side image preparation: validate, then downscale + re-encode as WebP
// before upload. Storage buckets enforce the same type/size limits server-side.

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export function imageProblem(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Faqat JPG, PNG yoki WEBP rasm";
  if (file.size > IMAGE_MAX_BYTES) return "Rasm 5 MB dan kichik bo'lsin";
  return null;
}

export type PreparedImage = { blob: Blob; width: number; height: number };

// Fits the image inside maxWidth × maxHeight (never upscales).
export async function compressImage(file: File, maxWidth: number, maxHeight: number, quality = 0.85): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (!blob) throw new Error("Rasmni tayyorlab bo'lmadi");
  return { blob, width, height };
}
