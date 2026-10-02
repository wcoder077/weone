import { Suspense } from "react";
import { SearchX, UserSearch } from "lucide-react";
import { FindForm, type FindFormValues } from "@/components/find/find-form";
import { EmptyState } from "@/components/shared/empty-state";
import { MatchReasons, PersonCard } from "@/components/shared/person-card";
import { CardGridSkeleton } from "@/components/shared/skeletons";
import { PersonActions } from "@/components/social/person-actions";
import { requireUserId } from "@/lib/auth";
import { FIND_PURPOSES, LOOKING_FOR, labelOf } from "@/lib/constants";
import { findPeople, type FindParams, type FindResult } from "@/lib/queries/find";
import { getAllSkills } from "@/lib/queries/skills";
import { many, single } from "@/lib/url";
import { BackLink } from "@/components/shared/back-link";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Maqsaddosh topish") };
}

// Words that carry no role meaning in a free-text request.
const FILLER = new Set([
  "menga", "bizga", "kerak", "uchun", "bir", "bitta", "i", "need", "a", "an", "for", "the", "we", "looking",
  "hackathon", "startap", "startup", "loyiha", "project", "learning",
]);

// Free text from the Welcome page ("Menga hackathon uchun backend dasturchi kerak")
// pre-fills the form: a purpose keyword picks "for", the remaining words become the role.
function fromFreeText(q: string): Pick<FindFormValues, "role" | "purpose"> {
  const text = q.toLowerCase();
  const purpose = text.includes("hackathon")
    ? "hackathon"
    : /startap|startup/.test(text)
      ? "startup"
      : /o.rgan|learn/.test(text)
        ? "learning"
        : /loyiha|project/.test(text)
          ? "project"
          : "";
  const role = q
    .split(/\s+/)
    .filter((word) => !FILLER.has(word.toLowerCase().replace(/[^\p{L}]/gu, "")))
    .join(" ");
  return { role: role.slice(0, 80), purpose };
}

const PURPOSE_TO_LOOKING_FOR: Record<string, string> = {
  hackathon: "hackathon_team",
  startup: "startup",
  project: "collaboration",
  learning: "learning",
};

function reasonsFor(person: FindResult, params: FindParams) {
  const reasons = [...person.matchedSkillNames];
  if (person.role_match && params.role) reasons.push(`«${params.role}» roliga mos`);
  if (person.has_hackathon) reasons.push("Hackathon tajribasi bor");
  if (person.location_match) {
    const sameCity = params.city && person.city?.toLowerCase() === params.city.toLowerCase();
    reasons.push(sameCity ? `${person.city}da` : "Onlayn ishlay oladi");
  }
  if (person.is_open) reasons.push("Hamkorlikka ochiq");
  if (person.looking_for_match && params.purpose) {
    reasons.push(`U ham ${labelOf(LOOKING_FOR, PURPOSE_TO_LOOKING_FOR[params.purpose]).toLowerCase()} qidiryapti`);
  }
  return reasons;
}

export default async function FindPage({ searchParams }: PageProps<"/find">) {
  const t = await getT();
  const params = await searchParams;
  const skills = await getAllSkills();
  const known = new Set(skills.map((s) => s.id));
  const freeText = single(params.q);
  const purpose = single(params.for);

  const initial: FindFormValues = {
    role: single(params.role) ?? "",
    purpose: purpose && FIND_PURPOSES.some((p) => p.value === purpose) ? purpose : "",
    skillIds: many(params.s).filter((id) => known.has(id)),
    city: single(params.city) ?? "",
    online: Boolean(single(params.online)),
    openOnly: Boolean(single(params.open)),
    ...(freeText ? fromFreeText(freeText) : {}),
  };
  const submitted = Boolean(single(params.go) || freeText);

  return (
    <div className="flex flex-col gap-6">
      <BackLink fallback="/discover" />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold lg:text-[32px]">{t("Maqsaddosh topish")}</h1>
        <p className="text-muted">{t("Kim kerakligini yozing — har bir natija nega mos ekanini ko'rasiz.")}</p>
      </div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="bg-card border-border rounded-card border p-5 lg:sticky lg:top-24">
          <FindForm key={JSON.stringify(initial)} skills={skills} initial={initial} />
        </aside>
        <section aria-label={t("Natijalar")}>
          {submitted ? (
            <Suspense key={JSON.stringify(initial)} fallback={<CardGridSkeleton count={3} />}>
              <FindResults
                params={{
                  role: initial.role || undefined,
                  purpose: initial.purpose || undefined,
                  skillIds: initial.skillIds,
                  city: initial.city || undefined,
                  online: initial.online,
                  openOnly: initial.openOnly,
                }}
              />
            </Suspense>
          ) : (
            <EmptyState
              icon={UserSearch}
              title={t("Talablarni yozing")}
              description={t("Rol, maqsad va kerakli ko'nikmalarni tanlang — mos maqsaddoshlarni sabablari bilan ko'rsatamiz.")}
            />
          )}
        </section>
      </div>
    </div>
  );
}

async function FindResults({ params }: { params: FindParams }) {
  const t = await getT();
  const [viewerId, people] = await Promise.all([requireUserId(), findPeople(params)]);

  if (people.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={t("Mos maqsaddosh topilmadi")}
        description={t("Talablarni kamaytirib ko'ring: kamroq ko'nikma yoki «Onlayn ham bo'ladi».")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted text-[14px]">{people.length} {" "}{t("kishi mos keldi")}</p>
      {people.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
          skills={person.skills.map((s) => s.name)}
          matchedSkills={person.matchedSkillNames}
          reasons={<MatchReasons reasons={reasonsFor(person, params)} />}
          actions={<PersonActions viewerId={viewerId} userId={person.id} name={person.full_name} />}
        />
      ))}
    </div>
  );
}
