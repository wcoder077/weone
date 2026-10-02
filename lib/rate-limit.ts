// The database refuses inserts past a per-user limit (migration 24) with this message.
const RATE_LIMITED_CODE = "rate_limited";
const RATE_LIMITED_TEXT = "Juda tez. Biroz kutib, qayta urinib ko'ring.";

// The user-facing error for a failed insert: the rate-limit text (or `limitText`), or `fallback`.
export function insertError(error: { message: string }, fallback: string, limitText = RATE_LIMITED_TEXT) {
  return error.message === RATE_LIMITED_CODE ? limitText : fallback;
}

// Posts have a tight limit (see public.rate_limits), so say so plainly.
export const POST_LIMIT_TEXT = "Post joylash limiti tugadi. Birozdan keyin qayta urinib ko'ring.";
