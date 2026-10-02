"use client";

import { Icon } from "@iconify/react";

import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  /** When set, renders a trash-can button — removal is the defining feature of a tag, not a bolt-on. */
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
};

/** Solid grey, no border — same convention as every other control (Select, Input, Command), not the primary color reserved for buttons/focus/links. */
export function Badge({ children, onRemove, removeLabel = "Remove", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-secondary py-0.5 pl-2 text-xs text-secondary-foreground",
        onRemove ? "pr-0.5" : "pr-2",
        className
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="flex items-center justify-center rounded-full p-1 text-secondary-foreground/70 transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          <Icon icon="mdi:trash-can-outline" className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
