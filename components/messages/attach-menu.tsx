"use client";

import { useRef, useState } from "react";
import { FileText, ImageIcon, Paperclip, Video } from "lucide-react";
import { acceptFor, ATTACHMENT_LABELS, type AttachmentKind } from "@/lib/attachments";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const OPTIONS: { kind: AttachmentKind; icon: typeof ImageIcon }[] = [
  { kind: "image", icon: ImageIcon },
  { kind: "video", icon: Video },
  { kind: "file", icon: FileText },
];

// Paperclip button: pick a photo, a video or a file. The browser file picker does the rest.
export function AttachMenu({ onPick, disabled }: { onPick: (file: File) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const inputs = useRef<Partial<Record<AttachmentKind, HTMLInputElement | null>>>({});

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          aria-label="Fayl biriktirish"
          className="text-muted hover:text-text hover:bg-surface focus-visible:ring-ring/50 inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150 outline-none focus-visible:ring-3 disabled:opacity-50"
        >
          <Paperclip className="size-5" />
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="glass-panel w-56 gap-1 rounded-2xl p-1.5">
          {OPTIONS.map(({ kind, icon: Icon }) => (
            <button
              key={kind}
              type="button"
              onClick={() => {
                setOpen(false);
                inputs.current[kind]?.click();
              }}
              className="hover:bg-surface flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors duration-150"
            >
              <Icon className="text-primary size-5" aria-hidden />
              {ATTACHMENT_LABELS[kind]}
            </button>
          ))}
        </PopoverContent>
      </Popover>
      {OPTIONS.map(({ kind }) => (
        <input
          key={kind}
          ref={(el) => {
            inputs.current[kind] = el;
          }}
          type="file"
          accept={acceptFor(kind)}
          className="hidden"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ""; // the same file can be picked again
            if (file) onPick(file);
          }}
        />
      ))}
    </>
  );
}
