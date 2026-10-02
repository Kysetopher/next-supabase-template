"use client";

import { HoverCard, HoverCardContent, HoverCardLink, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

/** One citation. `authors` is expected as "Last, F. M." — the chip shows the text before the first comma. */
export type ReferenceRecord = {
  id: string;
  authors: string;
  year?: string;
  title: string;
  source?: string;
  note?: string;
  href?: string;
  tag?: string;
};

export type ReferenceMap = Record<string, ReferenceRecord>;

function getShortAuthor(authors: string) {
  return authors.split(",")[0].trim();
}

type ReferenceChipProps<TMap extends ReferenceMap> = {
  refs: TMap;
  id: keyof TMap;
  openDelay?: number;
  closeDelay?: number;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  /** Prefix shown before `note` in the card. */
  noteLabel?: string;
  /** Text of the external link shown when `href` is set. */
  linkLabel?: string;
};

/**
 * Inline citation chip ("Author 2021") that reveals the full reference in a
 * hover card. Pass the whole reference map plus the id to show; unknown ids
 * render nothing.
 */
export function ReferenceChip<TMap extends ReferenceMap>({
  refs,
  id,
  openDelay = 120,
  closeDelay = 80,
  align = "start",
  side = "top",
  className,
  noteLabel = "Note:",
  linkLabel = "View source",
}: ReferenceChipProps<TMap>) {
  const r = refs[String(id)];
  if (!r) return null;

  return (
    <HoverCard openDelay={openDelay} closeDelay={closeDelay}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] leading-none text-foreground/80 transition-colors",
            "hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className
          )}
          aria-label={`Reference: ${r.authors}${r.year ? ` (${r.year})` : ""}`}
        >
          {getShortAuthor(r.authors)}
          {r.year ? <span className="ml-1 text-muted-foreground">{r.year}</span> : null}
        </button>
      </HoverCardTrigger>

      <HoverCardContent align={align} side={side} className="w-[360px] max-w-[calc(100vw-2rem)] rounded-xl">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">
                {r.authors}
                {r.year ? <span className="text-muted-foreground"> ({r.year})</span> : null}
              </div>
              <div className="mt-1 text-sm leading-relaxed text-secondary-foreground/85">{r.title}</div>
              {r.source ? <div className="mt-1 text-xs text-muted-foreground">{r.source}</div> : null}
            </div>

            {r.tag ? (
              <div className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                {r.tag}
              </div>
            ) : null}
          </div>

          {r.note ? (
            <div className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-secondary-foreground/70">{noteLabel}</span> {r.note}
            </div>
          ) : null}

          {r.href ? (
            <div className="pt-1">
              <HoverCardLink href={r.href}>{linkLabel}</HoverCardLink>
            </div>
          ) : null}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
