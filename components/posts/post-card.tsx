import Link from "next/link";
import { formatRelative } from "@/lib/format";
import type { FeedPost } from "@/lib/queries/posts";
import { UserAvatar } from "@/components/shared/user-avatar";
import { PostActions } from "./post-actions";

// User text is rendered as a plain React text node (escaped, never HTML);
// whitespace-pre-wrap keeps the author's line breaks.
export function PostCard({ post, isMine }: { post: FeedPost; isMine: boolean }) {
  return (
    <article className="bg-card border-border rounded-card flex flex-col gap-3 border p-5">
      <header className="flex items-start gap-3">
        <Link href={`/u/${post.author.username}`} className="shrink-0" aria-label={post.author.full_name}>
          <UserAvatar name={post.author.full_name} url={post.author.avatar_url} />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <Link href={`/u/${post.author.username}`} className="truncate font-semibold hover:underline">
            {post.author.full_name}
          </Link>
          {post.author.headline ? <p className="text-muted truncate text-[13px]">{post.author.headline}</p> : null}
          <p className="text-muted text-[12px]">
            <time dateTime={post.created_at}>{formatRelative(post.created_at)}</time>
            {post.edited_at ? " · tahrirlangan" : null}
          </p>
        </div>
        {isMine ? <PostActions postId={post.id} body={post.body} /> : null}
      </header>
      <p className="max-w-[65ch] text-base leading-[1.6] break-words whitespace-pre-wrap">{post.body}</p>
    </article>
  );
}
