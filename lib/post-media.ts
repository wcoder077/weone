import { ATTACHMENT_MAX_BYTES, ATTACHMENT_TYPES, attachmentKindOf, extensionOf, formatBytes } from "@/lib/attachments";

// One photo or video per post. Same size limit and types as chat photos/videos
// (see lib/attachments.ts); the `post-media` bucket enforces the limit in the database.
export const POST_MEDIA_BUCKET = "post-media";
// Media files never change (each upload gets a new path), so browsers may keep them a year.
export const IMMUTABLE_CACHE = "31536000";
export const POST_MEDIA_ACCEPT = [...ATTACHMENT_TYPES.image, ...ATTACHMENT_TYPES.video].join(",");

export type PostMediaKind = "image" | "video";

export function postMediaKindOf(mime: string): PostMediaKind | null {
  const kind = attachmentKindOf(mime);
  return kind === "image" || kind === "video" ? kind : null;
}

export function postMediaProblem(file: File): string | null {
  if (!postMediaKindOf(file.type)) return "Faqat rasm yoki video yuborish mumkin";
  if (file.size > ATTACHMENT_MAX_BYTES) return `Fayl ${formatBytes(ATTACHMENT_MAX_BYTES)} dan kichik bo'lsin`;
  return null;
}

// <author id>/<uuid>.<ext> (the database checks this exact shape).
export function postMediaPath(userId: string, mime: string) {
  return `${userId}/${crypto.randomUUID()}.${extensionOf(mime)}`;
}
