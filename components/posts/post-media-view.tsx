import type { PostMedia } from "@/lib/queries/posts";

// Photo (opens full size in a new tab) or video player. The URL is a signed link to a private file.
export function PostMediaView({ media }: { media: PostMedia }) {
  if (media.kind === "video") {
    return (
      <video
        src={media.url}
        controls
        preload="metadata"
        playsInline
        aria-label={media.name}
        className="max-h-[28rem] w-full rounded-2xl bg-black"
      />
    );
  }
  return (
    <a href={media.url} target="_blank" rel="noreferrer" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={media.url} alt={media.name} loading="lazy" className="max-h-[28rem] w-full rounded-2xl object-cover" />
    </a>
  );
}
