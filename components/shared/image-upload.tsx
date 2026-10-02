"use client";

import { useRef, useState, type ReactNode } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { AVATAR_MAX_SIDE, shrinkImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];

// Uploads to <bucket>/<folder>/ straight from the browser (storage RLS checks the folder)
// and keeps the public URL in a hidden input for the form's action to save.
export function ImageUpload({
  bucket,
  folder,
  fieldName,
  initialUrl,
  preview,
}: {
  bucket: "avatars" | "project-logos";
  folder: string;
  fieldName: string;
  initialUrl: string | null;
  preview: (url: string | null) => ReactNode;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(picked: File) {
    if (!TYPES.includes(picked.type)) return toast.error("Faqat PNG, JPG yoki WEBP rasm");

    setUploading(true);
    // Avatars and logos are shown small: 512 px WebP is plenty (tens of KB instead of MBs).
    const file = await shrinkImage(picked, AVATAR_MAX_SIDE);
    if (file.size > MAX_BYTES) {
      setUploading(false);
      return toast.error("Rasm 2 MB dan kichik bo'lsin");
    }
    const supabase = createClient();
    const path = `${folder}/${Date.now()}.${file.type.split("/")[1]}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    setUploading(false);
    if (error) return toast.error("Rasmni yuklab bo'lmadi");

    setUrl(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl);
  }

  return (
    <div className="flex items-center gap-4">
      {preview(url)}
      <input type="hidden" name={fieldName} value={url ?? ""} />
      <input
        ref={inputRef}
        type="file"
        accept={TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="border-border text-text hover:bg-surface inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-medium disabled:opacity-50"
      >
        <Camera className="size-4" aria-hidden />
        {uploading ? "Yuklanmoqda…" : url ? "Rasmni almashtirish" : "Rasm yuklash"}
      </button>
    </div>
  );
}
