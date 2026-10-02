"use client";

import { useEffect, useState } from "react";

import { getRandomScrambleChar } from "@/lib/scramble";

interface UseScrambleTypingArgs {
  text: string;
  /** Milliseconds between rerolls of the scrambling characters (and between drain steps once typing ends). */
  scrambleSpeed: number;
  /** Accepted for API symmetry with the consumers; the typing cadence itself is driven by the consumer via `setTypedCount`. */
  delay: number;
  /** Fires once the trailing effect window has fully drained after typing finishes. */
  onComplete?: () => void;
}

/**
 * Splits a string that's being "typed out" into three segments:
 *
 * - `stableText`    — characters that have settled and render normally
 * - `normalEffect`  — the NORMAL_TRAIL_LENGTH characters just before the
 *                     scramble zone, shown plainly as a brief settle buffer
 * - `scrambleChars` — the newest characters, rerolled every `scrambleSpeed` ms
 *
 * The consumer owns the typing cadence and advances it via `setTypedCount`.
 */
export function useScrambleTyping({ text, scrambleSpeed, onComplete }: UseScrambleTypingArgs) {
  // Kept short deliberately — for short strings the scramble portion is what's
  // actually visible, so a large plain buffer leaves almost nothing to scramble.
  const NORMAL_TRAIL_LENGTH = 2;
  const EFFECT_AREA_LENGTH = 12; // NORMAL_TRAIL_LENGTH + scramble portion

  const [typedCount, setTypedCount] = useState<number>(0);
  const [scrambleChars, setScrambleChars] = useState<string[]>([]);

  const isComplete = typedCount >= text.length;

  // While typing, the settled boundary trails typedCount by the effect window.
  // Once typing stops, typedCount never advances again, so for any text shorter
  // than the window every character would still be sitting in the effect zone.
  // Instead of snapping straight to "done" (which would skip the scramble stage
  // entirely for short strings), `drainedCount` keeps advancing on its own timer,
  // draining the window one character at a time until it reaches text.length.
  const [drainedCount, setDrainedCount] = useState(0);
  const trailingCount = Math.max(0, typedCount - EFFECT_AREA_LENGTH);
  const settledCount = isComplete ? Math.max(trailingCount, drainedCount) : trailingCount;

  useEffect(() => {
    if (!isComplete || settledCount >= text.length) return;
    const drainInterval = setInterval(() => {
      setDrainedCount((count) => Math.min(Math.max(count, trailingCount) + 1, text.length));
    }, scrambleSpeed);
    return () => clearInterval(drainInterval);
  }, [isComplete, settledCount, trailingCount, text.length, scrambleSpeed]);

  const stableText = text.slice(0, settledCount);
  const effectText = text.slice(settledCount, typedCount);
  const normalCount = Math.min(effectText.length, NORMAL_TRAIL_LENGTH);
  const normalEffect = effectText.slice(0, normalCount);
  const scrambleCount = Math.max(0, effectText.length - NORMAL_TRAIL_LENGTH);

  // Reroll the scramble characters on an interval while inside the scramble
  // zone. Rolled immediately on entry too — otherwise, at a slow scrambleSpeed,
  // a newly entered character would sit blank for a full tick.
  useEffect(() => {
    if (scrambleCount <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets scramble chars when the zone shrinks to nothing
      setScrambleChars([]);
      return;
    }
    const roll = () => setScrambleChars(Array.from({ length: scrambleCount }, () => getRandomScrambleChar()));
    roll();
    const scrambleInterval = setInterval(roll, scrambleSpeed);
    return () => clearInterval(scrambleInterval);
  }, [scrambleCount, scrambleSpeed]);

  // Fire onComplete once the trailing window has fully drained, not the instant
  // typing stops — otherwise callers (e.g. a fade-out) would cut the settle
  // animation short.
  const isDrained = isComplete && settledCount >= text.length;
  useEffect(() => {
    if (isDrained) onComplete?.();
  }, [isDrained, onComplete]);

  return {
    typedCount,
    setTypedCount,
    stableText,
    normalEffect,
    scrambleChars,
  };
}
