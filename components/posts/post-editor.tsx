"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Video, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { formatBytes } from "@/lib/attachments";
import type { PostMediaInput } from "@/lib/actions/posts";
import type { ActionState } from "@/lib/actions/types";
import { POST_MEDIA_ACCEPT, POST_MEDIA_BUCKET, postMediaKindOf, postMediaPath, postMediaProblem, type PostMediaKind } from "@/lib/post-media";
import { PHOTO_MAX_SIDE, shrinkImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import { graphemeLength } from "@/lib/text";
import { IMMUTABLE_CACHE } from "@/lib/storage-cache";
import { POST_MAX } from "@/lib/validation/post";
import { CharCounter } from "@/components/shared/char-counter";
import { EmojiPicker, insertAtCursor } from "@/components/shared/emoji-picker";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";

type Staged = { file: File; kind: PostMediaKind; previewUrl: string | null };

// Text area + emoji + live "x/500" counter; used to create, edit and repost posts.
// Pass `media` (the signed-in user's id) to allow one photo or video, `allowEmpty` when the text is optional.
export function PostEditor({
  id,
  initial = "",
  submitLabel,
  onSubmit,
  onDone,
  autoFocus = false,
  media,
  allowEmpty = false,
  placeholder = "Nima ustida ishlayapsiz? Fikr, yangilik yoki savol yozing…",
}: {
  id: string;
  initial?: string;
  submitLabel: string;
  onSubmit: (body: string, media?: PostMediaInput) => Promise<ActionState>;
  onDone?: () => void;
  autoFocus?: boolean;
  media?: { userId: string };
  allowEmpty?: boolean;
  placeholder?: string;
}) {
  const t = useT();
  const [body, setBody] = useState(initial);
  const [staged, setStaged] = useState<Staged | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [pending, startTransition] = useTransition();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const count = graphemeLength(body.trim());
  const invalid = preparing || count > POST_MAX || (count === 0 && !staged && !allowEmpty);

  // Free the thumbnail's object URL when it is replaced, removed or the editor closes.
  useEffect(() => {
    const url = staged?.previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [staged]);

  // Photos are shrunk in the browser first (WebP, ≤ 1600 px), then checked against the limit.
  async function stage(picked: File) {
    setPreparing(true);
    const file = postMediaKindOf(picked.type) === "image" ? await shrinkImage(picked, PHOTO_MAX_SIDE) : picked;
    setPreparing(false);
    const problem = postMediaProblem(file);
    const kind = postMediaKindOf(file.type);
    if (problem || !kind) {
      toast.error(problem ?? "Faqat rasm yoki video yuborish mumkin");
      return;
    }
    setStaged({ file, kind, previewUrl: kind === "image" ? URL.createObjectURL(file) : null });
  }


  function submit() {
    if (invalid || pending) return;
    startTransition(async () => {
      let uploaded: PostMediaInput | undefined;
      if (staged && media) {
        const path = postMediaPath(media.userId, staged.file.type);
        const { error } = await createClient()
          .storage.from(POST_MEDIA_BUCKET)
          .upload(path, staged.file, { contentType: staged.file.type, cacheControl: IMMUTABLE_CACHE });
        if (error) {
          toast.error("Faylni yuklab bo'lmadi. Qayta urinib ko'ring.");
          return;
        }
        uploaded = { path, name: staged.file.name, kind: staged.kind };
      }
      const result = await onSubmit(body, uploaded);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      if (result?.message) toast.success(result.message);
      setBody("");
      setStaged(null);
      onDone?.();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-3"
    >
      <label htmlFor={id} className="sr-only">
        {t("Post matni")}</label>
      <textarea
        id={id}
        ref={fieldRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        autoFocus={autoFocus}
        rows={3}
        placeholder={t(placeholder)}
        aria-describedby={`${id}-count`}
        aria-invalid={count > POST_MAX}
        className="border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive field-sizing-content min-h-24 w-full resize-none rounded-2xl border px-4 py-3 text-base leading-[1.6] outline-none focus-visible:ring-3"
      />
      {staged ? <StagedPreview staged={staged} disabled={pending} onRemove={() => setStaged(null)} /> : null}
      <div className="flex items-center gap-1">
        <EmojiPicker onPick={(emoji) => insertAtCursor(fieldRef.current, body, emoji, setBody)} />
        {media ? (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={pending}
              aria-label={t("Rasm yoki video qo'shish")}
              className="text-muted hover:text-text hover:bg-surface focus-visible:ring-ring/50 inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150 outline-none focus-visible:ring-3 disabled:opacity-50"
            >
              <ImagePlus className="size-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={POST_MEDIA_ACCEPT}
              className="hidden"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = ""; // the same file can be picked again
                if (file) void stage(file);
              }}
            />
          </>
        ) : null}
        <span className="ml-auto pr-2">
          <CharCounter id={`${id}-count`} count={count} max={POST_MAX} />
        </span>
        <Button type="submit" disabled={invalid || pending}>
          {preparing ? t("Tayyorlanmoqda…") : pending ? (staged ? t("Yuklanmoqda…") : t("Saqlanmoqda…")) : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function StagedPreview({ staged, disabled, onRemove }: { staged: Staged; disabled: boolean; onRemove: () => void }) {
  const t = useT();
  const { file, kind, previewUrl } = staged;
  return (
    <div className="bg-surface/60 flex items-center gap-3 rounded-2xl p-2">
      {previewUrl ? (
        // Local object URL of the picked photo.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
      ) : (
        <span className="bg-primary text-on-accent flex size-14 shrink-0 items-center justify-center rounded-xl">
          <Video className="size-6" aria-hidden />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[14px] font-medium">{file.name}</span>
        <span className="text-muted text-[12px]">
          {kind === "video" ? t("Video") : t("Rasm")} · {formatBytes(file.size)}
        </span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={t("Biriktirilgan faylni olib tashlash")}
        className="text-muted hover:text-text hover:bg-surface focus-visible:ring-ring/50 inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 disabled:opacity-50"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}
