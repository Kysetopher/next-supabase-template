"use client";

import type { ReactNode } from "react";
import SimpleBar from "simplebar-react";

import { cn } from "@/lib/utils";

/**
 * Full-viewport-height page scroller with SimpleBar's thin custom scrollbar.
 * Wrap a page's whole content in it (instead of letting the body scroll) so
 * the scrollbar matches the rest of the UI. The content element is a flex
 * column at least as tall as the viewport, so a footer can sit at the bottom
 * with `mt-auto`.
 */
export function PageScrollArea({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <SimpleBar
      className={cn("h-dvh", className)}
      classNames={{
        contentEl: "simplebar-content flex min-h-full flex-col",
      }}
    >
      {children}
    </SimpleBar>
  );
}
