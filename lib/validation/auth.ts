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

// Only same-site relative paths are allowed after sign-in.
export function safeNextPath(value: unknown, fallback = "/home") {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : fallback;
}
