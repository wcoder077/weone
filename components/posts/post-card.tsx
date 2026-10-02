import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { formatCount, formatRelative } from "@/lib/format";
import type { EmbeddedPost, FeedPost, PostAuthor } from "@/lib/queries/posts";
import { UserAvatar } from "@/components/shared/user-avatar";
import { LikeButton } from "./like-button";
import { PostBody } from "./post-body";
import { PostActions } from "./post-actions";
import { PostMediaView } from "./post-media-view";
import { PostMoreMenu } from "./post-more-menu";
import { PostViews } from "./post-views";
import { getT } from "@/lib/i18n/server";

// `expanded` opens long posts fully (the post's own page).
export async function PostCard({ post, isMine, expanded = false }: { post: FeedPost; isMine: boolean; expanded?: boolean }) {
  const t = await getT();
  return (
    <article className="bg-card border-border rounded-card flex flex-col gap-3 border p-5">
      <header className="flex items-start gap-3">
        <AuthorLink author={post.author} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Link href={`/u/${post.author.username}`} className="truncate font-semibold hover:underline">
            {post.author.full_name}
          </Link>
          {post.author.headline ? <p className="text-muted truncate text-[13px]">{post.author.headline}</p> : null}
          <p className="text-muted text-[12px]">
            <time dateTime={post.createdAt}>{formatRelative(post.createdAt, t)}</time>
            {post.editedAt ? t(" · tahrirlangan") : null}
          </p>
        </div>
        {isMine ? <PostActions postId={post.id} body={post.body} /> : null}
      </header>

      {post.body ? <PostBody body={post.body} expanded={expanded} /> : null}
      {post.media ? <PostMediaView media={post.media} /> : null}
      {post.original ? <EmbeddedOriginal original={post.original} /> : null}

      <footer className="-mx-2 -mb-2 flex items-center">
        <PostViews postId={post.id} initialCount={post.viewCount} track={!isMine} />
        <LikeButton postId={post.id} initialLiked={post.liked} initialCount={post.likeCount} />
        <Link
          href={`/posts/${post.id}`}
          aria-label={t("Izohlar, {commentCount} ta", { commentCount: post.commentCount })}
          className="text-muted hover:text-text hover:bg-surface focus-visible:ring-ring/50 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[14px] transition-colors duration-150 outline-none focus-visible:ring-3"
        >
          <MessageCircle className="size-5" aria-hidden />
          <span className="tabular-nums">{formatCount(post.commentCount)}</span>
        </Link>
        <span className="ml-auto">
          <PostMoreMenu postId={post.id} />
        </span>
      </footer>
    </article>
  );
}

function AuthorLink({ author }: { author: PostAuthor }) {
  return (
    <Link href={`/u/${author.username}`} className="shrink-0" aria-label={author.full_name}>
      <UserAvatar name={author.full_name} url={author.avatar_url} userId={author.id} />
    </Link>
  );
}

// The post that was reposted, shown inside the repost.
async function EmbeddedOriginal({ original }: { original: EmbeddedPost }) {
  const t = await getT();
  return (
    <div className="border-border flex flex-col gap-2 rounded-2xl border p-3">
      <Link href={`/posts/${original.id}`} className="flex items-center gap-2 hover:underline">
        <UserAvatar name={original.author.full_name} url={original.author.avatar_url} size="sm" />
        <span className="truncate text-[14px] font-semibold">{original.author.full_name}</span>
        <time dateTime={original.createdAt} className="text-muted shrink-0 text-[12px]">
          {formatRelative(original.createdAt, t)}
        </time>
      </Link>
      {original.body ? <PostBody body={original.body} small /> : null}
      {original.media ? <PostMediaView media={original.media} /> : null}
    </div>
  );
}
