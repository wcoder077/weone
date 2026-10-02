import { z } from "zod";
import { graphemeLength } from "@/lib/text";

export const POST_MAX = 2000;

// Mirrors the posts_body_check constraint.
export const postBodySchema = z
  .string()
  .trim()
  .min(1, "Post bo'sh bo'lmasin")
  .refine((v) => graphemeLength(v) <= POST_MAX, `Ko'pi bilan ${POST_MAX} ta belgi`);

// Reposts and photo/video posts may have no text of their own.
export const postCaptionSchema = z
  .string()
  .trim()
  .refine((v) => graphemeLength(v) <= POST_MAX, `Ko'pi bilan ${POST_MAX} ta belgi`);

export const COMMENT_MAX = 500;

export const commentSchema = z
  .string()
  .trim()
  .min(1, "Izoh bo'sh bo'lmasin")
  .refine((v) => graphemeLength(v) <= COMMENT_MAX, `Ko'pi bilan ${COMMENT_MAX} ta belgi`);
