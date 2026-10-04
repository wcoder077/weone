"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { useT } from "@/components/i18n/i18n-provider";
import { CharCounter } from "@/components/shared/char-counter";
import { FormField } from "@/components/shared/form-field";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { graphemeLength } from "@/lib/text";
import {
  fromLocalInput,
  NOTICE_MAX,
  teamSpacePatchSchema,
  toLocalInput,
  type TeamSpace,
} from "@/lib/team-space";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  space: TeamSpace | null;
  onSave: (patch: Partial<TeamSpace>) => Promise<void>;
};

// The founder edits the chat link, the pinned notice and the next meeting. Every field is optional.
export function TeamSpaceEditModal({ open, onOpenChange, space, onSave }: Props) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Jamoa maydonini tahrirlash">
      {open ? <EditForm space={space} onSave={onSave} onClose={() => onOpenChange(false)} /> : null}
    </ResponsiveDialog>
  );
}

function EditForm({ space, onSave, onClose }: { space: TeamSpace | null; onSave: Props["onSave"]; onClose: () => void }) {
  const t = useT();
  const [chatUrl, setChatUrl] = useState(space?.chatUrl ?? "");
  const [notice, setNotice] = useState(space?.pinnedNotice ?? "");
  const [meetingAt, setMeetingAt] = useState(toLocalInput(space?.nextMeetingAt ?? null));
  const [meetingUrl, setMeetingUrl] = useState(space?.meetingUrl ?? "");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [saving, setSaving] = useState(false);
  const noticeLength = graphemeLength(notice);
  // A field's old error goes away as soon as the person edits that field.
  const clearError = (field: string) => setErrors((current) => ({ ...current, [field]: undefined }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    const iso = fromLocalInput(meetingAt);
    const parsed = teamSpacePatchSchema.safeParse({
      chatUrl,
      pinnedNotice: notice,
      nextMeetingAt: iso === "invalid" ? "invalid" : iso,
      meetingUrl,
    });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSave({
        chatUrl: parsed.data.chatUrl ?? null,
        pinnedNotice: parsed.data.pinnedNotice ?? null,
        nextMeetingAt: parsed.data.nextMeetingAt ?? null,
        meetingUrl: parsed.data.meetingUrl ?? null,
      });
      toast.success("Saqlandi");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Saqlab bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <FormField
        id="ts-chat"
        label="Guruh linki"
        hint="Telegram yoki Discord havolasi. Faqat jamoa a'zolariga ko'rinadi."
        errors={errors.chatUrl}
      >
        <Input id="ts-chat" type="url" inputMode="url" placeholder="https://t.me/..." value={chatUrl} onChange={(e) => {
            setChatUrl(e.target.value);
            clearError("chatUrl");
          }} aria-describedby="ts-chat-desc" />
      </FormField>

      <FormField id="ts-notice" label="E'lon" errors={errors.pinnedNotice}>
        <Textarea
          id="ts-notice"
          rows={3}
          value={notice}
          onChange={(e) => {
            setNotice(e.target.value);
            clearError("pinnedNotice");
          }}
          placeholder={t("Masalan: Ertaga 20:00 da onlayn uchrashuv")}
          aria-describedby="ts-notice-count"
        />
        <div className="flex justify-end">
          <CharCounter id="ts-notice-count" count={noticeLength} max={NOTICE_MAX} />
        </div>
      </FormField>

      <FormField id="ts-meeting" label="Keyingi uchrashuv" hint="Sana va vaqt sizning vaqt mintaqangizda." errors={errors.nextMeetingAt}>
        <Input id="ts-meeting" type="datetime-local" value={meetingAt} onChange={(e) => {
            setMeetingAt(e.target.value);
            clearError("nextMeetingAt");
          }} aria-describedby="ts-meeting-desc" />
      </FormField>

      <FormField id="ts-meeting-url" label="Uchrashuv linki" hint="Google Meet, Zoom va hokazo." errors={errors.meetingUrl}>
        <Input id="ts-meeting-url" type="url" inputMode="url" placeholder="https://meet.google.com/..." value={meetingUrl} onChange={(e) => {
            setMeetingUrl(e.target.value);
            clearError("meetingUrl");
          }} aria-describedby="ts-meeting-url-desc" />
      </FormField>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <Button type="button" variant="outline" size="lg" onClick={onClose} disabled={saving}>
          {t("Bekor qilish")}
        </Button>
        <Button type="submit" size="lg" disabled={saving || noticeLength > NOTICE_MAX} aria-busy={saving}>
          {saving ? t("Saqlanmoqda…") : t("Saqlash")}
        </Button>
      </div>
    </form>
  );
}
