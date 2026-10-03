import { timingSafeEqual } from "node:crypto";

// The admin panel lives at a secret path taken from the environment (ADMIN_PATH). It is not linked
// from anywhere, and any other URL gets the normal 404. Without a valid ADMIN_PATH there is no panel.
const PATH_SHAPE = /^[A-Za-z0-9_-]{16,64}$/;

export function getAdminPath() {
  const value = process.env.ADMIN_PATH;
  return value && PATH_SHAPE.test(value) ? value : null;
}

export function isAdminPath(candidate: string) {
  const expected = getAdminPath();
  if (!expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
