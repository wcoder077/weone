import { LinkifiedText } from "@/components/shared/linkified-text";
import type { ReactNode } from "react";
import { BadgeCheck } from "lucide-react";
import { JOURNEY_TYPES, labelOf } from "@/lib/constants";
import { formatDateRange } from "@/lib/format";
import { SkillChip } from "./skill-chip";

export type JourneyItemData = {
  id: string;
  type: string;
  title: string;
  organization: string | null;
  role: string | null;
  result: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  verified: boolean;
  skills: string[];
};

export function JourneyItem({ item, actions }: { item: JourneyItemData; actions?: ReactNode }) {
  const dates = formatDateRange(item.start_date, item.end_date);
  const meta = [item.organization, item.role].filter(Boolean).join(" · ");

  return (
    <article className="border-border flex gap-4 border-l-2 pb-6 pl-5 last:pb-0">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="text-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
          <span className="text-text font-medium">{labelOf(JOURNEY_TYPES, item.type)}</span>
          {dates ? <span>· {dates}</span> : null}
          {item.verified ? (
            <span className="text-primary inline-flex items-center gap-1 font-medium">
              <BadgeCheck className="size-4" aria-hidden />
              Tasdiqlangan
            </span>
          ) : null}
        </div>
        <h3 className="text-base leading-snug font-semibold">
          {item.title}
          {item.result ? <span className="text-muted font-normal"> · {item.result}</span> : null}
        </h3>
        {meta ? <p className="text-muted text-[14px]">{meta}</p> : null}
        {item.description ? (
          <p className="text-[14px] leading-relaxed whitespace-pre-line"><LinkifiedText text={item.description} /></p>
        ) : null}
        {item.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {item.skills.map((name) => (
              <SkillChip key={name}>{name}</SkillChip>
            ))}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-start gap-1">{actions}</div> : null}
    </article>
  );
}
