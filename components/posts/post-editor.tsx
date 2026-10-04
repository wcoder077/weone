"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Video, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { formatBytes } from "@/lib/attachments";
import type { PostMediaInput } from "@/lib/actions/posts";
import type { ActionState } from "@/lib/actions/types";
import { POST_MAX_PHOTOS, POST_MEDIA_ACCEPT, POST_MEDIA_BUCKET, postMediaKindOf, postMediaPath, postMediaProblem, type PostMediaKind } from "@/lib/post-media";
import { PHOTO_MAX_SIDE, shrinkImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import { graphemeLength } from "@/lib/text";
import { IMMUTABLE_CACHE } from "@/lib/storage-cache";
import { POST_MAX } from "@/lib/validation/post";
import { CharCounter } from "@/components/shared/char-counter";
import { EmojiPicker, insertAtCursor } from "@/components/shared/emoji-picker";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";

type Staged = { id: string; file: File; kind: PostMediaKind; previewUrl: string | null };

// Text area + emoji + live "x/500" counter; used to create, edit and repost posts.
// Pass `media` (the signed-in user's id) to allow one video or up to 10 photos, `allowEmpty` when the text is optional.
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
  onSubmit: (body: string, media?: PostMediaInput[]) => Promise<ActionState>;
  onDone?: () => void;
  autoFocus?: boolean;
  media?: { userId: string };
  allowEmpty?: boolean;
  placeholder?: string;
}) {
  const t = useT();
  const [body, setBody] = useState(initial);
  const [staged, setStaged] = useState<Staged[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [pending, startTransition] = useTransition();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const count = graphemeLength(body.trim());
  const invalid = preparing || count > POST_MAX || (count === 0 && staged.length === 0 && !allowEmpty);

  // Free the thumbnails' object URLs when they are replaced, removed or the editor closes.
  useEffect(() => {
    const urls = staged.flatMap((item) => (item.previewUrl ? [item.previewUrl] : []));
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [staged]);

  // Photos are shrunk in the browser first (WebP, ≤ 1600 px), then checked against the limit.
  async function prepare(picked: File): Promise<Staged | null> {
    const file = postMediaKindOf(picked.type) === "image" ? await shrinkImage(picked, PHOTO_MAX_SIDE) : picked;
    const problem = postMediaProblem(file);
    const kind = postMediaKindOf(file.type);
    if (problem || !kind) {
      toast.error(problem ?? "Faqat rasm yoki video yuborish mumkin");
      return null;
    }
    return { id: crypto.randomUUID(), file, kind, previewUrl: kind === "image" ? URL.createObjectURL(file) : null };
  }

  // Photos add up to a carousel (max 10); a video stands alone and replaces whatever was chosen.
  async function stage(picked: File[]) {
    setPreparing(true);
    const prepared = (await Promise.all(picked.map(prepare))).filter((item): item is Staged => item !== null);
    setPreparing(false);
    if (prepared.length === 0) return;
    const video = prepared.find((item) => item.kind === "video");
    if (video) {
      setStaged([video]);
      return;
    }
    const room = POST_MAX_PHOTOS - staged.filter((item) => item.kind === "image").length;
    if (prepared.length > room) toast.error(`Ko'pi bilan ${POST_MAX_PHOTOS} ta rasm`);
    setStaged((current) => [...current.filter((item) => item.kind === "image"), ...prepared.slice(0, Math.max(0, room))]);
  }

  function submit() {
    if (invalid || pending) return;
    startTransition(async () => {
      const uploaded: PostMediaInput[] = [];
      if (media) {
        for (const item of staged) {
          const path = postMediaPath(media.userId, item.file.type);
          const { error } = await createClient()
            .storage.from(POST_MEDIA_BUCKET)
            .upload(path, item.file, { contentType: item.file.type, cacheControl: IMMUTABLE_CACHE });
          if (error) {
            // Take back the files that already went up.
            if (uploaded.length > 0) await createClient().storage.from(POST_MEDIA_BUCKET).remove(uploaded.map((file) => file.path));
            toast.error("Faylni yuklab bo'lmadi. Qayta urinib ko'ring.");
            return;
          }
          uploaded.push({ path, name: item.file.name, kind: item.kind });
        }
      }
      const result = await onSubmit(body, uploaded.length > 0 ? uploaded : undefined);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      if (result?.message) toast.success(result.message);
      setBody("");
      setStaged([]);
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
      {staged.length > 0 ? (
        <div className="flex flex-col gap-2">
          {staged.map((item) => (
            <StagedPreview key={item.id} staged={item} disabled={pending} onRemove={() => setStaged((current) => current.filter((other) => other.id !== item.id))} />
          ))}
        </div>
      ) : null}
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
              multiple
              className="hidden"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                const files = [...(e.target.files ?? [])];
                e.target.value = ""; // the same file can be picked again
                if (files.length > 0) void stage(files);
              }}
            />
          </>
        ) : null}
        <span className="ml-auto pr-2">
          <CharCounter id={`${id}-count`} count={count} max={POST_MAX} />
        </span>
        <Button type="submit" disabled={invalid || pending}>
          {preparing ? t("Tayyorlanmoqda…") : pending ? (staged.length > 0 ? t("Yuklanmoqda…") : t("Saqlanmoqda…")) : submitLabel}
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
