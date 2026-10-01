import { z } from "zod";
import { LOOKING_FOR_VALUES, ONBOARDING_SKILLS, SKILL_LEVEL_VALUES } from "@/lib/constants";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,30}$/, "3–30 ta belgi: kichik lotin harflari, raqamlar va _");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Ko'pi bilan ${max} ta belgi`)
    .transform((v) => v || null);

export const aboutSchema = z.object({
  full_name: z.string().trim().min(2, "Ismingizni kiriting").max(80, "Juda uzun"),
  username: usernameSchema,
  city: optionalText(60),
  headline: optionalText(120),
  avatar_url: z.union([z.literal(""), z.url()]).transform((v) => v || null),
});

export const skillPickSchema = z
  .array(z.object({ skill_id: z.uuid(), level: z.enum(SKILL_LEVEL_VALUES) }))
  .min(ONBOARDING_SKILLS.min, `Kamida ${ONBOARDING_SKILLS.min} ta ko'nikma tanlang`)
  .max(ONBOARDING_SKILLS.max, `Ko'pi bilan ${ONBOARDING_SKILLS.max} ta ko'nikma`)
  .refine((items) => new Set(items.map((i) => i.skill_id)).size === items.length, "Takroriy ko'nikma");

export const lookingForSchema = z.object({
  looking_for: z.array(z.enum(LOOKING_FOR_VALUES)).min(1, "Kamida bittasini tanlang"),
  is_online_ok: z.boolean(),
});
