import { z } from "zod";
import { PROJECT_STATUS_VALUES } from "@/lib/constants";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Ko'pi bilan ${max} ta belgi`)
    .transform((v) => v || null);

const optionalHttpsUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || (/^https:\/\//.test(v) && z.url().safeParse(v).success), "https:// bilan boshlanuvchi havola kiriting")
  .transform((v) => v || null);

export const roleSchema = z.object({
  id: z.guid().nullable(),
  title: z.string().trim().min(1, "Rol nomini kiriting").max(60, "Juda uzun"),
  is_open: z.boolean(),
  skill_ids: z.array(z.guid()).max(8, "Ko'pi bilan 8 ta ko'nikma"),
});

export type RoleInput = z.infer<typeof roleSchema>;

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Loyiha nomini kiriting").max(80, "Juda uzun"),
  tagline: optionalText(140),
  description: optionalText(3000),
  category: optionalText(40),
  status: z.enum(PROJECT_STATUS_VALUES),
  city: optionalText(60),
  is_online: z.boolean(),
  github_url: optionalHttpsUrl,
  demo_url: optionalHttpsUrl,
  logo_url: z.union([z.literal(""), z.url()]).transform((v) => v || null),
  skill_ids: z.array(z.guid()).max(15, "Ko'pi bilan 15 ta texnologiya"),
  roles: z.array(roleSchema).max(10, "Ko'pi bilan 10 ta rol"),
});

export const joinRequestSchema = z.object({
  project_id: z.guid(),
  project_role_id: z.union([z.literal(""), z.guid()]).transform((v) => v || null),
  message: optionalText(500),
});

// "Yo'l Hamroh" -> "yol-hamroh-x7k2". The suffix keeps slugs unique without a lookup.
export function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[ʻʼ'`’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "loyiha"}-${suffix}`;
}
