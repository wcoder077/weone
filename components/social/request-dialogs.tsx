"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { LinkifiedText } from "@/components/shared/linkified-text";
import { toast } from "sonner";
import {
  getConnectionRequest,
  respondConnectionRequest,
  sendConnectionRequest,
  updateConnectionRequest,
  type ConnectionRequestDetails,
} from "@/lib/actions/connections";
import type { ActionState } from "@/lib/actions/types";
import { graphemeLength } from "@/lib/text";
import { FIRST_MESSAGE_MAX } from "@/lib/validation/connection";
import { CharCounter } from "@/components/shared/char-counter";
import { EmojiPicker, insertAtCursor } from "@/components/shared/emoji-picker";
import { AttachImageButton, AttachmentPreview, useImageAttachment } from "@/components/shared/image-attachment";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/components/i18n/i18n-provider";

// Sent as the first message when someone connects without writing one.
const QUICK_GREETING = "Salom! Siz bilan bog'lanmoqchiman.";

function report(result: ActionState) {
  if (result?.error) toast.error(result.error);
  else if (result?.message) toast.success(result.message);
  return !result?.error;
}

type ComposeMode =
  | { kind: "new"; addresseeId: string }
  | { kind: "edit"; connectionId: string };

// Write (or edit) the first message of a connection request.
export function RequestComposeDialog({
  open,
  onOpenChange,
  meId,
  recipientName,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meId: string;
  recipientName: string;
  mode: ComposeMode;
}) {
  const t = useT();
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode.kind === "new" ? t("{recipientName} bilan bog'lanish", { recipientName }) : t("Xabarni tahrirlash")}
      description={t("Xohlasangiz, qisqacha o'zingizni tanishtiring. So'rov qabul qilinmaguncha boshqa xabar yubora olmaysiz.")}
    >
      {open ? <ComposeBody meId={meId} mode={mode} onDone={() => onOpenChange(false)} /> : null}
    </ResponsiveDialog>
  );
}

function ComposeBody({ meId, mode, onDone }: { meId: string; mode: ComposeMode; onDone: () => void }) {
  const t = useT();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(mode.kind === "edit");
  const [pending, startTransition] = useTransition();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const image = useImageAttachment(meId, null);
  const { setAttachment, cleanup } = image;
  const sentPath = useRef<string | null>(null);

  const editId = mode.kind === "edit" ? mode.connectionId : null;

  // Edit mode: load the current text and image.
  useEffect(() => {
    if (!editId) return;
    let active = true;
    void getConnectionRequest(editId).then((details) => {
      if (!active) return;
      if (details) {
        setBody(details.body);
        if (details.imagePath && details.imageUrl) setAttachment({ path: details.imagePath, previewUrl: details.imageUrl });
        sentPath.current = details.imagePath;
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [editId, setAttachment]);

  // Uploads that were not sent are deleted when the dialog closes.
  useEffect(() => () => cleanup(sentPath.current), [cleanup]);

  const count = graphemeLength(body.trim());
  const over = count > FIRST_MESSAGE_MAX;
  const empty = body.trim().length === 0 && !image.attachment;
  // A new request may go without a message: the chat then opens with a short greeting.
  const quick = empty && mode.kind === "new";

  function submit() {
    if (over || (empty && !quick) || image.uploading) return;
    const input = { body: quick ? QUICK_GREETING : body, imagePath: image.attachment?.path ?? null };
    startTransition(async () => {
      const result =
        mode.kind === "new"
          ? await sendConnectionRequest(mode.addresseeId, input)
          : await updateConnectionRequest(mode.connectionId, input);
      if (report(result)) {
        sentPath.current = input.imagePath;
        onDone();
      }
    });
  }

  if (loading) {
    return (
      <div role="status" aria-label={t("Yuklanmoqda")} className="flex flex-col gap-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-11 w-32 self-end rounded-full" />
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-3"
    >
      <label htmlFor="first-message" className="sr-only">
        {t("Birinchi xabar")}</label>
      <textarea
        id="first-message"
        ref={fieldRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        autoFocus
        placeholder={t("Salom! Sizning loyihangiz qiziq tuyuldi…")}
        aria-describedby="first-message-count"
        aria-invalid={over}
        className="border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive min-h-28 w-full resize-none rounded-2xl border px-4 py-3 text-[15px] outline-none focus-visible:ring-3"
      />
      {image.attachment ? (
        <AttachmentPreview attachment={image.attachment} onRemove={() => image.setAttachment(null)} />
      ) : null}
      <div className="flex items-center gap-1">
        <EmojiPicker onPick={(emoji) => insertAtCursor(fieldRef.current, body, emoji, setBody)} />
        <AttachImageButton hasImage={Boolean(image.attachment)} uploading={image.uploading} onPick={(f) => void image.attach(f)} />
        <span className="ml-auto pr-1">
          <CharCounter id="first-message-count" count={count} max={FIRST_MESSAGE_MAX} />
        </span>
      </div>
      <Button type="submit" size="lg" disabled={pending || over || (empty && !quick) || image.uploading}>
        {pending
          ? t("Yuborilmoqda…")
          : image.uploading
            ? t("Rasm yuklanmoqda…")
            : quick
              ? t("Xabarsiz yuborish")
              : mode.kind === "new"
                ? t("So'rov yuborish")
                : t("Saqlash")}
      </Button>
    </form>
  );
}

// The recipient reads the first message and answers.
export function RequestReviewDialog({
  open,
  onOpenChange,
  connectionId,
  senderName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectionId: string;
  senderName: string;
}) {
  const t = useT();
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={t("{senderName}dan bog'lanish so'rovi", { senderName })}>
      {open ? <ReviewBody connectionId={connectionId} onDone={() => onOpenChange(false)} /> : null}
    </ResponsiveDialog>
  );
}

function ReviewBody({ connectionId, onDone }: { connectionId: string; onDone: () => void }) {
  const t = useT();
  const [details, setDetails] = useState<ConnectionRequestDetails | null | undefined>(undefined);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    void getConnectionRequest(connectionId).then((d) => active && setDetails(d));
    return () => {
      active = false;
    };
  }, [connectionId]);

  function respond(accept: boolean) {
    startTransition(async () => {
      if (report(await respondConnectionRequest(connectionId, accept))) onDone();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {details === undefined ? (
        <Skeleton role="status" aria-label={t("Yuklanmoqda")} className="h-20 rounded-2xl" />
      ) : details ? (
        <FirstMessageBubble details={details} />
      ) : (
        <p className="text-muted text-[14px]">{t("Xabarsiz so'rov.")}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="lg" disabled={pending} onClick={() => respond(false)}>
          {t("Rad etish")}</Button>
        <Button size="lg" disabled={pending} onClick={() => respond(true)}>
          {t("Qabul qilish")}</Button>
      </div>
    </div>
  );
}

export function FirstMessageBubble({ details }: { details: ConnectionRequestDetails }) {
  const t = useT();
  return (
    <div className="bg-surface border-border flex flex-col gap-3 rounded-2xl border p-4">
      {details.body ? <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap"><LinkifiedText text={details.body} /></p> : null}
      {details.imageUrl ? (
        // Signed URL of a private image, valid for an hour.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={details.imageUrl} alt={t("So'rovdagi rasm")} className="border-border max-h-64 w-fit rounded-xl border object-cover" />
      ) : null}
    </div>
  );
}
