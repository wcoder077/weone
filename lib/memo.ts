const MAX_ENTRIES = 2000;
const store = new Map<string, { value: unknown; at: number }>();

// Keeps a per-user result in this server instance's memory for `ttlMs`, so heavy
// reads (recommendations) are not recomputed on every page load. The key must
// include the user id: the value was read with that user's permissions.
export async function memoize<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await load();
  if (store.size >= MAX_ENTRIES) store.clear();
  store.set(key, { value, at: Date.now() });
  return value;
}
