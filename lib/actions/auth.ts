"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath, signInSchema, signUpSchema } from "@/lib/validation/auth";
import { fieldErrorsOf, type ActionState } from "./types";

const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "Email yoki parol noto'g'ri.",
  email_not_confirmed: "Avval emailingizni tasdiqlang. Xatni pochtangizdan qidiring.",
  user_already_exists: "Bu email bilan hisob allaqachon bor. Kirib ko'ring.",
  email_exists: "Bu email bilan hisob allaqachon bor. Kirib ko'ring.",
  weak_password: "Parol juda oddiy. Uzunroq va murakkabroq parol tanlang.",
  over_email_send_rate_limit: "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring.",
  over_request_rate_limit: "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring.",
};

function authErrorMessage(code: string | undefined) {
  return (code && AUTH_ERRORS[code]) ?? "Kirishda xatolik. Qayta urinib ko'ring.";
}

async function siteOrigin() {
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return fieldErrorsOf(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authErrorMessage(error.code) };

  redirect(safeNextPath(formData.get("next")));
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
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
  if (error) return { error: authErrorMessage(error.code) };

  // With email confirmation on, there is no session until the link is opened.
  if (!data.session) {
    return { message: "Emailingizga tasdiqlash havolasi yubordik. Havolani ochib, davom eting." };
  }
  redirect("/onboarding");
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
