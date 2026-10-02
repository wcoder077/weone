"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PROJECT_STATUSES, labelOf } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SkillChip } from "./skill-chip";
import { useT } from "@/components/i18n/i18n-provider";

export type ProjectCardData = {
  name: string;
  slug: string;
  tagline: string | null;
  status: string;
  logo_url: string | null;
  skills: string[];
};

export function ProjectLogo({ name, url, className }: { name: string; url: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "bg-surface border-border flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border text-lg font-bold",
        className,
      )}
    >
      {url ? (
        // User-uploaded logo from our public storage bucket.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const t = useT();
  return (
    <span className="border-border text-muted inline-flex h-7 items-center rounded-full border px-3 text-[12px] font-medium">
      {t(labelOf(PROJECT_STATUSES, status))}
    </span>
  );
}

export function ProjectCard({
  project,
  meta,
  matchedSkills,
  footer,
}: {
  project: ProjectCardData;
  meta?: ReactNode;
  matchedSkills?: string[];
  footer?: ReactNode;
}) {
  const matched = new Set(matchedSkills);
  return (
    <article className="bg-card border-border rounded-card hover:border-muted/40 relative flex flex-col gap-4 border p-5 transition-colors">
      <div className="flex items-start gap-3">
        <ProjectLogo name={project.name} url={project.logo_url} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="truncate text-base font-semibold">
            <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0 after:rounded-card">
              {project.name}
            </Link>
          </h3>
          {meta ? <p className="text-muted truncate text-[13px]">{meta}</p> : null}
        </div>
        <StatusBadge status={project.status} />
      </div>
      {project.tagline ? <p className="text-muted line-clamp-2 text-[14px]">{project.tagline}</p> : null}
      {project.skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {project.skills.slice(0, 5).map((name) => (
            <SkillChip key={name} matched={matched.has(name)}>
              {name}
            </SkillChip>
          ))}
        </div>
      ) : null}
      {footer ? <div className="relative z-10 mt-auto">{footer}</div> : null}
    </article>
  );
}
