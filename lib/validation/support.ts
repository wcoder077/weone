import { z } from "zod";

export const SUPPORT_MAX_WORDS = 100;
export const SUPPORT_MAX_CHARS = 1000;

export function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const supportMessageSchema = z
  .string()
  .trim()
  .min(1, "Muammoni yozing.")
  .max(SUPPORT_MAX_CHARS, "Matn juda uzun.")
  .refine((text) => countWords(text) <= SUPPORT_MAX_WORDS, "100 ta so'zdan oshmasin.");
