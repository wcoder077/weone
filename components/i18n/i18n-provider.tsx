"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LANG, translate, type Dictionary, type Lang, type TFunction } from "@/lib/i18n/core";

type I18n = { lang: Lang; dict: Dictionary };
const I18nContext = createContext<I18n>({ lang: DEFAULT_LANG, dict: {} });

// For code outside React (toasts): set once the provider has mounted in the browser.
let active: I18n = { lang: DEFAULT_LANG, dict: {} };

// Only the active language's dictionary is sent to the browser.
export function I18nProvider({ lang, dict, children }: { lang: Lang; dict: Dictionary; children: ReactNode }) {
  // Every router.refresh() delivers a new `dict` object. Keep the first one per language, so `t`
  // keeps its identity: effects that list `t` as a dependency must not re-run (and refresh again).
  const [value, setValue] = useState<I18n>({ lang, dict });
  if (value.lang !== lang) setValue({ lang, dict });
  useEffect(() => {
    active = value;
  }, [value]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLang(): Lang {
  return useContext(I18nContext).lang;
}

// Translator for Client Components.
export function useT(): TFunction {
  const { lang, dict } = useContext(I18nContext);
  return useMemo(() => (text, vars) => translate(lang, dict, text, vars), [lang, dict]);
}

// Browser-only, for event handlers (toast.error(...)). Never call it while rendering.
export const tNow: TFunction = (text, vars) => translate(active.lang, active.dict, text, vars);
