import { Suspense } from "react";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { PostCard } from "@/components/posts/post-card";
import { PostComposer } from "@/components/posts/post-composer";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryErrorState } from "@/components/shared/retry-error-state";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUserId } from "@/lib/auth";
import { getFeed } from "@/lib/queries/posts";
import { single } from "@/lib/url";

export const metadata = { title: "Postlar" };

export default async function PostsPage({ searchParams }: PageProps<"/posts">) {
  const before = single((await searchParams).before);
  const validBefore = before && !Number.isNaN(Date.parse(before)) ? before : undefined;
  const userId = await requireUserId();

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-6">
      <h1 className="text-2xl font-bold lg:text-[32px]">Postlar</h1>
      {validBefore ? null : (
        <section aria-label="Yangi post" className="bg-card border-border rounded-card border p-5">
          <PostComposer userId={userId} />
        </section>
      )}
      <Suspense key={validBefore ?? "first"} fallback={<FeedSkeleton />}>
        <Feed userId={userId} before={validBefore} />
      </Suspense>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div role="status" aria-label="Yuklanmoqda" className="flex flex-col gap-4">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="bg-card border-border rounded-card flex flex-col gap-3 border p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ))}
    </div>
  );
}

async function Feed({ userId, before }: { userId: string; before?: string }) {
  let feed;
  try {
    feed = await getFeed(userId, before);
  } catch {
    return <RetryErrorState description="Postlarni yuklab bo'lmadi." />;
  }

  if (feed.posts.length === 0) {
    return (
      <EmptyState
        icon={Newspaper}
        title={before ? "Boshqa post yo'q" : "Hali postlar yo'q"}
        description="Birinchi bo'lib yozing: nima ustida ishlayapsiz yoki kimni qidiryapsiz?"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {feed.posts.map((post) => (
        <PostCard key={post.id} post={post} isMine={post.author.id === userId} />
      ))}
      <nav aria-label="Postlar sahifalari" className="flex justify-center gap-2">
        {before ? (
          <Link href="/posts" className={buttonVariants({ variant: "ghost" })}>
            Eng yangilariga qaytish
          </Link>
        ) : null}
        {feed.nextBefore ? (
          <Link href={`/posts?before=${encodeURIComponent(feed.nextBefore)}`} className={buttonVariants({ variant: "outline" })}>
            Oldingi postlar
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
