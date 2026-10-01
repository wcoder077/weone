import { Suspense } from "react";
import Link from "next/link";
import { Search, Users, X, FolderKanban } from "lucide-react";
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
import { Input } from "@/components/ui/input";
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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold lg:text-[32px]">Kashf etish</h1>

      <form action="/discover" role="search" className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="tab" value={tab} />
        {selectedSkills.map((id) => (
          <input key={id} type="hidden" name="s" value={id} />
        ))}
        {(["city", "lang", "available", "online", "status"] as const).map((key) =>
          single(params[key]) ? <input key={key} type="hidden" name={key} value={single(params[key])} /> : null,
        )}
        <label className="relative flex-1">
          <span className="sr-only">Qidirish</span>
          <Search className="text-muted pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
          <Input name="q" type="search" defaultValue={q} placeholder="Ism, ko'nikma yoki loyiha" className="bg-card h-12 pl-11" />
        </label>
        {tab === "people" ? (
          <Input name="role" defaultValue={single(params.role)} placeholder="Rol, masalan backend" aria-label="Rol bo'yicha" className="bg-card h-12 sm:max-w-56" />
        ) : null}
        <button type="submit" className={cn(buttonVariants({ size: "lg" }))}>
          Qidirish
        </button>
      </form>

      <LinkTabs
        label="Kashf etish bo'limlari"
        active={tab}
        tabs={[
          { value: "people", label: "Odamlar", href: hrefWith("/discover", { q }, { tab: "people" }) },
          { value: "projects", label: "Loyihalar", href: hrefWith("/discover", { q }, { tab: "projects" }) },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <UrlFilterSelect multi param="s" label="Ko'nikma" options={skills.map((s) => ({ value: s.id, label: s.name }))} />
        {tab === "people" ? (
          <>
            <UrlFilterSelect param="city" label="Shahar" options={CITIES.map((c) => ({ value: c, label: c }))} />
            <UrlFilterSelect param="lang" label="Til" options={languages.map((l) => ({ value: l, label: l }))} />
            <FilterToggle href={toggleHref("available")} active={Boolean(single(params.available))}>
              Hamkorlikka ochiq
            </FilterToggle>
            <FilterToggle href={toggleHref("online")} active={Boolean(single(params.online))}>
              Onlayn
            </FilterToggle>
          </>
        ) : (
          <UrlFilterSelect param="status" label="Holat" options={[...PROJECT_STATUSES]} />
        )}
      </div>

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

      {tab === "people" ? (
        <div className="bg-card border-border rounded-card flex flex-col gap-3 border p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px]">
            <span className="font-semibold">Loyiha yoki hackathon uchun odam kerakmi?</span>{" "}
            <span className="text-muted">Kimni qidirayotganingizni yozing.</span>
          </p>
          <Link href="/find" className={buttonVariants()}>
            Odam topish
          </Link>
        </div>
      ) : null}

      <Suspense key={JSON.stringify(params)} fallback={<CardGridSkeleton count={6} variant={tab === "people" ? "person" : "project"} />}>
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
          />
        ) : (
          <ProjectResults
            params={params}
            filters={{ q, skillIds: selectedSkills, status: single(params.status), page: pageOf(params.page) }}
            selectedSkillNames={selectedSkills.map((id) => skillName.get(id) ?? "")}
          />
        )}
      </Suspense>
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
}: {
  params: Params;
  filters: PeopleFilters;
  selectedSkillNames: string[];
}) {
  const viewerId = await requireUserId();
  const [{ people, total }, relationships] = await Promise.all([
    searchPeople(viewerId, filters),
    getRelationships(viewerId),
  ]);

  if (people.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Hech kim topilmadi"
        description="Filtrlarni kamaytiring yoki «Odam topish» orqali talablaringizni yozing."
        action={{ label: "Odam topish", href: "/find" }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted text-[14px]">{total} kishi</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <PersonCard
            key={p.id}
            person={p}
            skills={p.user_skills.flatMap((s) => (s.skills ? [s.skills.name] : []))}
            matchedSkills={selectedSkillNames}
            actions={<ConnectButton userId={p.id} connection={relationships.connection(p.id)} className="flex-1" />}
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
