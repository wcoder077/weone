"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { LANGS, LANG_COOKIE } from "@/lib/i18n/core";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Works signed in or out: the choice lives in a cookie, not on the profile.
export async function setLanguage(lang: string) {
  const parsed = z.enum(LANGS).safeParse(lang);
  if (!parsed.success) return;
  (await cookies()).set(LANG_COOKIE, parsed.data, { path: "/", maxAge: ONE_YEAR_SECONDS, sameSite: "lax" });
  refresh();
}
