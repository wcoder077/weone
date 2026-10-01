import Link from "next/link";
import { notFound } from "next/navigation";
import { JoinDialog } from "@/components/projects/join-dialog";
import {
  CancelRequestButton,
  DecideRequestButtons,
  DeleteProjectButton,
  LeaveProjectButton,
  RemoveMemberButton,
  RoleToggleButton,
} from "@/components/projects/team-actions";
import { SectionCard } from "@/components/profile/profile-sections";
import { ProjectLogo, StatusBadge } from "@/components/shared/project-card";
import { SkillChip } from "@/components/shared/skill-chip";
import { UserAvatar } from "@/components/shared/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { requireUserId } from "@/lib/auth";
import { memberRoleLabel } from "@/lib/constants";
import { formatMonth } from "@/lib/format";
import { getJoinRequests, getProject, type ProjectDetails } from "@/lib/queries/projects";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  return { title: project?.name ?? "Loyiha" };
}

async function getViewerSkillIds(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("user_skills").select("skill_id").eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.skill_id));
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const [userId, project] = await Promise.all([requireUserId(), getProject(slug)]);
  if (!project) notFound();

  const [requests, mySkills] = await Promise.all([getJoinRequests(project.id), getViewerSkillIds(userId)]);
  const isOwner = project.owner_id === userId;
  const isMember = project.project_members.some((m) => m.user_id === userId);
  const openRoles = project.project_roles.filter((r) => r.is_open);
  const visibleRoles = isOwner ? project.project_roles : openRoles;
  const myPending = requests.find((r) => r.user_id === userId && r.status === "pending");
  const pendingForOwner = isOwner ? requests.filter((r) => r.status === "pending") : [];
  const canAsk = !isMember && !myPending;
  const roleOptions = openRoles.map((r) => ({ id: r.id, title: r.title }));

  return (
    <div className="flex flex-col gap-6">
      <ProjectHeader project={project}>
        {isOwner ? (
          <>
            <Link href={`/projects/${project.slug}/edit`} className={buttonVariants()}>
              Tahrirlash
            </Link>
            <DeleteProjectButton projectId={project.id} />
          </>
        ) : null}
        {!isOwner && isMember ? <LeaveProjectButton projectId={project.id} userId={userId} /> : null}
        {canAsk ? <JoinDialog projectId={project.id} projectName={project.name} roles={roleOptions} /> : null}
        {myPending ? (
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-muted text-[14px]">So&apos;rov yuborildi</span>
            <CancelRequestButton requestId={myPending.id} />
          </span>
        ) : null}
      </ProjectHeader>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          {pendingForOwner.length > 0 ? (
            <SectionCard title={`Qo'shilish so'rovlari · ${pendingForOwner.length}`}>
              <ul className="flex flex-col gap-4">
                {pendingForOwner.map((r) => (
                  <li key={r.id} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <UserAvatar name={r.profiles?.full_name ?? "?"} url={r.profiles?.avatar_url ?? null} />
                      <div className="flex min-w-0 flex-col gap-1">
                        <Link href={`/u/${r.profiles?.username}`} className="font-medium hover:underline">
                          {r.profiles?.full_name}
                        </Link>
                        <span className="text-muted text-[13px]">
                          {project.project_roles.find((role) => role.id === r.project_role_id)?.title ?? "Har qanday rol"}
                        </span>
                        {r.message ? <p className="text-[14px]">{r.message}</p> : null}
                      </div>
                    </div>
                    <DecideRequestButtons requestId={r.id} />
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Loyiha haqida</h2>
            <p className="text-muted leading-relaxed whitespace-pre-line">
              {project.description ?? project.tagline ?? "Tavsif hali yozilmagan."}
            </p>
          </section>

          {project.project_skills.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Texnologiyalar</h2>
              <div className="flex flex-wrap gap-2">
                {project.project_skills.map((s) => (
                  <SkillChip key={s.skill_id} className="h-10 px-4 text-[14px]">
                    {s.skills?.name}
                  </SkillChip>
                ))}
              </div>
            </section>
          ) : null}

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Jamoa · {project.project_members.length}</h2>
            <ul className="flex flex-col gap-2">
              {project.project_members.map((m) => (
                <li key={m.user_id} className="flex items-center gap-3">
                  <UserAvatar name={m.profiles?.full_name ?? "?"} url={m.profiles?.avatar_url ?? null} />
                  <Link href={`/u/${m.profiles?.username}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                    {m.profiles?.full_name}
                  </Link>
                  <span className="text-muted text-[14px]">{memberRoleLabel(m.role)}</span>
                  {isOwner && m.user_id !== userId ? (
                    <RemoveMemberButton projectId={project.id} memberId={m.user_id} name={m.profiles?.full_name ?? ""} />
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{isOwner ? "Rollar" : "Ochiq rollar"}</h2>
            {visibleRoles.length === 0 ? (
              <p className="text-muted text-[14px]">Hozircha ochiq rol yo&apos;q.</p>
            ) : (
              visibleRoles.map((role) => (
                <div key={role.id} className="bg-card border-border rounded-card flex flex-col gap-4 border p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{role.title}</h3>
                    {!role.is_open ? <span className="text-muted text-[13px]">Yopiq</span> : null}
                  </div>
                  {role.project_role_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {role.project_role_skills.map((s) => (
                        <SkillChip key={s.skill_id} matched={mySkills.has(s.skill_id)}>
                          {s.skills?.name}
                        </SkillChip>
                      ))}
                    </div>
                  ) : null}
                  {isOwner ? (
                    <RoleToggleButton roleId={role.id} isOpen={role.is_open} />
                  ) : canAsk ? (
                    <JoinDialog
                      projectId={project.id}
                      projectName={project.name}
                      roles={roleOptions}
                      roleId={role.id}
                      variant="outline"
                      label="Ariza berish"
                    />
                  ) : null}
                </div>
              ))
            )}
          </section>

          <SectionCard title="Tafsilotlar">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-[14px]">
              {project.category ? <DetailRow term="Soha" value={project.category} /> : null}
              <DetailRow term="Boshlangan" value={formatMonth(project.created_at.slice(0, 10))} />
              <DetailRow
                term="Qayerda"
                value={[project.city, project.is_online ? "Onlayn" : null].filter(Boolean).join(" / ") || "—"}
              />
            </dl>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({ term, value }: { term: string; value: string }) {
  return (
    <>
      <dt className="text-muted">{term}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </>
  );
}

function ProjectHeader({ project, children }: { project: ProjectDetails; children: React.ReactNode }) {
  return (
    <section className="bg-card border-border rounded-card flex flex-col gap-5 border p-5 sm:flex-row sm:items-center sm:p-8">
      <ProjectLogo name={project.name} url={project.logo_url} className="size-18 rounded-2xl text-2xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold lg:text-[28px]">{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        {project.tagline ? <p className="text-muted">{project.tagline}</p> : null}
        <p className="text-muted flex flex-wrap items-center gap-x-2 text-[14px]">
          {project.owner ? (
            <Link href={`/u/${project.owner.username}`} className="hover:text-text whitespace-nowrap">
              {project.owner.full_name} tomonidan
            </Link>
          ) : null}
          {project.github_url ? (
            <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="hover:text-text">
              · GitHub
            </a>
          ) : null}
          {project.demo_url ? (
            <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="hover:text-text">
              · Demo
            </a>
          ) : null}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </section>
  );
}
