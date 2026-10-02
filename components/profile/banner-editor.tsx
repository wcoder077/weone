"use client";

import { useId, useRef, useState, useTransition } from "react";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveBanner } from "@/lib/actions/profile";
import { compressImage, IMAGE_TYPES, imageProblem } from "@/lib/image";
import { IMMUTABLE_CACHE } from "@/lib/storage-cache";
import { createClient } from "@/lib/supabase/client";
import { bannerUrl } from "@/lib/url";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";

const MAX_WIDTH = 1800;
const MAX_HEIGHT = 1200;

type Banner = { path: string | null; position: number };

// Owner-only: upload / reposition (vertical focus) / remove the profile banner.
// Uploads go straight to banners/<uid>/; an upload that isn't saved is deleted on close.
export function BannerEditor({ userId, initial }: { userId: string; initial: Banner }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Banner>(initial);
  const [unsavedUpload, setUnsavedUpload] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, startSaving] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const sliderId = useId();
  const url = bannerUrl(draft.path);
  const changed = draft.path !== initial.path || draft.position !== initial.position;

  function discardUpload() {
    if (unsavedUpload) void createClient().storage.from("banners").remove([unsavedUpload]);
    setUnsavedUpload(null);
  }

  function changeOpen(next: boolean) {
    if (!next) discardUpload();
    if (next) setDraft(initial);
    setOpen(next);
  }

  async function upload(file: File) {
    const problem = imageProblem(file);
    if (problem) return toast.error(problem);

    setUploading(true);
    try {
      const { blob } = await compressImage(file, MAX_WIDTH, MAX_HEIGHT);
      const path = `${userId}/${crypto.randomUUID()}.webp`;
      const { error } = await createClient()
        .storage.from("banners")
        .upload(path, blob, { contentType: "image/webp", cacheControl: IMMUTABLE_CACHE });
      if (error) throw error;
      discardUpload();
      setUnsavedUpload(path);
      setDraft({ path, position: 50 });
    } catch {
      toast.error("Rasmni yuklab bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setUploading(false);
    }
  }

  function save() {
    startSaving(async () => {
      const result = await saveBanner(draft.path, draft.position);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result?.message ?? "Saqlandi");
      // The saved upload is now referenced by the profile; any other one is not.
      if (unsavedUpload === draft.path) setUnsavedUpload(null);
      else discardUpload();
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => changeOpen(true)}
        className="bg-card min-h-11"
      >
        <Camera data-icon="inline-start" />
        {t("Muqova")}</Button>

      <ResponsiveDialog
        open={open}
        onOpenChange={changeOpen}
        title={t("Profil muqovasi")}
        description={t("Keng rasm tanlang. Ko'rinadigan qismini surgich bilan tanlang.")}
      >
        <div className="flex flex-col gap-4">
          <div className="bg-surface border-border aspect-[3/1] overflow-hidden rounded-2xl border">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={t("Muqova ko'rinishi")}
                className="size-full object-cover"
                style={{ objectPosition: `50% ${draft.position}%` }}
              />
            ) : (
              <div className="text-muted flex size-full items-center justify-center text-[14px]">{t("Muqova yo'q")}</div>
            )}
          </div>

          {url ? (
            <div className="flex flex-col gap-2">
              <label htmlFor={sliderId} className="text-[14px] font-medium">
                {t("Joylashuv")}</label>
              <input
                id={sliderId}
                type="range"
                min={0}
                max={100}
                value={draft.position}
                onChange={(e) => setDraft((d) => ({ ...d, position: Number(e.target.value) }))}
                className="accent-primary h-11 w-full"
                aria-valuetext={draft.position < 34 ? "Yuqori qism" : draft.position > 66 ? "Pastki qism" : "O'rta"}
              />
            </div>
          ) : null}

          <input
            ref={fileRef}
            type="file"
            accept={IMAGE_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading || saving}>
              <ImagePlus data-icon="inline-start" />
              {uploading ? t("Yuklanmoqda…") : url ? t("Boshqa rasm") : t("Rasm yuklash")}
            </Button>
            {url ? (
              <Button
                variant="ghost"
                onClick={() => setDraft({ path: null, position: 50 })}
                disabled={uploading || saving}
              >
                <Trash2 data-icon="inline-start" />
                {t("Olib tashlash")}</Button>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="lg" onClick={() => changeOpen(false)}>
              {t("Bekor qilish")}</Button>
            <Button size="lg" onClick={save} disabled={!changed || uploading || saving} aria-busy={saving}>
              {saving ? t("Saqlanmoqda…") : t("Saqlash")}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}
