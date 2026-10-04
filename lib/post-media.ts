import { ATTACHMENT_MAX_BYTES, ATTACHMENT_TYPES, attachmentKindOf, extensionOf, formatBytes } from "@/lib/attachments";

// One video, or up to 10 photos, per post (the first photo/video is the cover). Same size limit and types as chat photos/videos
// (see lib/attachments.ts); the `post-media` bucket enforces the limit in the database.
export const POST_MEDIA_BUCKET = "post-media";
// Videos are not compressed in the browser, so they get a tighter limit than photos.
export const POST_VIDEO_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const POST_MEDIA_ACCEPT = [...ATTACHMENT_TYPES.image, ...ATTACHMENT_TYPES.video].join(",");

// Photos in one post (a carousel). A video always stands alone.
export const POST_MAX_PHOTOS = 10;

export type PostMediaKind = "image" | "video";

export function postMediaKindOf(mime: string): PostMediaKind | null {
  const kind = attachmentKindOf(mime);
  return kind === "image" || kind === "video" ? kind : null;
}

export function postMediaProblem(file: File): string | null {
  const kind = postMediaKindOf(file.type);
  if (!kind) return "Faqat rasm yoki video yuborish mumkin";
  if (kind === "video" && file.size > POST_VIDEO_MAX_BYTES) return `Video ${formatBytes(POST_VIDEO_MAX_BYTES)} dan kichik bo'lsin`;
  if (file.size > ATTACHMENT_MAX_BYTES) return `Fayl ${formatBytes(ATTACHMENT_MAX_BYTES)} dan kichik bo'lsin`;
  return null;
}

// <author id>/<uuid>.<ext> (the database checks this exact shape).
export function postMediaPath(userId: string, mime: string) {
  return `${userId}/${crypto.randomUUID()}.${extensionOf(mime)}`;
}
