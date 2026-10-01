// Database enum values (English) with their Uzbek display labels.

export const LOOKING_FOR = [
  { value: "collaboration", label: "Hamkorlik" },
  { value: "hackathon_team", label: "Hackathon jamoasi" },
  { value: "startup", label: "Startap" },
  { value: "internship", label: "Amaliyot" },
  { value: "freelance", label: "Frilans" },
  { value: "mentorship", label: "Mentorlik" },
  { value: "learning", label: "Birga o'rganish" },
  { value: "open_source", label: "Ochiq manba" },
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
  "Farg'ona",
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

export const JOURNEY_TYPES = [
  { value: "hackathon", label: "Hackathon" },
  { value: "competition", label: "Musobaqa" },
  { value: "job", label: "Ish" },
  { value: "internship", label: "Amaliyot" },
  { value: "project", label: "Loyiha" },
  { value: "open_source", label: "Ochiq manba" },
  { value: "course", label: "Kurs" },
  { value: "workshop", label: "Ustaxona" },
  { value: "meetup", label: "Uchrashuv" },
  { value: "conference", label: "Konferensiya" },
  { value: "volunteer", label: "Ko'ngillilik" },
  { value: "other", label: "Boshqa" },
] as const;

export type JourneyType = (typeof JOURNEY_TYPES)[number]["value"];
export const JOURNEY_TYPE_VALUES = JOURNEY_TYPES.map((o) => o.value) as [JourneyType, ...JourneyType[]];
// Only these can be confirmed by another participant.
export const CONFIRMABLE_TYPES: readonly string[] = ["hackathon", "competition"];

export const PROJECT_STATUSES = [
  { value: "idea", label: "G'oya" },
  { value: "building", label: "Ishlanmoqda" },
  { value: "launched", label: "Ishga tushgan" },
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["value"];
export const PROJECT_STATUS_VALUES = PROJECT_STATUSES.map((o) => o.value) as [
  ProjectStatus,
  ...ProjectStatus[],
];

// "React · 4 loyiha · 2 tadbir"
export function evidenceText(projects: number, events: number) {
  const parts: string[] = [];
  if (projects > 0) parts.push(`${projects} loyiha`);
  if (events > 0) parts.push(`${events} tadbir`);
  return parts.join(" · ");
}

// Project creators are stored with role "Owner" (spec); show it in Uzbek.
export function memberRoleLabel(role: string) {
  return role === "Owner" ? "Asoschi" : role;
}

// Find people "for" options; find_people() maps them onto looking_for values.
export const FIND_PURPOSES = [
  { value: "hackathon", label: "Hackathon" },
  { value: "startup", label: "Startap" },
  { value: "project", label: "Loyiha" },
  { value: "learning", label: "O'rganish" },
] as const;

export const COLLAB_REASONS = [
  { value: "project", label: "Loyiha" },
  { value: "hackathon", label: "Hackathon" },
  { value: "startup", label: "Startap" },
  { value: "learning", label: "Birga o'rganish" },
  { value: "open_source", label: "Ochiq manba" },
  { value: "mentorship", label: "Mentorlik" },
] as const;

export type CollabReason = (typeof COLLAB_REASONS)[number]["value"];
export const COLLAB_REASON_VALUES = COLLAB_REASONS.map((o) => o.value) as [CollabReason, ...CollabReason[]];
