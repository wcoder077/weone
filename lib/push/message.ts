import { z } from "zod";
import { translate, type Lang } from "@/lib/i18n/core";
import { dictionaries } from "@/lib/i18n/dictionaries";

const path = z.string().regex(/^\/[A-Za-z0-9\-_/]*$/).max(200);
const label = z.string().max(200);

export const NOTIFICATION_TYPES = [
  "connection_request",
  "connection_accepted",
  "collab_request",
  "collab_accepted",
  "join_request",
  "join_accepted",
  "join_declined",
  "project_invite",
  "new_project_member",
  "journey_confirmed",
] as const;

// What the database trigger sends (raw facts; the text is written here, in the device's language).
export const pushEventSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("message"),
    actor: label,
    text: label,
    attachment: z.enum(["image", "video", "file"]).nullable().optional(),
    url: path,
    tag: label,
  }),
  z.object({ kind: z.literal("notification"), type: z.enum(NOTIFICATION_TYPES), actor: label, url: path, tag: label }),
  z.object({ kind: z.literal("test"), url: path, tag: label }),
]);
export type PushEvent = z.infer<typeof pushEventSchema>;

export type PushMessage = { title: string; body: string; url: string; tag: string };

export function buildPushMessage(event: PushEvent, lang: Lang): PushMessage {
  const dict = dictionaries[lang];
  const t = (text: string, vars?: Record<string, string>) => translate(lang, dict, text, vars);
  const base = { url: event.url, tag: event.tag };

  if (event.kind === "message") {
    const attachmentLabel =
      event.attachment === "image" ? t("Rasm") : event.attachment === "video" ? t("Video") : event.attachment ? t("Fayl") : t("Xabar");
    return { ...base, title: event.actor || "we1", body: event.text.trim() || attachmentLabel };
  }

  if (event.kind === "test") {
    return { ...base, title: t("Sinov bildirishnomasi"), body: t("Hammasi ishlayapti. Xabarlar shu yerga keladi.") };
  }

  const actor = event.actor || t("Kimdir");
  const body = {
    connection_request: t("{actor} siz bilan bog'lanmoqchi", { actor }),
    connection_accepted: t("{actor} bog'lanish so'rovingizni qabul qildi", { actor }),
    collab_request: t("{actor} hamkorlik taklif qildi", { actor }),
    collab_accepted: t("{actor} hamkorlik taklifingizni qabul qildi", { actor }),
    join_request: t("{actor} loyihangizga qo'shilmoqchi", { actor }),
    join_accepted: t("So'rovingiz qabul qilindi"),
    join_declined: t("So'rovingiz rad etildi"),
    project_invite: t("{actor} sizni loyihaga taklif qildi", { actor }),
    new_project_member: t("{actor} jamoangizga qo'shildi", { actor }),
    journey_confirmed: t("{actor} ishtirokingizni tasdiqladi", { actor }),
  }[event.type];
  return { ...base, title: "we1", body };
}
