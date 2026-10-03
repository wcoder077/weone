import { Suspense } from "react";
import { Newspaper, Repeat2 } from "lucide-react";
import { PostCard } from "@/components/posts/post-card";
import { FeedSkeleton } from "@/components/posts/feed-skeleton";
import { PostComposer } from "@/components/posts/post-composer";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkTabs } from "@/components/shared/link-tabs";
import { RetryErrorState } from "@/components/shared/retry-error-state";
import { requireUserId } from "@/lib/auth";
import { getRecommendedFeed, getUserPosts } from "@/lib/queries/posts";
import { single } from "@/lib/url";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Postlar") };
}

const TABS = [
  { value: "posts", label: "Postlarim", href: "/posts" },
  { value: "reposts", label: "Repostlarim", href: "/posts?tab=reposts" },
  { value: "recommended", label: "Tavsiya", href: "/posts?tab=recommended" },
] as const;
type Tab = (typeof TABS)[number]["value"];

// What the viewer wrote or reposted comes first; other people's posts are a tab of their own.
export default async function PostsPage({ searchParams }: PageProps<"/posts">) {
  const t = await getT();
  const requested = single((await searchParams).tab);
  const tab: Tab = TABS.find((item) => item.value === requested)?.value ?? "posts";
  const userId = await requireUserId();

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-6">
      <h1 className="text-2xl font-bold lg:text-[32px]">{t("Postlar")}</h1>
      <section aria-label={t("Yangi post")} className="bg-card border-border rounded-card border p-5">
        <PostComposer userId={userId} />
      </section>
      <LinkTabs label="Postlar bo'limlari" active={tab} tabs={[...TABS]} />
      <Suspense key={tab} fallback={<FeedSkeleton />}>
        <Feed userId={userId} tab={tab} />
      </Suspense>
    </div>
  );
}

async function Feed({ userId, tab }: { userId: string; tab: Tab }) {
  const t = await getT();
  let posts;
  try {
    posts = tab === "recommended" ? (await getRecommendedFeed(userId)).posts : await getUserPosts(userId, userId, tab);
  } catch {
    return <RetryErrorState description={t("Postlarni yuklab bo'lmadi.")} />;
  }

  if (posts.length === 0) {
    return tab === "reposts" ? (
      <EmptyState
        icon={Repeat2}
        title={t("Hali repostlar yo'q")}
        description={t("Yoqqan postni «…» menyusidan repost qiling.")}
      />
    ) : (
      <EmptyState
        icon={Newspaper}
        title={t("Hali postlar yo'q")}
        description={
          tab === "posts"
            ? t("Nima ustida ishlayotganingizni yozing.")
            : t("Birinchi bo'lib yozing: nima ustida ishlayapsiz yoki kimni qidiryapsiz?")
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} isMine={post.author.id === userId} />
      ))}
    </div>
  );
}
