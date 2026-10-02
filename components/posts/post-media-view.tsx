import type { PostMedia } from "@/lib/queries/posts";
import { ImageLightbox } from "@/components/shared/image-lightbox";

// Photo (tap opens it large in the blurred viewer) or video player. The URL is a signed link to a private file.
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
  return <ImageLightbox src={media.url} alt={media.name} className="max-h-[28rem] w-full rounded-2xl object-cover" />;
}
