// Same rules as the database trigger (migration 26): at least one letter, 2-50 characters, lower-cased.
export function normalizeTag(raw: string) {
  const tag = raw.toLowerCase();
  if (tag.length < 2 || tag.length > 50 || /^[0-9_]+$/.test(tag)) return null;
  return tag;
}

export function hashtagHref(raw: string) {
  const tag = normalizeTag(raw);
  return tag ? `/tag/${encodeURIComponent(tag)}` : null;
}
