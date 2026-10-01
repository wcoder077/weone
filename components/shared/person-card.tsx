import Link from "next/link";
import type { ReactNode } from "react";
import { Check, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SkillChip } from "./skill-chip";
import { UserAvatar } from "./user-avatar";

export type PersonCardData = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  city: string | null;
  available: boolean;
};

export function PersonCard({
  person,
  skills,
  matchedSkills = [],
  reasons,
  actions,
}: {
  person: PersonCardData;
  skills: string[];
  matchedSkills?: string[];
  reasons?: ReactNode;
  // Connection action(s); shown next to "Profilni ko'rish".
  actions?: ReactNode;
}) {
  const matched = new Set(matchedSkills);
  // Matched skills first so the reason for showing this person is visible.
  const shown = [...skills].sort((a, b) => Number(matched.has(b)) - Number(matched.has(a))).slice(0, 4);

  return (
    <article className="bg-card border-border rounded-card flex flex-col gap-4 border p-5">
      <div className="flex items-start gap-3">
        <UserAvatar name={person.full_name} url={person.avatar_url} size="lg" userId={person.id} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="truncate text-base font-semibold">
            <Link href={`/u/${person.username}`} className="hover:underline">
              {person.full_name || person.username}
            </Link>
          </h3>
          {person.headline ? <p className="text-muted line-clamp-2 text-[14px]">{person.headline}</p> : null}
          {person.city ? (
            <p className="text-muted inline-flex items-center gap-1 text-[13px]">
              <MapPin className="size-3.5" aria-hidden />
              {person.city}
            </p>
          ) : null}
        </div>
      </div>
      {shown.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {shown.map((name) => (
            <SkillChip key={name} matched={matched.has(name)}>
              {name}
            </SkillChip>
          ))}
        </div>
      ) : null}
      {reasons}
      {actions ? (
        <div className="mt-auto flex flex-wrap gap-2 [&>*]:min-w-36 [&>*]:flex-1">
          <Link href={`/u/${person.username}`} className={buttonVariants({ variant: "outline" })}>
            Profilni ko&apos;rish
          </Link>
          {actions}
        </div>
      ) : null}
    </article>
  );
}

// "Why this person matches" checklist. No percentages, only readable reasons.
export function MatchReasons({ reasons, title = "Nega mos" }: { reasons: string[]; title?: string }) {
  if (reasons.length === 0) return null;
  return (
    <div className="bg-surface border-border flex flex-col gap-2 rounded-2xl border p-4">
      <p className="text-muted text-[13px]">{title}</p>
      <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {reasons.map((reason) => (
          <li key={reason} className="flex items-start gap-2 text-[14px]">
            <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
            {reason}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Compact "✓ React ✓ Toshkent" line for suggestion cards.
export function InlineReasons({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null;
  return (
    <ul className="text-muted flex flex-wrap gap-x-3 gap-y-1 text-[13px]" aria-label="Nega mos">
      {reasons.map((reason) => (
        <li key={reason} className="inline-flex items-center gap-1">
          <Check className="text-primary size-3.5" aria-hidden />
          {reason}
        </li>
      ))}
    </ul>
  );
}
