"use client";

import { useCallback, useState } from "react";
import { MediaOverlay } from "./media-overlay";

// An image that opens large in the blurred viewer when tapped (instead of a new tab).
export function ImageLightbox({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`${alt} — kattalashtirish`}
        className="block max-w-full cursor-zoom-in"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className={className} />
      </button>
      {open ? (
        <MediaOverlay label={alt} onClose={close}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="animate-in zoom-in-95 max-h-[85dvh] max-w-full rounded-2xl object-contain shadow-2xl duration-200"
          />
        </MediaOverlay>
      ) : null}
    </>
  );
}
