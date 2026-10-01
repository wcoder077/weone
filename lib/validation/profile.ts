import { z } from "zod";
import {
  JOURNEY_TYPE_VALUES,
  LOOKING_FOR_VALUES,
  ONBOARDING_SKILLS,
  SKILL_LEVEL_VALUES,
} from "@/lib/constants";

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
  .array(z.object({ skill_id: z.guid(), level: z.enum(SKILL_LEVEL_VALUES) }))
  .min(ONBOARDING_SKILLS.min, `Kamida ${ONBOARDING_SKILLS.min} ta ko'nikma tanlang`)
  .max(ONBOARDING_SKILLS.max, `Ko'pi bilan ${ONBOARDING_SKILLS.max} ta ko'nikma`)
  .refine((items) => new Set(items.map((i) => i.skill_id)).size === items.length, "Takroriy ko'nikma");

export const lookingForSchema = z.object({
  looking_for: z.array(z.enum(LOOKING_FOR_VALUES)).min(1, "Kamida bittasini tanlang"),
  is_online_ok: z.boolean(),
});

// "2026-03" from <input type="month"> -> "2026-03-01"; empty -> null.
const monthToDate = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-(0[1-9]|1[0-2])$/.test(v), "Sanani to'g'ri kiriting")
  .transform((v) => (v ? `${v}-01` : null));

const optionalYear = z
  .string()
  .trim()
  .refine((v) => v === "" || /^(19[5-9]\d|20\d\d|2100)$/.test(v), "Yilni to'g'ri kiriting")
  .transform((v) => (v ? Number(v) : null));

const uuidList = z.array(z.guid()).max(30);

export const journeySchema = z
  .object({
    id: z.union([z.literal(""), z.guid()]).transform((v) => v || null),
    type: z.enum(JOURNEY_TYPE_VALUES, "Turini tanlang"),
    title: z.string().trim().min(1, "Nomini kiriting").max(120, "Juda uzun"),
    organization: optionalText(120),
    role: optionalText(80),
    result: optionalText(80),
    description: optionalText(1000),
    start_date: monthToDate,
    end_date: monthToDate,
    skill_ids: uuidList,
  })
  .refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, {
    message: "Tugash sanasi boshlanishidan oldin bo'lmasin",
    path: ["end_date"],
  });

export const educationSchema = z
  .object({
    institution: z.string().trim().min(1, "Muassasa nomini kiriting").max(120, "Juda uzun"),
    degree: optionalText(80),
    field: optionalText(80),
    start_year: optionalYear,
    end_year: optionalYear,
  })
  .refine((v) => !v.start_year || !v.end_year || v.end_year >= v.start_year, {
    message: "Tugash yili boshlanishidan oldin bo'lmasin",
    path: ["end_year"],
  });

export const addSkillSchema = z
  .object({
    skill_id: z.union([z.literal(""), z.guid()]).transform((v) => v || null),
    new_skill_name: z.string().trim().max(40, "Juda uzun"),
    level: z.enum(SKILL_LEVEL_VALUES),
    project_ids: uuidList,
    journey_ids: uuidList,
  })
  .refine((v) => v.skill_id || v.new_skill_name.length > 0, {
    message: "Ko'nikmani tanlang",
    path: ["skill_id"],
  });

const tagList = z
  .array(z.string().trim().min(1).max(40))
  .max(15, "Ko'pi bilan 15 ta")
  .transform((list) => [...new Set(list)]);

export const settingsSchema = aboutSchema.extend({
  bio: optionalText(1000),
  languages: tagList,
  interests: tagList,
  looking_for: z.array(z.enum(LOOKING_FOR_VALUES)),
  is_online_ok: z.boolean(),
  available: z.boolean(),
});
