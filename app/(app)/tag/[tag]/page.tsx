import { Suspense } from "react";
import Link from "next/link";
import { Hash } from "lucide-react";
import { FeedSkeleton } from "@/components/posts/feed-skeleton";
import { PostCard } from "@/components/posts/post-card";
import { BackLink } from "@/components/shared/back-link";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryErrorState } from "@/components/shared/retry-error-state";
import { buttonVariants } from "@/components/ui/button";
import { requireUserId } from "@/lib/auth";
import { normalizeTag } from "@/lib/hashtag";
import { getTagPosts } from "@/lib/queries/posts";
import { single } from "@/lib/url";
import { getT } from "@/lib/i18n/server";

function tagFrom(raw: string) {
  try {
    return normalizeTag(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps<"/tag/[tag]">) {
  const tag = tagFrom((await params).tag);
  const t = await getT();
  return { title: tag ? `#${tag}` : t("Teg") };
}

export default async function TagPage({ params, searchParams }: PageProps<"/tag/[tag]">) {
  const t = await getT();
  const tag = tagFrom((await params).tag);
  const before = single((await searchParams).before);
  const validBefore = before && !Number.isNaN(Date.parse(before)) ? before : undefined;
  const userId = await requireUserId();

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-6">
      <BackLink fallback="/posts" />
      {tag ? (
        <Suspense key={validBefore ?? "first"} fallback={<FeedSkeleton />}>
          <TagFeed tag={tag} userId={userId} before={validBefore} />
        </Suspense>
      ) : (
        <EmptyState icon={Hash} title={t("Bunday teg yo'q")} description={t("Teg kamida 2 ta belgidan iborat bo'lishi kerak.")} />
      )}
    </div>
  );
}

async function TagFeed({ tag, userId, before }: { tag: string; userId: string; before?: string }) {
  const t = await getT();
  let feed;
  try {
    feed = await getTagPosts(tag, userId, before);
  } catch {
    return <RetryErrorState description={t("Postlarni yuklab bo'lmadi.")} />;
  }

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold break-all lg:text-[32px]">#{tag}</h1>
        <p className="text-muted text-[14px]">{t("{n} ta post", { n: feed.total })}</p>
      </header>
      {feed.posts.length === 0 ? (
        <EmptyState icon={Hash} title={t("Bu teg bilan post yo'q")} description={t("Post yozayotganda #teg qo'shing: u shu yerda chiqadi.")} />
      ) : (
        <div className="flex flex-col gap-4">
          {feed.posts.map((post) => (
            <PostCard key={post.id} post={post} isMine={post.author.id === userId} />
          ))}
          <nav aria-label={t("Postlar sahifalari")} className="flex justify-center gap-2">
            {before ? (
              <Link href={`/tag/${encodeURIComponent(tag)}`} className={buttonVariants({ variant: "ghost" })}>
                {t("Eng yangilariga qaytish")}</Link>
            ) : null}
            {feed.nextBefore ? (
              <Link
                href={`/tag/${encodeURIComponent(tag)}?before=${encodeURIComponent(feed.nextBefore)}`}
                className={buttonVariants({ variant: "outline" })}
              >
                {t("Oldingi postlar")}</Link>
            ) : null}
          </nav>
        </div>
      )}
    </>
  );
}
