import { z } from "zod";
import { LANG_LOCALES, type Lang } from "@/lib/i18n/core";
import { graphemeLength } from "@/lib/text";

// What the team space block shows. The block only receives this through props, so the backend
// (today Supabase) can change without touching the components.
export type TeamSpace = {
  chatUrl: string | null;
  pinnedNotice: string | null;
  pinnedNoticeUpdatedAt: string | null; // ISO
  nextMeetingAt: string | null; // ISO
  meetingUrl: string | null;
};

export type ViewerRole = "guest" | "member" | "founder";

export type TeamSpaceProps = {
  space: TeamSpace | null; // null for people who are not members
  viewerRole: ViewerRole;
  onSave?: (patch: Partial<TeamSpace>) => Promise<void>;
};

// ---------------------------------------------------------------------------
// Chat link
// ---------------------------------------------------------------------------

export type ChatProvider = "telegram" | "discord" | "other";

export function getChatProvider(url: string): ChatProvider {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    if (host === "t.me" || host === "telegram.me" || host === "telegram.dog") return "telegram";
    if (host === "discord.gg" || host === "discord.com" || host === "discordapp.com") return "discord";
  } catch {
    // Not a URL: treated as an unknown provider.
  }
  return "other";
}

// ---------------------------------------------------------------------------
// Validation (used by the form in the browser and again on the server)
// ---------------------------------------------------------------------------

export const NOTICE_MAX = 280;

const HTTPS_ERROR = "https:// bilan boshlanuvchi havola kiriting";
const TELEGRAM_ERROR = "https://t.me/ yoki https://telegram.me/ bilan boshlanuvchi havola kiriting";

const emptyIfNull = (value: unknown) => (value == null ? "" : value);

// Only https:// links; javascript:, http:, data: and the like are refused.
const httpsUrl = z
  .string()
  .trim()
  .max(300, "Havola juda uzun")
  .refine((value) => value === "" || (/^https:\/\/\S+$/.test(value) && z.url().safeParse(value).success), HTTPS_ERROR)
  .transform((value) => value || null);

export const optionalHttpsUrl = z.preprocess(emptyIfNull, httpsUrl);

// The project form's "Telegram guruh linki": the same value as the team space chat link.
export const optionalTelegramUrl = z.preprocess(
  emptyIfNull,
  z
    .string()
    .trim()
    .max(300, "Havola juda uzun")
    .refine(
      (value) => value === "" || (/^https:\/\/(t\.me|telegram\.me)\/\S+$/i.test(value) && z.url().safeParse(value).success),
      TELEGRAM_ERROR,
    )
    .transform((value) => value || null),
);

const optionalNotice = z.preprocess(
  emptyIfNull,
  z
    .string()
    .trim()
    .refine((value) => graphemeLength(value) <= NOTICE_MAX, `Ko'pi bilan ${NOTICE_MAX} ta belgi`)
    .transform((value) => value || null),
);

const optionalDateTime = z.preprocess(
  emptyIfNull,
  z
    .union([z.literal(""), z.iso.datetime({ offset: true })], { error: "Sana va vaqtni to'g'ri kiriting" })
    .transform((value) => value || null),
);

// A missing key leaves the field as it is; an empty value clears it.
export const teamSpacePatchSchema = z.object({
  chatUrl: optionalHttpsUrl.optional(),
  pinnedNotice: optionalNotice.optional(),
  nextMeetingAt: optionalDateTime.optional(),
  meetingUrl: optionalHttpsUrl.optional(),
});

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export function isUpcoming(iso: string) {
  return new Date(iso).getTime() > Date.now();
}

const UZ_WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const DAY_MS = 24 * 60 * 60 * 1000;

// "Juma, 20:00" in the viewer's own time zone; a date is added when it is more than a week away.
export function formatMeetingTime(iso: string, lang: Lang, now = Date.now()) {
  const date = new Date(iso);
  const far = date.getTime() - now > 6 * DAY_MS;

  if (lang === "uz") {
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    const day = far ? `${date.getDate()}-${UZ_MONTHS[date.getMonth()]}, ` : "";
    return `${day}${UZ_WEEKDAYS[date.getDay()]}, ${time}`;
  }
  return new Intl.DateTimeFormat(LANG_LOCALES[lang], {
    ...(far ? { day: "numeric", month: "long" } : {}),
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

// <input type="datetime-local"> works in local time without a zone.
export function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalInput(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "invalid" : date.toISOString();
}
