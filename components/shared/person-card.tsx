import Link from "next/link";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
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
  // Connection action(s), bottom right; the rest of the card opens the profile.
  actions?: ReactNode;
}) {
  const matched = new Set(matchedSkills);
  // Matched skills first so the reason for showing this person is visible.
  const sorted = [...skills].sort((a, b) => Number(matched.has(b)) - Number(matched.has(a)));
  const shown = sorted.slice(0, 3);
  const subtitle = [person.headline, person.city].filter(Boolean).join(" · ");

  // Compact card: the whole card opens the profile (stretched link on the name);
  // the connect button sits above that link.
  return (
    <article className="bg-card border-border hover:border-muted/40 relative flex flex-col gap-3 rounded-[20px] border p-4 transition-colors">
      <div className="flex items-center gap-3">
        <UserAvatar name={person.full_name} url={person.avatar_url} userId={person.id} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="truncate text-[15px] font-semibold">
            <Link href={`/u/${person.username}`} className="after:absolute after:inset-0 after:rounded-[20px]">
              {person.full_name || person.username}
            </Link>
          </h3>
          {subtitle ? <p className="text-muted truncate text-[13px]">{subtitle}</p> : null}
        </div>
      </div>
      {shown.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Ko'nikmalar">
          {shown.map((name) => (
            <li
              key={name}
              className={cn(
                "inline-flex h-7 items-center rounded-full border px-2.5 text-[12px]",
                matched.has(name) ? "border-primary bg-primary/10 text-text" : "border-border text-muted",
              )}
            >
              {name}
            </li>
          ))}
          {sorted.length > shown.length ? (
            <li className="text-muted inline-flex h-7 items-center px-1 text-[12px]">+{sorted.length - shown.length}</li>
          ) : null}
        </ul>
      ) : null}
      {reasons}
      {actions ? <div className="relative z-10 mt-auto flex justify-end gap-2 [&>*]:px-4">{actions}</div> : null}
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
