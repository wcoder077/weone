import { cache } from "react";
import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, isLang, translate, type TFunction } from "./core";
import { dictionaries } from "./dictionaries";

// The visitor's language from the cookie (Uzbek when none), once per request.
export const getLang = cache(async () => {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
});

// Translator for Server Components, metadata and Server Actions.
export async function getT(): Promise<TFunction> {
  const lang = await getLang();
  const dict = dictionaries[lang];
  return (text, vars) => translate(lang, dict, text, vars);
}
