import type { ReactNode } from "react";
import { Handshake, MapPin } from "lucide-react";
import { LOOKING_FOR, evidenceText, labelOf } from "@/lib/constants";
import type { ProfilePage } from "@/lib/queries/profile-page";
import { CopyUsername } from "@/components/profile/copy-username";
import { SkillChip } from "@/components/shared/skill-chip";
import { UserAvatar } from "@/components/shared/user-avatar";
import { OnlineLabel } from "@/components/layout/online-presence";
import { DEFAULT_BANNER, bannerUrl } from "@/lib/url";
import { cn } from "@/lib/utils";
import { isGeneratedUsername } from "@/lib/validation/profile";
import { getT } from "@/lib/i18n/server";

export { SectionCard } from "@/components/shared/section-card";

export async function ProfileHeader({
  profile,
  actions,
  bannerEditor,
}: {
  profile: ProfilePage["profile"];
  actions: ReactNode;
  bannerEditor?: ReactNode;
}) {
  const t = await getT();
  const banner = bannerUrl(profile.banner_path);
  const position = banner ? { objectPosition: `50% ${profile.banner_position}%` } : undefined;
  // The user's banner, or the default one (a light and a dark file that follow the theme).
  const bannerImage = (className: string) =>
    banner ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={banner} alt="" className={className} style={position} />
    ) : (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={DEFAULT_BANNER.light} alt="" className={cn(className, "dark:hidden")} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={DEFAULT_BANNER.dark} alt="" className={cn(className, "hidden dark:block")} />
      </>
    );

  return (
    <section className="bg-card border-border rounded-card relative overflow-hidden border">
      {/* Ambient glow: a blurred copy of the banner spills its own colours down into the
          card and fades out, so the banner never ends in a hard white/black edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-45 [mask-image:linear-gradient(to_bottom,black_35%,transparent)] sm:h-80 lg:h-96 dark:opacity-50"
      >
        {bannerImage("size-full scale-110 object-cover blur-2xl")}
      </div>
      {/* Banner behind the header; its bottom dissolves into the glow; the avatar overlaps it. */}
      <div className="relative h-32 sm:h-44 lg:h-52">
        <div className="size-full [mask-image:linear-gradient(to_bottom,black_65%,transparent)]">
          {bannerImage("size-full object-cover")}
        </div>
        {bannerEditor ? <div className="absolute top-3 right-3">{bannerEditor}</div> : null}
      </div>
      <div className="relative flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:gap-5 sm:px-6 sm:pb-6">
        <div className="ring-card relative -mt-12 flex h-fit w-fit shrink-0 self-start rounded-full ring-4">
          <UserAvatar name={profile.full_name} url={profile.avatar_url} size="xl" userId={profile.id} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:pt-4">
          <h1 className="text-2xl font-bold lg:text-[28px]">{profile.full_name || profile.username}</h1>
          {isGeneratedUsername(profile.username) ? null : <CopyUsername username={profile.username} />}
          {profile.headline ? <p className="text-[15px]">{profile.headline}</p> : null}
          <div className="text-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px]">
            {profile.city ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" aria-hidden />
                {t(profile.city)}
                {profile.is_online_ok ? t(" · onlayn ham") : ""}
              </span>
            ) : null}
            <OnlineLabel userId={profile.id} />
            {/* The green dot means "online" now, so "open to collaboration" gets its own icon. */}
            {profile.available ? (
              <span className="inline-flex items-center gap-1.5">
                <Handshake className="text-primary size-4" aria-hidden />
                {t("Hamkorlikka ochiq")}</span>
            ) : null}
          </div>
          {profile.looking_for.length > 0 ? (
            <p className="text-[14px]">
              <span className="text-muted">{t("Qidiryapti:")}{" "}</span>
              {profile.looking_for.map((v) => labelOf(LOOKING_FOR, v)).join(", ")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch sm:pt-4">{actions}</div>
      </div>
    </section>
  );
}

export async function SkillsList({ skills }: { skills: ProfilePage["skills"] }) {
  const t = await getT();
  if (skills.length === 0) return <p className="text-muted text-[14px]">{t("Hali ko'nikma qo'shilmagan.")}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {skills.map((skill) => {
        const evidence = evidenceText(skill.project_count ?? 0, skill.journey_count ?? 0);
        return (
          <li key={skill.skill_id} className="flex items-center justify-between gap-3">
            <SkillChip className="text-text">{skill.skill_name}</SkillChip>
            <span className="text-muted truncate text-[13px]">{evidence || t("hali isbotsiz")}</span>
          </li>
        );
      })}
    </ul>
  );
}

export async function EducationList({ education }: { education: ProfilePage["education"] }) {
  const t = await getT();
  if (education.length === 0) return <p className="text-muted text-[14px]">{t("Ta'lim qo'shilmagan.")}</p>;
  return (
    <ul className="flex flex-col gap-4">
      {education.map((e) => (
        <li key={e.id} className="flex flex-col gap-1">
          <span className="font-medium">{e.institution}</span>
          <span className="text-muted text-[14px]">
            {[e.degree, e.field].filter(Boolean).join(" · ")}
            {e.start_year ? ` · ${e.start_year}–${e.end_year ?? t("hozir")}` : ""}
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
