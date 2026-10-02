// Uploaded files never change (each upload gets a new path), so browsers and the
// Supabase CDN may keep them a year instead of downloading them again.
export const IMMUTABLE_CACHE = "31536000";
