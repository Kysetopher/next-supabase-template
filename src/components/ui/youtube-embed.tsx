import { cn } from "@/lib/utils";

export interface YouTubeEmbedProps {
  /** Any watch/share/embed/shorts URL. A `list=` param embeds the playlist. */
  url?: string;
  videoId?: string;
  playlistId?: string;
  /** Start offset in seconds (single videos only). */
  start?: number;
  /** Use the youtube-nocookie.com domain, which doesn't set cookies until playback. */
  privacyEnhanced?: boolean;
  /** Accessible title for the iframe. */
  title?: string;
  className?: string;
  /** Defaults to a 16:9 aspect ratio; override for e.g. a compact audio-style player (`aspect-auto h-38`). */
  iframeClassName?: string;
  loading?: "eager" | "lazy";
  /** Shown instead of the player when no valid id could be resolved. */
  fallback?: React.ReactNode;
}

const YOUTUBE_HOST = /(^|\.)youtube(-nocookie)?\.com$/;

function parseUrl(value: string): URL | null {
  try {
    return new URL(value.trim());
  } catch {
    return null;
  }
}

function extractVideoId(parsed: URL): string | null {
  const host = parsed.hostname.toLowerCase();
  const segments = parsed.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") return segments[0] ?? null;

  if (YOUTUBE_HOST.test(host)) {
    if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
    // /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
    if (["embed", "shorts", "live", "v"].includes(segments[0] ?? "") && segments[1] && segments[1] !== "videoseries") {
      return segments[1];
    }
  }

  return null;
}

function buildEmbedSrc({
  url,
  videoId,
  playlistId,
  start,
  privacyEnhanced,
}: Pick<YouTubeEmbedProps, "url" | "videoId" | "playlistId" | "start" | "privacyEnhanced">): string | null {
  const parsed = url ? parseUrl(url) : null;
  const resolvedPlaylistId = playlistId ?? parsed?.searchParams.get("list") ?? null;
  const resolvedVideoId = videoId ?? (parsed ? extractVideoId(parsed) : null);
  const base = privacyEnhanced ? "https://www.youtube-nocookie.com/embed" : "https://www.youtube.com/embed";

  if (resolvedPlaylistId) {
    return `${base}/videoseries?list=${encodeURIComponent(resolvedPlaylistId)}`;
  }

  if (resolvedVideoId) {
    const params = new URLSearchParams();
    if (start && start > 0) params.set("start", String(Math.floor(start)));
    const query = params.toString();
    return `${base}/${encodeURIComponent(resolvedVideoId)}${query ? `?${query}` : ""}`;
  }

  return null;
}

/** A responsive YouTube video or playlist embed, from a URL or explicit ids. */
export function YouTubeEmbed({
  url,
  videoId,
  playlistId,
  start,
  privacyEnhanced = true,
  title = "YouTube video player",
  className,
  iframeClassName,
  loading = "lazy",
  fallback,
}: YouTubeEmbedProps) {
  const src = buildEmbedSrc({ url, videoId, playlistId, start, privacyEnhanced });

  if (!src) {
    return (
      <div className={cn("rounded-md border border-border bg-muted p-3 text-xs text-muted-foreground", className)}>
        {fallback ?? "Invalid YouTube URL or ID."}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-md border border-border", className)}>
      <iframe
        title={title}
        src={src}
        className={cn("block aspect-video w-full", iframeClassName)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        loading={loading}
      />
    </div>
  );
}
