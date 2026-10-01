import { z } from "zod";
import { graphemeLength } from "@/lib/text";

export const POST_MAX = 500;

// Mirrors the posts_body_check constraint.
export const postBodySchema = z
  .string()
  .trim()
  .min(1, "Post bo'sh bo'lmasin")
  .refine((v) => graphemeLength(v) <= POST_MAX, `Ko'pi bilan ${POST_MAX} ta belgi`);
