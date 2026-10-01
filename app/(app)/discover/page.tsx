import { Suspense } from "react";
import Link from "next/link";
import { Users, X, FolderKanban } from "lucide-react";
import { FiltersSheet } from "@/components/discover/filters-sheet";
import { UrlSearchInput } from "@/components/discover/url-search-input";
import { PeopleCarousel } from "@/components/home/people-carousel";
import { ProjectCardFooter } from "@/components/projects/project-card-footer";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkTabs } from "@/components/shared/link-tabs";
import { Pagination } from "@/components/shared/pagination";
import { PersonCard } from "@/components/shared/person-card";
import { ProjectCard } from "@/components/shared/project-card";
import { CardGridSkeleton } from "@/components/shared/skeletons";
import { UrlFilterSelect } from "@/components/shared/url-filter-select";
import { ConnectButton } from "@/components/social/connect-button";
import { buttonVariants } from "@/components/ui/button";
import { requireUserId } from "@/lib/auth";
import { CITIES, PROJECT_STATUSES, labelOf } from "@/lib/constants";
import {
  PAGE_SIZE,
  getLanguages,
  searchPeople,
  searchProjects,
  type PeopleFilters,
  type ProjectSearchFilters,
} from "@/lib/queries/discover";
import { getPeopleForYou } from "@/lib/queries/home";
import { getMyProfile } from "@/lib/queries/profiles";
import { getAllSkills } from "@/lib/queries/skills";
import { getRelationships } from "@/lib/queries/social";
import { hrefWith, many, pageOf, single } from "@/lib/url";
import { cn } from "@/lib/utils";

export const metadata = { title: "Kashf etish" };

type Params = Record<string, string | string[] | undefined>;

