import { POST_MEDIA_BUCKET, type PostMediaKind } from "@/lib/post-media";
import { createClient } from "@/lib/supabase/server";

export const FEED_PAGE = 20;
// Random older posts are picked from this many of the newest ones.
const RANDOM_POOL = 100;

const AUTHOR = "author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url, headline)";
const POST_FIELDS = `id, body, created_at, edited_at, media_path, media_type, media_name, repost_of, like_count, comment_count, view_count, repost_count, ${AUTHOR}`;

type Supabase = Awaited<ReturnType<typeof createClient>>;
type PostRow = {
  id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  media_path: string | null;
  media_type: string | null;
  media_name: string | null;
  repost_of: string | null;
  like_count: number;
  comment_count: number;
  view_count: number;
  repost_count: number;
  author: { id: string; username: string; full_name: string; avatar_url: string | null; headline: string | null } | null;
};

export type PostMedia = { url: string; kind: PostMediaKind; name: string };
export type PostAuthor = NonNullable<PostRow["author"]>;

// The original shown inside a repost: content only, no actions.
export type EmbeddedPost = {
  id: string;
  body: string;
  createdAt: string;
  author: PostAuthor;
  media: PostMedia | null;
};

export type FeedPost = {
  id: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  author: PostAuthor;
  media: PostMedia | null;
  original: EmbeddedPost | null;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  repostCount: number;
  liked: boolean;
};

// Public bucket (UUID paths): a stable URL per file, so browsers and the CDN cache it.
function mediaUrls(supabase: Supabase, paths: string[]) {
  const bucket = supabase.storage.from(POST_MEDIA_BUCKET);
  return new Map(paths.map((path) => [path, bucket.getPublicUrl(path).data.publicUrl]));
}

// Adds media links, the reposted originals and "did I like it" to raw rows.
async function hydrate(supabase: Supabase, rows: PostRow[], userId: string): Promise<FeedPost[]> {
  const originalIds = [...new Set(rows.flatMap((r) => (r.repost_of ? [r.repost_of] : [])))];
  const [originalsRes, likesRes] = await Promise.all([
    originalIds.length ? supabase.from("posts").select(POST_FIELDS).in("id", originalIds) : { data: [], error: null },
    rows.length
      ? supabase.from("post_likes").select("post_id").eq("user_id", userId).in("post_id", rows.map((r) => r.id))
      : { data: [], error: null },
  ]);
  if (originalsRes.error) throw originalsRes.error;
  if (likesRes.error) throw likesRes.error;
  const originals = new Map((originalsRes.data ?? []).map((o) => [o.id, o]));
  const liked = new Set((likesRes.data ?? []).map((l) => l.post_id));

  const paths = [...rows, ...originals.values()].flatMap((p) => (p.media_path ? [p.media_path] : []));
  const urls = mediaUrls(supabase, paths);

  function mediaOf(p: PostRow): PostMedia | null {
    const kind = p.media_type === "image" || p.media_type === "video" ? p.media_type : null;
    const url = p.media_path ? urls.get(p.media_path) : undefined;
    return url && kind && p.media_name ? { url, kind, name: p.media_name } : null;
  }

  return rows.flatMap((r) => {
    if (!r.author) return [];
    const original = r.repost_of ? originals.get(r.repost_of) : undefined;
    return [
      {
        id: r.id,
        body: r.body,
        createdAt: r.created_at,
        editedAt: r.edited_at,
        author: r.author,
        media: mediaOf(r),
        original: original?.author
          ? { id: original.id, body: original.body, createdAt: original.created_at, author: original.author, media: mediaOf(original) }
          : null,
        likeCount: r.like_count,
        commentCount: r.comment_count,
        viewCount: r.view_count,
        repostCount: r.repost_count,
        liked: liked.has(r.id),
      },
    ];
  });
}

// Newest first. `before` (an ISO timestamp) loads the next, older page.
export async function getFeed(userId: string, before?: string) {
  const supabase = await createClient();
  let query = supabase.from("posts").select(POST_FIELDS).order("created_at", { ascending: false }).limit(FEED_PAGE + 1);
  if (before) query = query.lt("created_at", before);

  const { data, error } = await query;
  if (error) throw error;
  const page = data.slice(0, FEED_PAGE);
  return {
    posts: await hydrate(supabase, page, userId),
    nextBefore: data.length > FEED_PAGE ? data[FEED_PAGE - 1].created_at : null,
  };
}

function shuffle<T>(items: T[]) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Home feed. New posts (written after `seenAt`, the newest post the viewer was
// last shown) come first, newest first. With nothing new, the viewer gets a
// random mix of recent posts instead of the same page again.
export async function getHomeFeed(userId: string, seenAt?: string) {
  const feed = await getFeed(userId);
  const newest = feed.posts[0]?.createdAt;
  if (!seenAt || !newest || Date.parse(newest) > Date.parse(seenAt)) return { ...feed, shuffled: false, newest };

  const supabase = await createClient();
  const { data: pool, error: poolError } = await supabase
    .from("posts")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(RANDOM_POOL);
  if (poolError) throw poolError;
  const ids = shuffle(pool.map((p) => p.id)).slice(0, FEED_PAGE);

  const { data, error } = await supabase.from("posts").select(POST_FIELDS).in("id", ids);
  if (error) throw error;
  const order = new Map(ids.map((id, i) => [id, i]));
  const rows = data.toSorted((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return { posts: await hydrate(supabase, rows, userId), nextBefore: null, shuffled: true, newest };
}

export const PROFILE_POSTS_LIMIT = 50;

// One person's own posts or their reposts, newest first (profile "Postlar" / "Repostlar" tabs).
export async function getUserPosts(authorId: string, viewerId: string, kind: "posts" | "reposts") {
  const supabase = await createClient();
  let query = supabase.from("posts").select(POST_FIELDS).eq("author_id", authorId);
  query = kind === "posts" ? query.is("repost_of", null) : query.not("repost_of", "is", null);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(PROFILE_POSTS_LIMIT);
  if (error) throw error;
  return hydrate(supabase, data, viewerId);
}

// Null when the post does not exist (or was deleted).
export async function getPost(postId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select(POST_FIELDS).eq("id", postId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return (await hydrate(supabase, [data], userId))[0] ?? null;
}

export type PostComment = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; username: string; full_name: string; avatar_url: string | null };
};

// Oldest first, like a conversation.
export async function getComments(postId: string): Promise<PostComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_comments")
    .select("id, body, created_at, author_id")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  if (data.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .in("id", [...new Set(data.map((c) => c.author_id))]);
  if (profilesError) throw profilesError;
  const byId = new Map(profiles.map((p) => [p.id, p]));

  return data.flatMap((c) => {
    const author = byId.get(c.author_id);
    return author ? [{ id: c.id, body: c.body, createdAt: c.created_at, author }] : [];
  });
}
