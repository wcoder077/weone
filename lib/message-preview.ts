import { ATTACHMENT_LABELS, type AttachmentKind } from "@/lib/attachments";
import type { TFunction } from "@/lib/i18n/core";

// One-line text for a message in the chat list and in reply quotes.
export function messagePreview(
  m: {
  body: string;
  kind: string;
  attachment_type?: string | null;
  image_path?: string | null;
  },
  t: TFunction,
) {
  if (m.kind === "project_invite") return t("Loyihaga taklif");
  if (m.body.trim()) return m.body;
  if (m.attachment_type) return t(ATTACHMENT_LABELS[m.attachment_type as AttachmentKind] ?? "Fayl");
  if (m.image_path) return t("Rasm");
  return t("Xabar");
}
