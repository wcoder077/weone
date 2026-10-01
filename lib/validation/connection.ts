import { z } from "zod";
import { graphemeLength } from "@/lib/text";

export const FIRST_MESSAGE_MAX = 200;

// Mirrors public.check_first_message(): text ≤ 200 graphemes, text or image.
export const firstMessageSchema = z
  .object({
    body: z.string().trim().refine((v) => graphemeLength(v) <= FIRST_MESSAGE_MAX, `Ko'pi bilan ${FIRST_MESSAGE_MAX} ta belgi`),
    imagePath: z
      .string()
      .regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/, "Rasmni qayta yuklang")
      .nullable(),
  })
  .refine((v) => v.body.length > 0 || v.imagePath !== null, {
    message: "Xabar yozing yoki rasm biriktiring",
    path: ["body"],
  });

export type FirstMessageInput = z.input<typeof firstMessageSchema>;
