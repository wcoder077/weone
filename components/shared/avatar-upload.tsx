"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "./user-avatar";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];

// Uploads to avatars/<userId>/ straight from the browser (storage RLS checks the folder)
// and keeps the public URL in a hidden `avatar_url` input for the form's action.
export function AvatarUpload({
  userId,
  name,
  initialUrl,
}: {
  userId: string;
  name: string;
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!TYPES.includes(file.type)) return toast.error("Faqat PNG, JPG yoki WEBP rasm");
    if (file.size > MAX_BYTES) return toast.error("Rasm 2 MB dan kichik bo'lsin");

    setUploading(true);
    const supabase = createClient();
    const path = `${userId}/${Date.now()}.${file.type.split("/")[1]}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file);
    setUploading(false);
    if (error) return toast.error("Rasmni yuklab bo'lmadi");

    setUrl(supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl);
  }

  return (
    <div className="flex items-center gap-4">
      <UserAvatar name={name || "?"} url={url} size="xl" />
      <input type="hidden" name="avatar_url" value={url ?? ""} />
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
