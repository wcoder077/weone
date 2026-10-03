"use client";

import { useActionState, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { submitSupportTicket } from "@/lib/actions/support";
import type { ActionState } from "@/lib/actions/types";
import { countWords, SUPPORT_MAX_CHARS, SUPPORT_MAX_WORDS } from "@/lib/validation/support";
import { useT } from "@/components/i18n/i18n-provider";
import { FormField, FormMessage } from "@/components/shared/form-field";
import { AttachImageButton, AttachmentPreview, useImageAttachment } from "@/components/shared/image-attachment";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Describe the problem in up to 100 words and optionally attach a screenshot of the place.
export function SupportForm({ userId }: { userId: string }) {
  const t = useT();
  const [text, setText] = useState("");
  const image = useImageAttachment(userId, null, "support-images");
  const formRef = useRef<HTMLFormElement>(null);
  const words = countWords(text);
  const over = words > SUPPORT_MAX_WORDS;

  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await submitSupportTicket(prev, formData);
    if (result?.message) {
      toast.success(result.message);
      image.cleanup(image.attachment?.path ?? null);
      image.setAttachment(null);
      setText("");
    } else if (result?.error || result?.fieldErrors) {
      toast.error(result.error ?? "Maydonlardagi xatolarni tuzating.");
    }
    return result;
  }, null);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4" noValidate>
      {/* Honeypot: invisible to people, tempting to bots. Anything typed here drops the message. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="support-website">Website</label>
        <input id="support-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <FormField
        id="support-message"
        label="Muammo yoki taklif"
        errors={state?.fieldErrors?.message}
        hint="Nima bo'ldi? Qisqa va aniq yozing."
      >
        <Textarea
          id="support-message"
          name="message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={SUPPORT_MAX_CHARS}
          aria-describedby="support-message-desc support-words"
          aria-invalid={over || undefined}
          placeholder={t("Masalan: «Xabar yuborganimda tugma ishlamadi…»")}
        />
        <p
          id="support-words"
          aria-live="polite"
          className={cn("text-[13px] tabular-nums", over ? "text-danger font-semibold" : "text-muted")}
        >
          {t("{n} / {max} so'z", { n: words, max: SUPPORT_MAX_WORDS })}
        </p>
      </FormField>

      <div className="flex flex-col gap-2">
        <p className="text-[14px] font-medium">{t("Muammo bo'lgan joyning rasmi (ixtiyoriy)")}</p>
        {image.attachment ? (
          <AttachmentPreview
            attachment={image.attachment}
            onRemove={() => {
              image.cleanup(null);
              image.setAttachment(null);
            }}
          />
        ) : null}
        <div className="flex items-center gap-2">
          <AttachImageButton hasImage={Boolean(image.attachment)} uploading={image.uploading} onPick={image.attach} />
          <span className="text-muted text-[13px]">
            {image.uploading ? t("Yuklanmoqda…") : t("JPG, PNG yoki WEBP, 5 MB gacha")}
          </span>
        </div>
        <input type="hidden" name="imagePath" value={image.attachment?.path ?? ""} />
      </div>

      <FormMessage error={state?.error} />
      <Button type="submit" size="lg" disabled={pending || image.uploading || over || !text.trim()} aria-busy={pending}>
        {pending ? t("Yuborilmoqda…") : t("Yuborish")}
      </Button>
    </form>
  );
}
