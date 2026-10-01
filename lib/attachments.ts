// Chat attachment rules in one place. To change the limits later, edit the values here
// AND update the bucket (see the comment at the top of
// supabase/migrations/20261001000018_message_attachments.sql): the bucket is the real
// enforcement, this file gives the user a friendly message before uploading.

export const ATTACHMENT_BUCKET = "message-attachments";
export const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export const ATTACHMENT_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  file: [
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/zip",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
} as const;

export type AttachmentKind = keyof typeof ATTACHMENT_TYPES;
export const ATTACHMENT_KINDS = Object.keys(ATTACHMENT_TYPES) as [AttachmentKind, ...AttachmentKind[]];

export const ATTACHMENT_LABELS: Record<AttachmentKind, string> = { image: "Rasm", video: "Video", file: "Fayl" };

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/zip": "zip",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

export function attachmentKindOf(mime: string): AttachmentKind | null {
  for (const kind of ATTACHMENT_KINDS) {
    if ((ATTACHMENT_TYPES[kind] as readonly string[]).includes(mime)) return kind;
  }
  return null;
}

// Value for <input accept>: "image" -> "image/jpeg,image/png,..."
export function acceptFor(kind: AttachmentKind) {
  return ATTACHMENT_TYPES[kind].join(",");
}

export function attachmentProblem(file: File): string | null {
  if (!attachmentKindOf(file.type)) return "Bu turdagi faylni yuborib bo'lmaydi";
  if (file.size > ATTACHMENT_MAX_BYTES) return `Fayl ${formatBytes(ATTACHMENT_MAX_BYTES)} dan kichik bo'lsin`;
  return null;
}

// <sender id>/<conversation id>/<uuid>.<ext> (the database checks this exact shape).
export function attachmentPath(userId: string, conversationId: string, mime: string) {
  return `${userId}/${conversationId}/${crypto.randomUUID()}.${EXTENSIONS[mime]}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}
