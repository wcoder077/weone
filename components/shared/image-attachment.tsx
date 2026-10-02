"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { PHOTO_MAX_SIDE, shrinkImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";

export const MESSAGE_IMAGE = {
  maxBytes: 5 * 1024 * 1024,
  types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as Record<string, string>,
};

export type Attachment = { path: string; previewUrl: string };

// One optional image for a message. Uploads to the private bucket
// message-images/<userId>/<uuid>.<ext> right away; the bucket itself rejects
// other types and files over 5 MB.
export function useImageAttachment(userId: string, initial: Attachment | null) {
  const [attachment, setAttachment] = useState(initial);
  const [uploading, setUploading] = useState(false);
  // Uploads made in this session; removed again if they end up unused.
  const uploaded = useRef(new Set<string>());

  async function attach(picked: File) {
    if (!MESSAGE_IMAGE.types[picked.type]) return toast.error("Faqat JPG, PNG yoki WEBP rasm");

    setUploading(true);
    const file = await shrinkImage(picked, PHOTO_MAX_SIDE);
    const ext = MESSAGE_IMAGE.types[file.type] ?? "webp";
    if (file.size > MESSAGE_IMAGE.maxBytes) {
      setUploading(false);
      return toast.error("Rasm 5 MB dan kichik bo'lsin");
    }
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await createClient().storage.from("message-images").upload(path, file, { contentType: file.type });
    setUploading(false);
    if (error) return toast.error("Rasmni yuklab bo'lmadi");

    uploaded.current.add(path);
    setAttachment({ path, previewUrl: URL.createObjectURL(file) });
  }

  // Deletes this session's uploads except `keep` (the one that was actually sent).
  const cleanup = useCallback((keep: string | null) => {
    const stale = [...uploaded.current].filter((p) => p !== keep);
    uploaded.current.clear();
    if (stale.length) void createClient().storage.from("message-images").remove(stale);
  }, []);

  return { attachment, setAttachment, uploading, attach, cleanup };
}

export function AttachmentPreview({ attachment, onRemove }: { attachment: Attachment; onRemove: () => void }) {
  return (
    <div className="relative w-fit">
      {/* Local preview or a short-lived signed URL of a private image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={attachment.previewUrl} alt="Biriktirilgan rasm" className="border-border max-h-48 rounded-2xl border object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Rasmni olib tashlash"
        className="bg-bg/80 text-text hover:bg-bg absolute top-2 right-2 inline-flex size-9 items-center justify-center rounded-full backdrop-blur transition-colors duration-150"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function AttachImageButton({
  hasImage,
  uploading,
  onPick,
}: {
  hasImage: boolean;
  uploading: boolean;
  onPick: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={Object.keys(MESSAGE_IMAGE.types).join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={hasImage ? "Rasmni almashtirish" : "Rasm biriktirish"}
        className="text-muted hover:text-text hover:bg-surface focus-visible:ring-ring/50 inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150 outline-none focus-visible:ring-3 disabled:opacity-50"
      >
        <ImagePlus className="size-5" />
      </button>
    </>
  );
}
