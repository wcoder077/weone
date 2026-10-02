// The database refuses inserts past a per-user limit (migration 24) with this message.
const RATE_LIMITED_CODE = "rate_limited";
const RATE_LIMITED_TEXT = "Juda tez. Biroz kutib, qayta urinib ko'ring.";

// The user-facing error for a failed insert: the rate-limit text, or `fallback`.
export function insertError(error: { message: string }, fallback: string) {
  return error.message === RATE_LIMITED_CODE ? RATE_LIMITED_TEXT : fallback;
}
