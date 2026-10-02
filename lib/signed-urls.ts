import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const SIGN_SECONDS = 60 * 60;
// A link is reused while it has at least 15 minutes left. The same URL on every
// render lets the browser cache the file instead of downloading it again.
const REUSE_MS = 45 * 60 * 1000;
const MAX_ENTRIES = 5000;
const cache = new Map<string, { url: string; signedAt: number }>();

// Signed links for private files, shared within this server instance. Callers pass
// only paths they just read through RLS (rows the viewer may see), so reusing a
// link never reveals a file the viewer could not already open.
export async function signedUrls(supabase: Supabase, bucket: string, paths: string[]) {
  const now = Date.now();
  const urls = new Map<string, string>();
  const missing: string[] = [];
  for (const path of new Set(paths)) {
    const hit = cache.get(`${bucket}/${path}`);
    if (hit && now - hit.signedAt < REUSE_MS) urls.set(path, hit.url);
    else missing.push(path);
  }
  if (missing.length === 0) return urls;

  const { data } = await supabase.storage.from(bucket).createSignedUrls(missing, SIGN_SECONDS);
  if (cache.size > MAX_ENTRIES) cache.clear();
  for (const s of data ?? []) {
    if (!s.path || !s.signedUrl) continue;
    urls.set(s.path, s.signedUrl);
    cache.set(`${bucket}/${s.path}`, { url: s.signedUrl, signedAt: now });
  }
  return urls;
}
