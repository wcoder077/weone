// Database enum values (English) with their Uzbek display labels.

export const LOOKING_FOR = [
  { value: "collaboration", label: "Hamkorlik" },
  { value: "hackathon_team", label: "Hackathon jamoasi" },
  { value: "startup", label: "Startap" },
  { value: "internship", label: "Amaliyot" },
  { value: "freelance", label: "Frilans" },
  { value: "mentorship", label: "Mentorlik" },
  { value: "learning", label: "Birga o'rganish" },
  { value: "open_source", label: "Open source" },
] as const;

export type LookingFor = (typeof LOOKING_FOR)[number]["value"];
export const LOOKING_FOR_VALUES = LOOKING_FOR.map((o) => o.value) as [LookingFor, ...LookingFor[]];

export const SKILL_LEVELS = [
  { value: "learning", label: "O'rganyapman" },
  { value: "comfortable", label: "Yaxshi bilaman" },
  { value: "strong", label: "Kuchli" },
] as const;

export type SkillLevel = (typeof SKILL_LEVELS)[number]["value"];
export const SKILL_LEVEL_VALUES = SKILL_LEVELS.map((o) => o.value) as [SkillLevel, ...SkillLevel[]];

export const SKILL_CATEGORIES = [
  { value: "Programming", label: "Dasturlash" },
  { value: "Design", label: "Dizayn" },
  { value: "Product", label: "Mahsulot" },
  { value: "Tools", label: "Vositalar" },
  { value: "Marketing", label: "Marketing" },
  { value: "Other", label: "Boshqa" },
] as const;

export const CITIES = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Fargʻona",
  "Namangan",
  "Andijon",
  "Qarshi",
  "Nukus",
  "Urganch",
  "Navoiy",
  "Jizzax",
  "Termiz",
  "Guliston",
] as const;

export const ONBOARDING_SKILLS = { min: 3, max: 10 } as const;

export function labelOf<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string,
) {
  return options.find((o) => o.value === value)?.label ?? value;
}
