import { createClient } from "@/lib/supabase/server";

export const FEED_PAGE = 20;

// Newest first. `before` (an ISO timestamp) loads the next, older page.
export async function getFeed(before?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("id, body, created_at, edited_at, author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url, headline)")
    .order("created_at", { ascending: false })
    .limit(FEED_PAGE + 1);
  if (before) query = query.lt("created_at", before);

  const { data, error } = await query;
  if (error) throw error;
  const posts = data.slice(0, FEED_PAGE).flatMap((p) => (p.author ? [{ ...p, author: p.author }] : []));
  return { posts, nextBefore: data.length > FEED_PAGE ? data[FEED_PAGE - 1].created_at : null };
}

export type FeedPost = Awaited<ReturnType<typeof getFeed>>["posts"][number];
