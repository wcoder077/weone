import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Email manzilini to'g'ri kiriting"),
  password: z.string().min(1, "Parolni kiriting"),
});

export const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Ismingizni kiriting").max(80, "Juda uzun"),
  email: z.email("Email manzilini to'g'ri kiriting"),
  password: z.string().min(8, "Kamida 8 ta belgi").max(72, "Juda uzun"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Email manzilini to'g'ri kiriting"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Kamida 8 ta belgi").max(72, "Juda uzun"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Parollar bir xil emas",
  });

// Only same-site paths are allowed after sign-in. Parsing (not prefix checks)
// catches browser normalisation tricks: "/\evil.com", "/\t/evil.com" and
// "/.//evil.com" all resolve to another host or a protocol-relative "//" path.
const PLACEHOLDER_ORIGIN = "http://same-site.invalid";

export function safeNextPath(value: unknown, fallback = "/home") {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  let url: URL;
  try {
    url = new URL(value, PLACEHOLDER_ORIGIN);
  } catch {
    return fallback;
  }
  const path = `${url.pathname}${url.search}${url.hash}`;
  return url.origin === PLACEHOLDER_ORIGIN && !path.startsWith("//") ? path : fallback;
}
