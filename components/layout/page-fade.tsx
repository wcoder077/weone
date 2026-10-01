"use client";

import type { ReactNode } from "react";
import { useSelectedLayoutSegment } from "next/navigation";

// Fades the page in when moving to another section (home → messages …).
// Keyed by the top segment only, so switching chats or profiles inside a
// section doesn't remount shared layouts like the conversation list.
export function PageFade({ children }: { children: ReactNode }) {
  const segment = useSelectedLayoutSegment();
  return (
    <div key={segment ?? ""} className="animate-page-in">
      {children}
    </div>
  );
}
