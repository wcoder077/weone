import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import { LOOKING_FOR, evidenceText, labelOf } from "@/lib/constants";
import type { ProfilePage } from "@/lib/queries/profile-page";
import { SkillChip } from "@/components/shared/skill-chip";
import { UserAvatar } from "@/components/shared/user-avatar";
import { bannerUrl } from "@/lib/url";
import { isGeneratedUsername } from "@/lib/validation/profile";

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bg-card border-border rounded-card flex flex-col gap-4 border p-5">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <h2 className="text-base font-semibold whitespace-nowrap">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ProfileHeader({
  profile,
  actions,
  bannerEditor,
}: {
  profile: ProfilePage["profile"];
  actions: ReactNode;
  bannerEditor?: ReactNode;
}) {
  const banner = bannerUrl(profile.banner_path);
  return (
    <section className="bg-card border-border rounded-card overflow-hidden border">
      {/* Banner behind the header; the avatar overlaps its bottom edge. */}
      <div className="bg-surface relative h-32 sm:h-44 lg:h-52">
        {banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner}
            alt=""
            className="size-full object-cover"
            style={{ objectPosition: `50% ${profile.banner_position}%` }}
          />
        ) : null}
        {/* Bottom of the banner melts into the card colour, so it follows light/dark. */}
        <div
          aria-hidden
          className="from-card via-card/60 pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-linear-to-t to-transparent"
        />
        {bannerEditor ? <div className="absolute top-3 right-3">{bannerEditor}</div> : null}
      </div>
      <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:gap-5 sm:px-6 sm:pb-6">
        <div className="ring-card bg-card relative -mt-12 w-fit shrink-0 rounded-full ring-4">
          <UserAvatar name={profile.full_name} url={profile.avatar_url} size="xl" available={profile.available} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:pt-4">
          <h1 className="text-2xl font-bold lg:text-[28px]">{profile.full_name || profile.username}</h1>
          {isGeneratedUsername(profile.username) ? null : <p className="text-muted">@{profile.username}</p>}
          {profile.headline ? <p className="text-[15px]">{profile.headline}</p> : null}
          <div className="text-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px]">
            {profile.city ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" aria-hidden />
                {profile.city}
                {profile.is_online_ok ? " · onlayn ham" : ""}
              </span>
            ) : null}
            {profile.available ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="bg-success size-2 rounded-full" aria-hidden />
                Hamkorlikka ochiq
              </span>
            ) : null}
          </div>
          {profile.looking_for.length > 0 ? (
            <p className="text-[14px]">
              <span className="text-muted">Qidiryapti: </span>
              {profile.looking_for.map((v) => labelOf(LOOKING_FOR, v)).join(", ")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch sm:pt-4">{actions}</div>
      </div>
    </section>
  );
}

export function SkillsList({ skills }: { skills: ProfilePage["skills"] }) {
  if (skills.length === 0) return <p className="text-muted text-[14px]">Hali ko&apos;nikma qo&apos;shilmagan.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {skills.map((skill) => {
        const evidence = evidenceText(skill.project_count ?? 0, skill.journey_count ?? 0);
        return (
          <li key={skill.skill_id} className="flex items-center justify-between gap-3">
            <SkillChip className="text-text">{skill.skill_name}</SkillChip>
            <span className="text-muted truncate text-[13px]">{evidence || "hali isbotsiz"}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function EducationList({ education }: { education: ProfilePage["education"] }) {
  if (education.length === 0) return <p className="text-muted text-[14px]">Ta&apos;lim qo&apos;shilmagan.</p>;
  return (
    <ul className="flex flex-col gap-4">
      {education.map((e) => (
        <li key={e.id} className="flex flex-col gap-1">
          <span className="font-medium">{e.institution}</span>
          <span className="text-muted text-[14px]">
            {[e.degree, e.field].filter(Boolean).join(" · ")}
            {e.start_year ? ` · ${e.start_year}–${e.end_year ?? "hozir"}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function TagList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-muted text-[14px]">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <SkillChip key={item}>{item}</SkillChip>
      ))}
    </div>
  );
}
