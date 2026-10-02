import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import type { getPeopleForYou } from "@/lib/queries/home";
import type { getRelationships } from "@/lib/queries/social";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ConnectButton } from "@/components/social/connect-button";
import { getT } from "@/lib/i18n/server";

type Pick = Awaited<ReturnType<typeof getPeopleForYou>>[number];
type Relationships = Awaited<ReturnType<typeof getRelationships>>;

// A swipeable row of small person cards placed between posts in the home feed.
export async function PeopleCarousel({ meId, picks, relationships }: { meId: string; picks: Pick[]; relationships: Relationships }) {
  const t = await getT();
  if (picks.length === 0) return null;
  return (
    <section aria-labelledby="people-for-you" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 id="people-for-you" className="text-lg font-semibold whitespace-nowrap">
          {t("Siz uchun maqsaddoshlar")}</h2>
        <Link href="/find" className="text-muted hover:text-text inline-flex min-h-11 items-center gap-1 text-[14px] whitespace-nowrap">
          {t("Ko'proq")}<ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
      {/* Small cards in a swipeable row; the scrollbar is hidden (the row still scrolls). */}
      <ul className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
        {picks.map(({ person, reasons }) => (
          <li
            key={person.id}
            className="bg-card border-border flex w-[160px] shrink-0 snap-start flex-col items-center gap-1 rounded-[20px] border px-3 pt-4 pb-3 text-center"
          >
            <Link href={`/u/${person.username}`} className="flex w-full min-w-0 flex-col items-center gap-2" aria-label={person.full_name}>
              <UserAvatar name={person.full_name} url={person.avatar_url} size="lg" userId={person.id} />
              <span className="w-full truncate text-[14px] font-semibold">{person.full_name}</span>
            </Link>
            <span className="text-muted h-4 w-full truncate text-[12px] leading-4">{person.headline ?? person.city ?? ""}</span>
            <span className="text-muted mb-2 flex h-4 w-full items-center justify-center gap-1 text-[12px] leading-4">
              {reasons[0] ? (
                <>
                  <Check className="text-primary size-3 shrink-0" aria-hidden />
                  <span className="truncate">{reasons[0]}</span>
                  {reasons.length > 1 ? <span className="shrink-0">+{reasons.length - 1}</span> : null}
                </>
              ) : null}
            </span>
            <ConnectButton
              meId={meId}
              userId={person.id}
              name={person.full_name}
              connection={relationships.connection(person.id)}
              className="mt-auto w-full px-3 text-[14px]"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
