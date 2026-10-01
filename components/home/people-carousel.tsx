import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { getPeopleForYou } from "@/lib/queries/home";
import type { getRelationships } from "@/lib/queries/social";
import { InlineReasons } from "@/components/shared/person-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ConnectButton } from "@/components/social/connect-button";

type Pick = Awaited<ReturnType<typeof getPeopleForYou>>[number];
type Relationships = Awaited<ReturnType<typeof getRelationships>>;

// A swipeable row of small person cards placed between posts in the home feed.
export function PeopleCarousel({ meId, picks, relationships }: { meId: string; picks: Pick[]; relationships: Relationships }) {
  if (picks.length === 0) return null;
  return (
    <section aria-labelledby="people-for-you" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 id="people-for-you" className="text-lg font-semibold whitespace-nowrap">
          Siz uchun maqsaddoshlar
        </h2>
        <Link href="/find" className="text-muted hover:text-text inline-flex min-h-11 items-center gap-1 text-[14px] whitespace-nowrap">
          Ko&apos;proq
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {picks.map(({ person, reasons }) => (
          <li
            key={person.id}
            className="bg-card border-border rounded-card flex w-[220px] shrink-0 snap-start flex-col items-center gap-2 border p-4 text-center"
          >
            <Link href={`/u/${person.username}`} className="flex min-w-0 flex-col items-center gap-2" aria-label={person.full_name}>
              <UserAvatar name={person.full_name} url={person.avatar_url} size="lg" userId={person.id} />
              <span className="w-full truncate font-semibold">{person.full_name}</span>
            </Link>
            <span className="text-muted line-clamp-1 min-h-5 w-full text-[13px]">{person.headline ?? person.city ?? ""}</span>
            <div className="flex min-h-10 justify-center">
              <InlineReasons reasons={reasons.slice(0, 2)} />
            </div>
            <ConnectButton
              meId={meId}
              userId={person.id}
              name={person.full_name}
              connection={relationships.connection(person.id)}
              className="mt-auto w-full"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
