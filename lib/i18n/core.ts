// Languages. The text written in the code is Uzbek and doubles as the translation key:
// t("Saqlash") -> "Save" / "Сохранить". A missing translation falls back to the Uzbek text,
// so a forgotten string never breaks a page. Values with {name} placeholders are filled from
// `vars`; {n|post|posts} / {n|пост|поста|постов} pick a plural form.

export const LANGS = ["uz", "en", "ru"] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = "uz";
export const LANG_COOKIE = "lang";

// Shown in their own language, on purpose: a person must find theirs even in a language they cannot read.
export const LANG_NAMES: Record<Lang, string> = { uz: "O'zbekcha", en: "English", ru: "Русский" };
export const LANG_LOCALES: Record<Lang, string> = { uz: "uz-UZ", en: "en-US", ru: "ru-RU" };

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

export type Dictionary = Record<string, string>;
export type Vars = Record<string, string | number>;
export type TFunction = (text: string, vars?: Vars) => string;

// Keys with placeholders also match texts that were already filled in (server action errors:
// "Ko'pi bilan 2000 ta belgi" matches the key "Ko'pi bilan {n} ta belgi").
type Template = { regex: RegExp; names: string[]; key: string };
const templateCache = new WeakMap<Dictionary, Template[]>();

function templatesOf(dict: Dictionary): Template[] {
  let templates = templateCache.get(dict);
  if (!templates) {
    templates = Object.keys(dict)
      .filter((key) => /\{\w+\}/.test(key))
      .map((key) => {
        const names: string[] = [];
        const pattern = key
          .split(/(\{\w+\})/)
          .map((part) => {
            const name = /^\{(\w+)\}$/.exec(part)?.[1];
            if (!name) return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            names.push(name);
            return "(.+?)";
          })
          .join("");
        return { regex: new RegExp(`^${pattern}$`), names, key };
      });
    templateCache.set(dict, templates);
  }
  return templates;
}

function pluralIndex(lang: Lang, n: number, forms: number) {
  if (lang === "ru" && forms >= 3) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 0;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 1;
    return 2;
  }
  return n === 1 ? 0 : 1;
}

function fill(lang: Lang, text: string, vars?: Vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)((?:\|[^{}|]*)+)?\}/g, (whole, name: string, forms?: string) => {
    const value = vars[name];
    if (value === undefined) return whole;
    if (!forms) return String(value);
    const options = forms.slice(1).split("|");
    return options[Math.min(pluralIndex(lang, Number(value), options.length), options.length - 1)] ?? String(value);
  });
}

export function translate(lang: Lang, dict: Dictionary, text: string, vars?: Vars): string {
  if (lang === DEFAULT_LANG) return fill(lang, text, vars);

  const exact = dict[text];
  if (exact !== undefined) return fill(lang, exact, vars);

  for (const { regex, names, key } of templatesOf(dict)) {
    const match = regex.exec(text);
    if (!match) continue;
    const found: Vars = {};
    names.forEach((name, i) => (found[name] = match[i + 1]));
    return fill(lang, dict[key], { ...found, ...vars });
  }
  return fill(lang, text, vars);
}
