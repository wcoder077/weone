import { ATTACHMENT_LABELS, type AttachmentKind } from "@/lib/attachments";

// One-line text for a message in the chat list and in reply quotes.
export function messagePreview(m: {
  body: string;
  kind: string;
  attachment_type?: string | null;
  image_path?: string | null;
}) {
  if (m.kind === "project_invite") return "Loyihaga taklif";
  if (m.body.trim()) return m.body;
  if (m.attachment_type) return ATTACHMENT_LABELS[m.attachment_type as AttachmentKind] ?? "Fayl";
  if (m.image_path) return "Rasm";
  return "Xabar";
}
