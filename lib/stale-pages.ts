// Pages whose cached copy (client router cache) is known to be out of date:
// something new arrived over Realtime while the user was elsewhere.
const stale = new Set<string>();

export function markStale(path: string) {
  stale.add(path);
}

// True once per mark: the caller then reloads the page data.
export function takeStale(path: string) {
  return stale.delete(path);
}
