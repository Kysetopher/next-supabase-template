"use client";

import * as React from "react";
import { Icon } from "@iconify/react";

import { cn } from "@/lib/utils";

export interface KebabMenuItem {
  label: string;
  /** Iconify icon name, e.g. "lucide:share". */
  icon?: string;
  /**
   * Return a short string to flash next to the menu as transient feedback
   * (e.g. "Link copied") — return nothing when the action already has its own
   * feedback (a native share sheet, a cancellation).
   */
  onSelect: () => void | string | Promise<string | void>;
}

export interface KebabMenuProps {
  items: KebabMenuItem[];
  /** Accessible label for the trigger button. */
  label?: string;
  /** Which edge of the trigger the menu aligns to. */
  align?: "start" | "end";
  /** How long feedback messages stay visible, in ms. */
  feedbackDurationMs?: number;
  className?: string;
}

/**
 * A lightweight vertical-ellipsis ("kebab") menu with click-outside and Escape
 * to close, and optional transient feedback after an action. For full keyboard
 * navigation, use `DropdownMenu` instead.
 */
export function KebabMenu({
  items,
  label = "More options",
  align = "end",
  feedbackDurationMs = 1500,
  className,
}: KebabMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const feedbackTimerRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(feedbackTimerRef.current), []);

  React.useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSelect(item: KebabMenuItem) {
    setOpen(false);
    const message = await item.onSelect();
    if (message) {
      setFeedback(message);
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), feedbackDurationMs);
    }
  }

  const alignClass = align === "end" ? "right-0" : "left-0";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon icon="lucide:ellipsis-vertical" className="size-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-20 mt-1 min-w-40 rounded-md border border-border bg-popover p-1 text-popover-foreground",
            alignClass
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation();
                void handleSelect(item);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none"
            >
              {item.icon && <Icon icon={item.icon} className="size-4" aria-hidden="true" />}
              {item.label}
            </button>
          ))}
        </div>
      )}

      {feedback && (
        <span
          role="status"
          className={cn(
            "pointer-events-none absolute top-full z-20 mt-1 whitespace-nowrap rounded-sm bg-popover px-2 py-1 text-xs text-muted-foreground",
            alignClass
          )}
        >
          {feedback}
        </span>
      )}
    </div>
  );
}
