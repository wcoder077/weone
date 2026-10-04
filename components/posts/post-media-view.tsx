"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PostMedia } from "@/lib/queries/posts";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import { useT } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

const IMAGE_CLASS = "max-h-72 sm:max-h-80 w-full rounded-2xl object-cover";

// A post's media: one photo or video, or (several photos) a swipeable carousel. The URL is a link to a stored file.
export function PostMediaView({ media, more = [] }: { media: PostMedia; more?: PostMedia[] }) {
  if (more.length > 0 && media.kind === "image") return <PhotoCarousel photos={[media, ...more]} />;
  return <SingleMedia media={media} />;
}

function SingleMedia({ media }: { media: PostMedia }) {
  if (media.kind === "video") {
    return (
      <video
        src={media.url}
        controls
        preload="none"
        playsInline
        aria-label={media.name}
        className="max-h-72 sm:max-h-80 w-full rounded-2xl bg-black"
      />
    );
  }
  return <ImageLightbox src={media.url} alt={media.name} className={IMAGE_CLASS} />;
}

// Scroll-snap row: a finger swipe or the arrow buttons move between photos, dots and "2/5" show where you are.
// The row scrolls sideways by itself, so the page-to-page swipe leaves it alone.
function PhotoCarousel({ photos }: { photos: PostMedia[] }) {
  const t = useT();
  const rowRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function go(next: number) {
    const row = rowRef.current;
    if (!row) return;
    const target = Math.max(0, Math.min(photos.length - 1, next));
    row.scrollTo({ left: target * row.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="relative" role="group" aria-roledescription={t("karusel")} aria-label={t("{n} ta rasm", { n: photos.length })}>
      <div
        ref={rowRef}
        data-no-swipe
        onScroll={(event) => {
          const row = event.currentTarget;
          setIndex(Math.round(row.scrollLeft / Math.max(1, row.clientWidth)));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((photo, i) => (
          <div key={photo.url} className="w-full shrink-0 snap-center" aria-hidden={i !== index}>
            <ImageLightbox src={photo.url} alt={photo.name} className={IMAGE_CLASS} />
          </div>
        ))}
      </div>

      <span className="bg-bg/70 text-text pointer-events-none absolute top-2 right-2 rounded-full px-2.5 py-1 text-[12px] font-medium tabular-nums backdrop-blur">
        {index + 1}/{photos.length}
      </span>

      {index > 0 ? <ArrowButton side="left" label={t("Oldingi rasm")} onClick={() => go(index - 1)} /> : null}
      {index < photos.length - 1 ? <ArrowButton side="right" label={t("Keyingi rasm")} onClick={() => go(index + 1)} /> : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5" aria-hidden>
        {photos.map((photo, i) => (
          <span key={photo.url} className={cn("size-1.5 rounded-full transition-colors", i === index ? "bg-primary" : "bg-bg/70")} />
        ))}
      </div>
    </div>
  );
}

// Arrows are for mouse users; on touch the swipe is enough.
function ArrowButton({ side, label, onClick }: { side: "left" | "right"; label: string; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "bg-bg/70 text-text hover:bg-bg absolute top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur transition-colors pointer-fine:inline-flex",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
