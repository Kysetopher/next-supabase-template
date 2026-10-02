"use client";

import * as React from "react";
import { motion, useInView, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

export type SectionFadeInProps = HTMLMotionProps<"div"> & {
  children: React.ReactNode;
  className?: string;
  /** Minimum seconds after mount before the content may animate in (it still waits for the viewport). */
  delay?: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Fraction of the element that must be visible to trigger (0-1). */
  amount?: number;
  /** Vertical offset in px the content rises from. */
  distance?: number;
  /** Only animate the first time it enters the viewport. */
  once?: boolean;
};

/** Fades and slides its children up when the section scrolls into view. */
export function SectionFadeIn({
  children,
  className,
  delay = 0,
  duration = 0.7,
  amount = 0.2,
  distance = 32,
  once = true,
  transition,
  ...props
}: SectionFadeInProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once, amount });
  const [delayElapsed, setDelayElapsed] = React.useState(false);

  React.useEffect(() => {
    if (delay <= 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restarts the delay gate when the `delay` prop changes
    setDelayElapsed(false);
    const timeout = window.setTimeout(() => setDelayElapsed(true), delay * 1000);
    return () => window.clearTimeout(timeout);
  }, [delay]);

  const shouldShow = isInView && (delay <= 0 || delayElapsed);

  return (
    <div ref={ref} className={cn(className)}>
      <motion.div
        initial={{ opacity: 0, y: distance }}
        animate={shouldShow ? { opacity: 1, y: 0 } : { opacity: 0, y: distance }}
        transition={{ duration, ease: "easeOut", ...transition }}
        {...props}
      >
        {children}
      </motion.div>
    </div>
  );
}
