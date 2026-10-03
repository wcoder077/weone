import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// After the captcha is solved, the admin gets a signed cookie that is valid for 30 minutes,
// only for their own account and only sent to the hidden admin path.
const GATE_COOKIE = "admin_gate";
const GATE_MINUTES = 30;

function secretKey() {
  const key = process.env.ADMIN_GATE_SECRET;
  return key && key.length >= 32 ? key : null;
}

function sign(payload: string, adminPath: string, key: string) {
  return createHmac("sha256", key).update(`${payload}.${adminPath}`).digest("base64url");
}

export async function openGate(userId: string, adminPath: string) {
  const key = secretKey();
  if (!key) return false;
  const expires = Math.floor(Date.now() / 1000) + GATE_MINUTES * 60;
  const payload = `${userId}.${expires}`;
  (await cookies()).set(GATE_COOKIE, `${payload}.${sign(payload, adminPath, key)}`, {
    path: `/${adminPath}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: GATE_MINUTES * 60,
  });
  return true;
}

export async function closeGate(adminPath: string) {
  (await cookies()).delete({ name: GATE_COOKIE, path: `/${adminPath}` });
}

export async function hasValidGate(userId: string, adminPath: string) {
  const key = secretKey();
  const token = (await cookies()).get(GATE_COOKIE)?.value;
  if (!key || !token) return false;
  const [id, expires, signature] = token.split(".");
  if (!id || !expires || !signature || id !== userId || Number(expires) < Date.now() / 1000) return false;
  const expected = Buffer.from(sign(`${id}.${expires}`, adminPath, key));
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
