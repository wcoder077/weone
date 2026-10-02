import type { Dictionary, Lang } from "./core";
import { en } from "./en";
import { ru } from "./ru";

// Uzbek is the source text itself, so it has no dictionary.
export const dictionaries: Record<Lang, Dictionary> = { uz: {}, en, ru };
