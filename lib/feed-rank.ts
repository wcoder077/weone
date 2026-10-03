// Picks which posts the "Tavsiya" tab shows. Pure function, so the rules are easy to read and test.
//
// - About 70% of the slots go to fresh posts (written in the last 2 days), the rest to older ones.
// - Inside each group, posts with more likes / comments / views and newer posts come first,
//   with a little randomness so a refresh does not show exactly the same page.
// - A person never takes more than 2 slots in one page, so nobody floods the feed.
// - Posts the viewer has not seen yet (newer than `seenAt`) get an extra push.

export const FRESH_HOURS = 48;
export const FRESH_SHARE = 0.7;
export const MAX_PER_AUTHOR = 2;
const HALF_LIFE_HOURS = 24;
const UNSEEN_BOOST = 2;

export type Rankable = {
  id: string;
  created_at: string;
  author: { id: string } | null;
  like_count: number;
  comment_count: number;
  view_count: number;
};

function score(post: Rankable, now: number, seenAt: number | undefined, random: () => number) {
  const ageHours = Math.max(0, (now - Date.parse(post.created_at)) / 3_600_000);
  const engagement = 1 + post.like_count * 3 + post.comment_count * 4 + Math.min(post.view_count, 200) * 0.1;
  const unseen = seenAt === undefined || Date.parse(post.created_at) > seenAt ? UNSEEN_BOOST : 1;
  const jitter = 0.7 + random() * 0.6;
  return engagement * Math.pow(0.5, ageHours / HALF_LIFE_HOURS) * unseen * jitter;
}

export function rankRecommended<T extends Rankable>(
  posts: T[],
  options: { limit: number; seenAt?: string; now?: number; random?: () => number },
): T[] {
  const now = options.now ?? Date.now();
  const random = options.random ?? Math.random;
  const seenAt = options.seenAt ? Date.parse(options.seenAt) : undefined;

  const byScore = (group: T[]) =>
    group
      .map((post) => ({ post, value: score(post, now, seenAt, random) }))
      .toSorted((a, b) => b.value - a.value)
      .map((entry) => entry.post);

  const isFresh = (post: T) => now - Date.parse(post.created_at) <= FRESH_HOURS * 3_600_000;
  const fresh = byScore(posts.filter(isFresh));
  const older = byScore(posts.filter((post) => !isFresh(post)));

  const perAuthor = new Map<string, number>();
  const takeFrom = (group: T[]) => {
    const index = group.findIndex((post) => (perAuthor.get(post.author?.id ?? "") ?? 0) < MAX_PER_AUTHOR);
    if (index === -1) return null;
    const [post] = group.splice(index, 1);
    perAuthor.set(post.author?.id ?? "", (perAuthor.get(post.author?.id ?? "") ?? 0) + 1);
    return post;
  };

  const picked: T[] = [];
  while (picked.length < options.limit) {
    const wantFresh = random() < FRESH_SHARE;
    const post = (wantFresh ? takeFrom(fresh) ?? takeFrom(older) : takeFrom(older) ?? takeFrom(fresh));
    if (!post) break;
    picked.push(post);
  }
  return picked;
}
