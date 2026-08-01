import { cn } from "@/lib/utils";

// A minimal iPhone-style device frame for showcasing a generated reel —
// autoplaying, muted, looping, exactly how a viewer would actually see it.
export function PhoneMockup({
  videoUrl,
  posterUrl,
  className,
}: {
  videoUrl?: string;
  posterUrl?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[9/19.5] w-full max-w-70 rounded-[2.75rem] border-[6px] border-neutral-900 bg-neutral-900 shadow-2xl shadow-black/30 ring-1 ring-black/10",
        className
      )}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[2.25rem] bg-black">
        {videoUrl ? (
          <video
            src={videoUrl}
            poster={posterUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="size-full object-cover"
          />
        ) : posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterUrl} alt="" className="size-full object-cover" />
        ) : null}
      </div>
      <div className="absolute top-2 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-neutral-900" />
    </div>
  );
}
