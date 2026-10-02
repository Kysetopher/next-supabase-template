"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SwipeCarouselConfig = {
  /** Horizontal drag distance (px) that commits a page change. */
  thresholdPx?: number;
  /** How much more horizontal than vertical a drag must be to lock horizontal. */
  lockRatio?: number;
  /** Slide-out animation length. */
  durationMs?: number;
};

/**
 * Touch-swipe paging for a three-panel strip [prev, current, next].
 *
 * Spread `handlers` on the container (give it `touch-action: pan-y` so the
 * browser leaves horizontal drags to us) and `style` on the strip, whose
 * children are each 100% wide. Swiping left calls `onNext`, right `onPrev`.
 */
export function useSwipeCarousel<T extends HTMLElement>(
  containerRef: React.RefObject<T | null>,
  onNext: () => void,
  onPrev: () => void,
  config: SwipeCarouselConfig = {},
) {
  const { thresholdPx = 80, lockRatio = 1.2, durationMs = 220 } = config;

  const startX = useRef(0);
  const startY = useRef(0);
  const mode = useRef<"horizontal" | "vertical" | null>(null);
  const dragging = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const [dx, setDx] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Latest callbacks, so the animation timeout never fires a stale one.
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  useEffect(() => {
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;
  }, [onNext, onPrev]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (animating) return;
      const t = e.touches[0];
      startX.current = t.clientX;
      startY.current = t.clientY;
      mode.current = null;
      dragging.current = true;
      setDx(0);
    },
    [animating],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging.current || animating) return;
      const t = e.touches[0];
      const moveX = t.clientX - startX.current;
      const moveY = t.clientY - startY.current;

      if (mode.current === null) {
        const ax = Math.abs(moveX);
        const ay = Math.abs(moveY);
        if (ax < 6 && ay < 6) return;
        mode.current = ax > ay * lockRatio ? "horizontal" : "vertical";
      }
      // React touch listeners are passive, so no preventDefault here — the
      // container's `touch-action: pan-y` already stops horizontal page panning.
      if (mode.current === "horizontal") setDx(moveX);
    },
    [animating, lockRatio],
  );

  const finish = useCallback(
    (commit: "next" | "prev" | "cancel") => {
      setAnimating(true);
      const width = containerRef.current?.getBoundingClientRect().width ?? 0;
      setDx(commit === "prev" ? width : commit === "next" ? -width : 0);

      timer.current = window.setTimeout(() => {
        if (commit === "prev") onPrevRef.current();
        if (commit === "next") onNextRef.current();
        setDx(0);
        setAnimating(false);
      }, durationMs);
    },
    [containerRef, durationMs],
  );

  const onTouchEnd = useCallback(() => {
    if (!dragging.current || animating) return;
    dragging.current = false;
    if (mode.current !== "horizontal") {
      setDx(0);
      return;
    }
    if (Math.abs(dx) >= thresholdPx) finish(dx > 0 ? "prev" : "next");
    else finish("cancel");
  }, [animating, dx, finish, thresholdPx]);

  const handlers = useMemo(
    () => ({ onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd }),
    [onTouchStart, onTouchMove, onTouchEnd],
  );

  const style = useMemo<React.CSSProperties>(
    () => ({
      transform: `translateX(calc(-100% + ${dx}px))`,
      transition: animating ? `transform ${durationMs}ms ease-out` : "none",
      willChange: "transform",
    }),
    [dx, animating, durationMs],
  );

  return { handlers, style, animating };
}
