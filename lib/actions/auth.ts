"use server";

import { isAuthRetryableFetchError, type AuthError } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  safeNextPath,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/auth";
import { fieldErrorsOf, type ActionState } from "./types";

// Supabase Auth error codes → specific Uzbek messages.
const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "Email yoki parol noto'g'ri.",
  email_not_confirmed:
    "Bu hisob hali tasdiqlanmagan. \"Parolni unutdingizmi?\" orqali yangi parol o'rnating — hisob ham tasdiqlanadi.",
  user_already_exists: "Bu email bilan hisob allaqachon bor. Kirish sahifasidan kiring.",
  email_exists: "Bu email bilan hisob allaqachon bor. Kirish sahifasidan kiring.",
  email_address_invalid: "Bu email manzilini qabul qilib bo'lmadi. Boshqa email kiriting.",
  weak_password: "Parol juda oddiy. Uzunroq va murakkabroq parol tanlang.",
  same_password: "Yangi parol eskisidan farq qilishi kerak.",
  signup_disabled: "Hozircha ro'yxatdan o'tish yopiq.",
  over_email_send_rate_limit:
    "Hozir juda ko'p xat yuborildi. Taxminan bir soatdan keyin qayta urinib ko'ring.",
  over_request_rate_limit: "Juda ko'p urinish. Bir necha daqiqadan keyin qayta urinib ko'ring.",
  session_not_found: "Sessiya tugagan. Havolani qaytadan so'rang.",
  session_expired: "Sessiya tugagan. Havolani qaytadan so'rang.",
};

const NETWORK_ERROR = "Server bilan aloqa yo'q. Internetni tekshirib, qayta urinib ko'ring.";

function authErrorMessage(error: AuthError, fallback: string) {
  if (isAuthRetryableFetchError(error)) return NETWORK_ERROR;
  return (error.code && AUTH_ERRORS[error.code]) ?? fallback;
}

async function siteOrigin() {
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse({ email: text(formData, "email"), password: text(formData, "password") });
  if (!parsed.success) return fieldErrorsOf(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authErrorMessage(error, "Kirib bo'lmadi. Qayta urinib ko'ring.") };

  redirect(safeNextPath(formData.get("next")));
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    full_name: text(formData, "full_name"),
    email: text(formData, "email"),
    password: text(formData, "password"),
  });
  if (!parsed.success) return fieldErrorsOf(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/onboarding`,
    },
  });
  if (error) {
    return { error: authErrorMessage(error, "Hisob yaratib bo'lmadi. Qayta urinib ko'ring.") };
  }

  // Email confirmation is off, so signUp returns a session and the user is signed in.
  // Without one (confirmation switched back on) the account exists: don't invite a resubmit.
  if (!data.session) {
    return { message: "Hisob yaratildi. Emailingizdagi havolani ochib, davom eting." };
  }
  redirect("/onboarding");
}

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: text(formData, "email") });
  if (!parsed.success) return fieldErrorsOf(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  if (error) {
    return { error: authErrorMessage(error, "Xat yuborib bo'lmadi. Qayta urinib ko'ring.") };
  }

  // Same answer whether or not the account exists, so emails can't be probed.
  return {
    message:
      "Agar bu email bilan hisob bo'lsa, parolni tiklash havolasini yubordik. Pochtangizni (va Spam papkasini) tekshiring.",
  };
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: text(formData, "password"),
    confirm: text(formData, "confirm"),
  });
  if (!parsed.success) return fieldErrorsOf(parsed.error);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) {
    return { error: "Havola eskirgan. Parolni tiklash havolasini qaytadan so'rang." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: authErrorMessage(error, "Parolni o'zgartirib bo'lmadi. Qayta urinib ko'ring.") };
  }

  redirect("/home");
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
