import { Download, FileText } from "lucide-react";
import { formatBytes } from "@/lib/attachments";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import type { ChatAttachment } from "@/lib/queries/messages";

// Photo (opens large in the blurred viewer), video player, or a downloadable file card.
export function AttachmentView({ attachment }: { attachment: ChatAttachment }) {
  if (attachment.kind === "image") {
    // Signed URL of a private file; tap opens it large.
    return <ImageLightbox src={attachment.url} alt={attachment.name} className="max-h-80 max-w-full rounded-2xl object-cover" />;
  }

  if (attachment.kind === "video") {
    return (
      <video src={attachment.url} controls preload="none" playsInline aria-label={attachment.name} className="max-h-80 max-w-full rounded-2xl bg-black" />
    );
  }

  return (
    <a
      href={attachment.url}
      download={attachment.name}
      className="bg-surface/60 hover:bg-surface flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2 transition-colors duration-150"
    >
      <span className="bg-primary text-on-accent flex size-10 shrink-0 items-center justify-center rounded-full">
        <FileText className="size-5" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[14px] font-medium">{attachment.name}</span>
        <span className="text-muted text-[12px]">{formatBytes(attachment.size)}</span>
      </span>
      <Download className="text-muted size-4 shrink-0" aria-label="Yuklab olish" />
    </a>
  );
}
