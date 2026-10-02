"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FormGalleryApi = {
  index: number;
  count: number;
  /** Advance to the next slide, or call `onFinish` on the last one. */
  next: () => void;
  goTo: (index: number) => void;
};

export type FormGallerySlide = {
  title?: string;
  /** Static content, or a render function that receives the gallery controls (for slides with their own submit). */
  content: React.ReactNode | ((api: FormGalleryApi) => React.ReactNode);
  /** Hide the shared Next button on this slide because the slide advances itself via `api.next()`. */
  hasInternalNext?: boolean;
};

type FormGalleryProps = {
  slides: FormGallerySlide[];
  /** Controlled slide index. Leave undefined for uncontrolled. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Called when Next is pressed on the last slide. */
  onFinish?: () => void | Promise<void>;
  nextLabel?: string;
  finishLabel?: string;
  className?: string;
};

/**
 * Multi-step form carousel: dot pager on top, horizontally sliding slides,
 * and a shared Next/Finish button. Off-screen slides are `inert` so their
 * fields can't be tabbed into.
 */
export function FormGallery({
  slides,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  onFinish,
  nextLabel = "Next",
  finishLabel = "Get started",
  className,
}: FormGalleryProps) {
  const [internalIndex, setInternalIndex] = useState(defaultIndex);
  const count = slides.length;
  const rawIndex = indexProp ?? internalIndex;
  const index = Math.min(Math.max(rawIndex, 0), Math.max(count - 1, 0));
  const isLast = index >= count - 1;

  const goTo = (i: number) => {
    const clamped = Math.min(Math.max(i, 0), Math.max(count - 1, 0));
    if (indexProp === undefined) setInternalIndex(clamped);
    onIndexChange?.(clamped);
  };

  const next = () => {
    if (isLast) {
      void onFinish?.();
      return;
    }
    goTo(index + 1);
  };

  const api: FormGalleryApi = { index, count, next, goTo };

  if (count === 0) return null;

  return (
    <div className={cn("flex h-full w-full flex-col gap-2", className)}>
      <div className="flex flex-row justify-end gap-2 p-2" role="tablist" aria-label="Steps">
        {slides.map((slide, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={slide.title ?? `Go to step ${i + 1}`}
            onClick={() => goTo(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              i === index ? "w-8 bg-primary" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground"
            )}
          />
        ))}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-300"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <div key={i} className="w-full shrink-0" aria-hidden={i !== index} inert={i !== index}>
              {typeof slide.content === "function" ? slide.content(api) : slide.content}
            </div>
          ))}
        </div>
      </div>

      {!slides[index]?.hasInternalNext ? (
        <Button type="button" onClick={next}>
          {isLast ? finishLabel : nextLabel}
        </Button>
      ) : null}
    </div>
  );
}
