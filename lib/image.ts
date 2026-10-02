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

// Upload sizes: photos in chats and posts, avatars and project logos (shown small).
export const PHOTO_MAX_SIDE = 1600;
export const AVATAR_MAX_SIDE = 512;

// Shrinks a photo before upload: fits it inside maxSide × maxSide and re-encodes it as WebP
// (quality 0.82 keeps photos sharp at a fraction of the size, typically 5 MB → 200–400 KB).
// GIFs keep their animation and are returned as they are; so is anything the browser can't
// decode, or a file the re-encode wouldn't make smaller.
export async function shrinkImage(file: File, maxSide: number, quality = 0.82): Promise<File> {
  if (file.type === "image/gif" || !file.type.startsWith("image/")) return file;
  try {
    const { blob } = await compressImage(file, maxSide, maxSide, quality);
    if (blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "rasm"}.webp`, { type: "image/webp" });
  } catch {
    return file;
  }
}
