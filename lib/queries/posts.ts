import { POST_MEDIA_BUCKET, type PostMediaKind } from "@/lib/post-media";
import { rankRecommended } from "@/lib/feed-rank";
import { createClient } from "@/lib/supabase/server";

export const FEED_PAGE = 20;
// The recommended tab ranks this many of the newest posts.
const RANK_POOL = 100;

const AUTHOR = "author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url, headline)";
const POST_FIELDS = `id, body, created_at, edited_at, media_path, media_type, media_name, repost_of, like_count, comment_count, view_count, repost_count, post_media(position, path, name), ${AUTHOR}`;

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
  post_media: { position: number; path: string; name: string }[];
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
  // More photos of the same post (a carousel), after `media`.
  moreMedia: PostMedia[];
};

export type FeedPost = {
  id: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  author: PostAuthor;
  media: PostMedia | null;
  moreMedia: PostMedia[];
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

  const paths = [...rows, ...originals.values()].flatMap((p) => [...(p.media_path ? [p.media_path] : []), ...p.post_media.map((m) => m.path)]);
  const urls = mediaUrls(supabase, paths);

  function mediaOf(p: PostRow): PostMedia | null {
    const kind = p.media_type === "image" || p.media_type === "video" ? p.media_type : null;
    const url = p.media_path ? urls.get(p.media_path) : undefined;
    return url && kind && p.media_name ? { url, kind, name: p.media_name } : null;
  }

  function moreMediaOf(p: PostRow): PostMedia[] {
    return p.post_media
      .toSorted((a, b) => a.position - b.position)
      .flatMap((m) => {
        const url = urls.get(m.path);
        return url ? [{ url, kind: "image" as const, name: m.name }] : [];
      });
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
        moreMedia: moreMediaOf(r),
        original: original?.author
          ? {
              id: original.id,
              body: original.body,
              createdAt: original.created_at,
              author: original.author,
              media: mediaOf(original),
              moreMedia: moreMediaOf(original),
            }
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

// Home "Tavsiya" tab: the newest posts, picked and ordered by lib/feed-rank.ts.
// `newest` is what the feed marker remembers as "seen".
// Ranking only needs a few small columns of the newest posts; the full rows (text, author, photos)
// are loaded for the 20 that were picked. Loading all 100 in full on every visit wasted most of the traffic.
export async function getRecommendedFeed(userId: string, seenAt?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, created_at, author_id, like_count, comment_count, view_count")
    .order("created_at", { ascending: false })
    .limit(RANK_POOL);
  if (error) throw error;

  const picked = rankRecommended(
    data.map((row) => ({ ...row, author: { id: row.author_id } })),
    { limit: FEED_PAGE, seenAt },
  );
  if (picked.length === 0) return { posts: [], newest: data[0]?.created_at };

  const { data: rows, error: rowsError } = await supabase
    .from("posts")
    .select(POST_FIELDS)
    .in("id", picked.map((post) => post.id));
  if (rowsError) throw rowsError;

  const order = new Map(picked.map((post, index) => [post.id, index]));
  const ordered = rows.toSorted((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return { posts: await hydrate(supabase, ordered, userId), newest: data[0]?.created_at };
}

// Home "Do'stlar" tab: posts of the people the viewer is connected with, newest first.
const FRIENDS_LIMIT = 150;
export async function getFriendsFeed(userId: string, before?: string) {
  const supabase = await createClient();
  const { data: links, error: linksError } = await supabase
    .from("connections")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .limit(FRIENDS_LIMIT);
  if (linksError) throw linksError;
  const friendIds = links.map((c) => (c.requester_id === userId ? c.addressee_id : c.requester_id));
  if (friendIds.length === 0) return { posts: [], nextBefore: null, hasFriends: false };

  let query = supabase
    .from("posts")
    .select(POST_FIELDS)
    .in("author_id", friendIds)
    .order("created_at", { ascending: false })
    .limit(FEED_PAGE + 1);
  if (before) query = query.lt("created_at", before);
  const { data, error } = await query;
  if (error) throw error;
  const page = data.slice(0, FEED_PAGE);
  return {
    posts: await hydrate(supabase, page, userId),
    nextBefore: data.length > FEED_PAGE ? page[page.length - 1].created_at : null,
    hasFriends: true,
  };
}

// Posts that carry a hashtag, newest first. `tag` must already be normalized (lib/hashtag.ts).
export async function getTagPosts(tag: string, userId: string, before?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("post_tags")
    .select("post_id, created_at", { count: "exact" })
    .eq("tag", tag)
    .order("created_at", { ascending: false })
    .limit(FEED_PAGE + 1);
  if (before) query = query.lt("created_at", before);

  const { data: refs, error, count } = await query;
  if (error) throw error;
  const page = refs.slice(0, FEED_PAGE);
  if (page.length === 0) return { posts: [], nextBefore: null, total: count ?? 0 };

  const { data, error: postsError } = await supabase.from("posts").select(POST_FIELDS).in("id", page.map((r) => r.post_id));
  if (postsError) throw postsError;
  const order = new Map(page.map((r, i) => [r.post_id, i]));
  const rows = data.toSorted((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return {
    posts: await hydrate(supabase, rows, userId),
    nextBefore: refs.length > FEED_PAGE ? page[page.length - 1].created_at : null,
    total: count ?? 0,
  };
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
  parentId: string | null;
  author: { id: string; username: string; full_name: string; avatar_url: string | null };
};

// Oldest first, like a conversation.
export async function getComments(postId: string): Promise<PostComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_comments")
    .select("id, body, created_at, author_id, parent_id")
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
    return author ? [{ id: c.id, body: c.body, createdAt: c.created_at, parentId: c.parent_id, author }] : [];
  });
}
