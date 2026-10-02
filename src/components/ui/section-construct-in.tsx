"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import SimpleBar from "simplebar-react";

import { cn } from "@/lib/utils";

export type SectionConstructInProps = HTMLMotionProps<"div"> & {
  children: React.ReactNode;
  className?: string;
  /** Seconds before the border starts drawing. */
  delay?: number;
  /** Seconds for the border to finish drawing; content fades in near the end. */
  duration?: number;
  /** Fraction of the element that must be visible to trigger (0-1). */
  amount?: number;
  once?: boolean;
  /** Class applied to the animated border rect — use a `stroke-*` utility. */
  strokeClassName?: string;
  /** Stroke width in viewBox units (the box is a 100x100 viewBox stretched to fit). */
  strokeWidth?: number;
  cornerRadius?: number;
  /** Duration of the text "decode" effect in ms. */
  scrambleDurationMs?: number;
  /** Character pool for the text decode effect. */
  scrambleChars?: string;
  /** Wrap the content in a SimpleBar scroll area capped at `maxHeight`. */
  scrollable?: boolean;
  maxHeight?: string;
  scrollAreaClassName?: string;
};

const DEFAULT_SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

/**
 * Replaces every non-blank text node under `root` with a span that decodes
 * from random characters into the original text. Subtrees marked with
 * `data-no-scramble="true"` are skipped.
 *
 * Note: this mutates the DOM directly (outside React), so text nodes it
 * touches are swapped for spans React doesn't know about. Use it only on
 * content that won't re-render its text after the reveal.
 */
function animateScrambleText(root: HTMLElement, totalDurationMs: number, chars: string) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const targets: Array<{ node: Text; original: string }> = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const original = node.nodeValue ?? "";
    if (!original.trim()) continue;
    if (node.parentElement?.closest("[data-no-scramble='true']")) continue;
    targets.push({ node, original });
  }

  targets.forEach(({ node, original }, index) => {
    const span = document.createElement("span");
    span.style.whiteSpace = "pre-wrap";
    node.parentNode?.replaceChild(span, node);

    const localDuration = Math.max(260, totalDurationMs + index * 32);
    const start = performance.now();

    const frame = (now: number) => {
      const progress = Math.min(1, (now - start) / localDuration);
      const revealCount = Math.floor(original.length * progress);

      span.textContent =
        progress >= 1
          ? original
          : original
              .split("")
              .map((ch, i) => (/\s/.test(ch) || i < revealCount ? ch : chars[Math.floor(Math.random() * chars.length)]))
              .join("");

      if (progress < 1) requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  });
}

/**
 * A section that "constructs" itself when scrolled into view: its border
 * draws in around the box, then the content fades in while its text decodes
 * from scrambled characters. Respects `prefers-reduced-motion` (the decode
 * effect is skipped).
 */
export function SectionConstructIn({
  children,
  className,
  delay = 0,
  duration = 3,
  amount = 0.2,
  once = true,
  transition,
  strokeClassName = "stroke-primary",
  strokeWidth = 0.1,
  cornerRadius = 0,
  scrambleDurationMs = 820,
  scrambleChars = DEFAULT_SCRAMBLE_CHARS,
  scrollable = false,
  maxHeight = "calc(100vh - 60px)",
  scrollAreaClassName,
  style,
  ...props
}: SectionConstructInProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const rectMeasureRef = React.useRef<SVGRectElement | null>(null);

  const isInView = useInView(ref, { once, amount });
  const shouldReduceMotion = useReducedMotion();
  const hasScrambledRef = React.useRef(false);
  const [pathLength, setPathLength] = React.useState(0);

  const childDelay = delay + duration * 0.72;
  const childDuration = Math.max(0.22, duration * 0.42);

  React.useLayoutEffect(() => {
    if (!rectMeasureRef.current) return;
    setPathLength(rectMeasureRef.current.getTotalLength());
  }, []);

  React.useEffect(() => {
    if (!ref.current || !isInView || hasScrambledRef.current) return;
    hasScrambledRef.current = true;
    if (shouldReduceMotion) return;

    const timeout = window.setTimeout(() => {
      if (ref.current) animateScrambleText(ref.current, scrambleDurationMs, scrambleChars);
    }, Math.max(0, childDelay * 1000));

    return () => window.clearTimeout(timeout);
  }, [isInView, childDelay, scrambleDurationMs, scrambleChars, shouldReduceMotion]);

  const dash = pathLength > 0 ? `${pathLength} ${pathLength}` : undefined;

  const content = (
    <motion.div
      className="relative z-10 min-w-0"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once, amount }}
      transition={{ delay: childDelay, duration: childDuration, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );

  return (
    <motion.div
      ref={ref}
      className={cn("relative box-border w-full min-w-0 bg-transparent p-4", className)}
      style={style}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: "easeOut", ...transition }}
      {...props}
    >
      {scrollable ? (
        <SimpleBar style={{ maxHeight }} className={cn("relative z-10 min-w-0", scrollAreaClassName)} autoHide={false}>
          {content}
        </SimpleBar>
      ) : (
        content
      )}

      <svg
        aria-hidden="true"
        data-no-scramble="true"
        className="pointer-events-none absolute inset-0"
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <rect
          ref={rectMeasureRef}
          x="0.5"
          y="0.5"
          width="99"
          height="99"
          rx={cornerRadius}
          ry={cornerRadius}
          fill="none"
          stroke="transparent"
          strokeWidth={strokeWidth}
        />

        {pathLength > 0 && (
          <motion.rect
            x="0.5"
            y="0.5"
            width="99"
            height="99"
            rx={cornerRadius}
            ry={cornerRadius}
            fill="none"
            className={strokeClassName}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeLinejoin="miter"
            strokeDasharray={dash}
            initial={{ strokeDashoffset: pathLength }}
            whileInView={{ strokeDashoffset: 0 }}
            viewport={{ once, amount }}
            transition={{ delay, duration, ease: "easeInOut" }}
          />
        )}
      </svg>
    </motion.div>
  );
}