export default async function DiscoverPage({ searchParams }: PageProps<"/discover">) {
  const params: Params = await searchParams;
  const tab = single(params.tab) === "projects" ? "projects" : "people";
  const [skills, languages] = await Promise.all([getAllSkills(), getLanguages()]);
  const skillName = new Map(skills.map((s) => [s.id, s.name]));
  const selectedSkills = many(params.s).filter((id) => skillName.has(id));
  const q = single(params.q);

  const toggleHref = (key: string) =>
    hrefWith("/discover", params, { [key]: single(params[key]) ? null : "1", page: null });

  // Removable chips for every active filter.
  const active: { label: string; href: string }[] = [
    ...selectedSkills.map((id) => ({
      label: skillName.get(id) ?? "",
      href: hrefWith("/discover", params, { s: selectedSkills.filter((x) => x !== id), page: null }),
    })),
    ...(["city", "role", "lang"] as const).flatMap((key) => {
      const value = single(params[key]);
      return value ? [{ label: value, href: hrefWith("/discover", params, { [key]: null, page: null }) }] : [];
    }),
    ...(tab === "projects" && single(params.status)
      ? [{ label: labelOf(PROJECT_STATUSES, single(params.status) ?? ""), href: hrefWith("/discover", params, { status: null, page: null }) }]
      : []),
  ];

  const filterCount =
    selectedSkills.length +
    (tab === "people"
      ? (["city", "role", "lang", "available", "online"] as const).filter((k) => single(params[k])).length
      : single(params.status)
        ? 1
        : 0);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">Kashf etish</h1>

      {/* Search + filters stay compact so the results start near the top. */}
      <div className="flex gap-2">
        <UrlSearchInput
          param="q"
          label="Qidirish"
          placeholder={tab === "people" ? "Ism, ko'nikma yoki rol" : "Loyiha nomi yoki ko'nikma"}
          className="min-w-0 flex-1"
        />
        <FiltersSheet count={filterCount}>
          {tab === "people" ? (
            <UrlSearchInput param="role" label="Rol bo'yicha" placeholder="Rol, masalan backend" />
          ) : null}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <UrlFilterSelect multi param="s" label="Ko'nikma" options={skills.map((s) => ({ value: s.id, label: s.name }))} />
            {tab === "people" ? (
              <>
                <UrlFilterSelect param="city" label="Shahar" options={CITIES.map((c) => ({ value: c, label: c }))} />
                <UrlFilterSelect param="lang" label="Til" options={languages.map((l) => ({ value: l, label: l }))} />
              </>
            ) : (
              <UrlFilterSelect param="status" label="Holat" options={[...PROJECT_STATUSES]} />
            )}
          </div>
          {tab === "people" ? (
            <div className="flex flex-wrap gap-2">
              <FilterToggle href={toggleHref("available")} active={Boolean(single(params.available))}>
                Hamkorlikka ochiq
              </FilterToggle>
              <FilterToggle href={toggleHref("online")} active={Boolean(single(params.online))}>
                Onlayn
              </FilterToggle>
            </div>
          ) : null}
        </FiltersSheet>
      </div>

      <LinkTabs
        label="Kashf etish bo'limlari"
        active={tab}
        tabs={[
          { value: "people", label: "Maqsaddoshlar", href: hrefWith("/discover", { q }, { tab: "people" }) },
          { value: "projects", label: "Loyihalar", href: hrefWith("/discover", { q }, { tab: "projects" }) },
        ]}
      />

      {active.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Faol filtrlar">
          {active.map((f) => (
            <li key={f.label}>
              <Link
                href={f.href}
                scroll={false}
                className="border-primary bg-primary/10 inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-[14px]"
              >
                {f.label}
                <X className="size-3.5" aria-label="olib tashlash" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {/* No key: while a new search loads, the current results stay instead of a skeleton flash. */}
      <Suspense fallback={<CardGridSkeleton count={6} variant={tab === "people" ? "person" : "project"} />}>
        {tab === "people" ? (
          <PeopleResults
            params={params}
            filters={{
              q,
              skillIds: selectedSkills,
              city: single(params.city),
              role: single(params.role),
              available: Boolean(single(params.available)),
              language: single(params.lang),
              online: Boolean(single(params.online)),
              page: pageOf(params.page),
            }}
            selectedSkillNames={selectedSkills.map((id) => skillName.get(id) ?? "")}
            showPicks={!q && filterCount === 0 && pageOf(params.page) === 1}
          />
        ) : (
          <ProjectResults
            params={params}
            filters={{ q, skillIds: selectedSkills, status: single(params.status), page: pageOf(params.page) }}
            selectedSkillNames={selectedSkills.map((id) => skillName.get(id) ?? "")}
          />
        )}
      </Suspense>

      {tab === "people" ? (
        <div className="bg-card border-border rounded-card flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px]">
            <span className="font-semibold">Aniq talablar bo&apos;yicha qidiryapsizmi?</span>{" "}
            <span className="text-muted">Rol, maqsad va ko&apos;nikmalarni yozing.</span>
          </p>
          <Link href="/find" className={buttonVariants({ variant: "outline" })}>
            Maqsaddosh topish
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function FilterToggle({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border px-4 text-[14px] font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted hover:text-text",
      )}
    >
      {children}
    </Link>
  );
}

async function PeopleResults({
  params,
  filters,
  selectedSkillNames,
  showPicks,
}: {
  params: Params;
  filters: PeopleFilters;
  selectedSkillNames: string[];
  showPicks: boolean;
}) {
  const viewerId = await requireUserId();
  const [{ people, total }, relationships, me] = await Promise.all([
    searchPeople(viewerId, filters),
    getRelationships(viewerId),
    showPicks ? getMyProfile() : null,
  ]);
  // Nothing searched yet: recommendations first, then everyone.
  const picks = me ? await getPeopleForYou(me, 8).catch(() => []) : [];

  if (people.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Hech kim topilmadi"
        description="Filtrlarni kamaytiring yoki «Maqsaddosh topish» orqali talablaringizni yozing."
        action={{ label: "Maqsaddosh topish", href: "/find" }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {picks.length > 0 ? <PeopleCarousel meId={viewerId} picks={picks} relationships={relationships} /> : null}
      <p className="text-muted text-[14px]">{picks.length > 0 ? `Barcha maqsaddoshlar · ${total}` : `${total} kishi`}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <PersonCard
            key={p.id}
            person={p}
            skills={p.user_skills.flatMap((s) => (s.skills ? [s.skills.name] : []))}
            matchedSkills={selectedSkillNames}
            actions={<ConnectButton meId={viewerId} userId={p.id} name={p.full_name} connection={relationships.connection(p.id)} />}
          />
        ))}
      </div>
      <Pagination page={filters.page} total={total} pageSize={PAGE_SIZE} hrefFor={(page) => hrefWith("/discover", params, { page: String(page) })} />
    </div>
  );
}

async function ProjectResults({
  params,
  filters,
  selectedSkillNames,
}: {
  params: Params;
  filters: ProjectSearchFilters;
  selectedSkillNames: string[];
}) {
  const { projects, total } = await searchProjects(filters);

  if (projects.length === 0) {
    return <EmptyState icon={FolderKanban} title="Loyiha topilmadi" description="Boshqa so'z yoki filtr bilan urinib ko'ring." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted text-[14px]">{total} ta loyiha</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={{ ...p, skills: p.project_skills.flatMap((s) => (s.skills ? [s.skills.name] : [])) }}
            matchedSkills={selectedSkillNames}
            footer={
              <ProjectCardFooter
                members={p.project_members.flatMap((m) =>
                  m.profiles ? [{ id: m.user_id, name: m.profiles.full_name, avatarUrl: m.profiles.avatar_url }] : [],
                )}
                openRoles={p.project_roles.filter((r) => r.is_open)}
              />
            }
          />
        ))}
      </div>
      <Pagination page={filters.page} total={total} pageSize={PAGE_SIZE} hrefFor={(page) => hrefWith("/discover", params, { page: String(page) })} />
    </div>
  );
}
