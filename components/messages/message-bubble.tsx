import type { ChatMessage } from "@/lib/queries/messages";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

// Own messages on the right, the other person's on the left. Text is rendered
// as plain text (React escapes it); line breaks are preserved by CSS.
export function MessageBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <div className={cn("flex max-w-[85%] flex-col gap-1 sm:max-w-[70%]", mine ? "items-end self-end" : "items-start")}>
      <div
        className={cn(
          "rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap shadow-[0_1px_0_rgb(0_0_0/0.04)]",
          mine ? "bg-bubble-mine rounded-br-lg" : "bg-card border-border rounded-bl-lg border",
        )}
      >
        {message.imageUrl ? (
          // Signed URL of a private first-message image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={message.imageUrl} alt="Xabardagi rasm" className="mb-2 max-h-64 rounded-2xl object-cover" />
        ) : null}
        {message.body}
      </div>
      <span className="text-muted px-2 text-[11px]">
        <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
        {message.editedAt ? " · tahrirlangan" : null}
      </span>
    </div>
  );
}

export function DaySeparator({ label }: { label: string }) {
  return (
    <div className="my-2 flex justify-center" role="separator" aria-label={label}>
      <span className="bg-card border-border text-muted rounded-full border px-3 py-1 text-[12px] font-medium">{label}</span>
    </div>
  );
}
