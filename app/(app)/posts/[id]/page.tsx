import { Suspense } from "react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { BackLink } from "@/components/shared/back-link";
import { RetryErrorState } from "@/components/shared/retry-error-state";
import { CommentForm } from "@/components/posts/comment-form";
import { CommentItem } from "@/components/posts/comment-item";
import { PostCard } from "@/components/posts/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUserId } from "@/lib/auth";
import { getComments, getPost } from "@/lib/queries/posts";

export const metadata = { title: "Post" };

export default async function PostPage({ params }: PageProps<"/posts/[id]">) {
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();

  const userId = await requireUserId();
  let post;
  try {
    post = await getPost(id, userId);
  } catch {
    return <RetryErrorState description="Postni yuklab bo'lmadi." />;
  }
  if (!post) notFound();

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4">
      <BackLink fallback="/posts" />
      <PostCard post={post} isMine={post.author.id === userId} />
      <section aria-labelledby="comments-title" className="bg-card border-border rounded-card flex flex-col gap-4 border p-5">
        <h2 id="comments-title" className="text-lg font-bold">
          Izohlar · {post.commentCount}
        </h2>
        <CommentForm postId={post.id} />
        <Suspense fallback={<CommentsSkeleton />}>
          <Comments postId={post.id} postAuthorId={post.author.id} userId={userId} />
        </Suspense>
      </section>
    </div>
  );
}

async function Comments({ postId, postAuthorId, userId }: { postId: string; postAuthorId: string; userId: string }) {
  let comments;
  try {
    comments = await getComments(postId);
  } catch {
    return <RetryErrorState description="Izohlarni yuklab bo'lmadi." />;
  }
  if (comments.length === 0) return <p className="text-muted text-[14px]">Hali izoh yo&apos;q. Birinchi bo&apos;lib yozing.</p>;

  return (
    <ul className="flex flex-col gap-4">
      {comments.map((c) => (
        <CommentItem key={c.id} comment={c} canDelete={c.author.id === userId || postAuthorId === userId} />
      ))}
    </ul>
  );
}

function CommentsSkeleton() {
  return (
    <div role="status" aria-label="Yuklanmoqda" className="flex flex-col gap-4">
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
