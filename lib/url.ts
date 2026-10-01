type SearchParams = Record<string, string | string[] | undefined>;

// First value of a query param, or undefined when empty.
export function single(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() ? v.trim() : undefined;
}

export function many(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean);
}

export function pageOf(value: string | string[] | undefined) {
  const n = Number(single(value));
  return Number.isInteger(n) && n > 0 ? n : 1;
}

// Builds `path?query` from current params with changes applied.
// A `null` change removes the key; arrays become repeated params.
export function hrefWith(
  path: string,
  current: SearchParams,
  changes: Record<string, string | string[] | null>,
) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...changes })) {
    for (const v of many(value ?? undefined)) next.append(key, v);
  }
  const query = next.toString();
  return query ? `${path}?${query}` : path;
}
