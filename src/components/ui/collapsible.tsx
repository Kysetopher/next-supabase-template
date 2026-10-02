"use client";

import { useCallback, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { Icon } from "@iconify/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/*
 * Raw Radix parts, for layouts the all-in-one `Collapsible` below doesn't
 * cover (trigger far from the content, several triggers, etc.).
 */
export const CollapsibleRoot = CollapsiblePrimitive.Root;
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger;
export const CollapsibleContent = CollapsiblePrimitive.Content;

export type CollapsibleProps = {
  /** Controlled open state. Leave undefined for uncontrolled. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Fully custom trigger contents, given the current open state. Replaces the chevron + label. */
  trigger?: (open: boolean) => ReactNode;
  /** Label rendered next to the chevron in the default trigger. */
  label?: ReactNode;
  /** Accessible name for the trigger when it has no visible text; also the fallback label text. */
  triggerLabel?: string;
  children?: ReactNode;
  disabled?: boolean;
  /** id of the content region (auto-generated if omitted). */
  id?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  /** Skip the height animation on first render so initially-open content doesn't animate in. */
  mountNoAnimate?: boolean;
  chevronIcon?: string;
  transitionMs?: number;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "id">;

/**
 * Disclosure with a chevron trigger and a measured height animation
 * (animates from 0 to scrollHeight, then releases to `auto` so content can
 * keep growing). Works controlled (`open` + `onOpenChange`) or uncontrolled.
 */
export function Collapsible({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  label,
  triggerLabel = "Toggle section",
  children,
  disabled,
  id,
  className,
  triggerClassName,
  contentClassName,
  mountNoAnimate = true,
  chevronIcon = "mdi:chevron-down",
  transitionMs = 200,
  ...rest
}: CollapsibleProps) {
  const autoId = useId();
  const contentId = id ?? `collapsible-${autoId}`;
  const isControlled = typeof open === "boolean";
  const [internalOpen, setInternalOpen] = useState<boolean>(defaultOpen ?? false);
  const isOpen = isControlled ? open : internalOpen;

  const contentRef = useRef<HTMLDivElement | null>(null);
  const firstMountRef = useRef(true);

  const toggle = useCallback(() => {
    if (disabled) return;
    const next = !isOpen;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }, [disabled, isOpen, isControlled, onOpenChange]);

  // Height animation: measure scrollHeight, transition to it, then release to auto.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    el.style.transition = `height ${transitionMs}ms ease`;
    const full = el.scrollHeight;

    if (firstMountRef.current && mountNoAnimate) {
      firstMountRef.current = false;
      el.style.height = isOpen ? "auto" : "0px";
      el.style.overflow = isOpen ? "visible" : "hidden";
      return;
    }
    firstMountRef.current = false;

    el.style.overflow = "hidden";
    el.style.height = isOpen ? "0px" : `${full}px`;
    void el.offsetHeight; // force reflow so the next height change transitions
    el.style.height = isOpen ? `${full}px` : "0px";

    if (!isOpen) return;
    const onEnd = () => {
      el.style.height = "auto";
      el.style.overflow = "visible";
    };
    el.addEventListener("transitionend", onEnd, { once: true });
    return () => el.removeEventListener("transitionend", onEnd);
  }, [isOpen, mountNoAnimate, transitionMs]);

  const hasLabel = label !== undefined && label !== null;

  const defaultTrigger = (
    <>
      {/* Fixed-size chevron box so nested rows line up. */}
      <span className="inline-flex h-5 w-5 flex-none items-center justify-center" aria-hidden="true">
        <Icon
          icon={chevronIcon}
          className="h-4 w-4 transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </span>
      {hasLabel ? (
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {typeof label === "string" ? <span className="truncate">{label}</span> : label}
        </span>
      ) : null}
    </>
  );

  return (
    <div
      className={cn("data-[disabled=true]:opacity-50", className)}
      data-disabled={!!disabled}
      data-open={isOpen}
      {...rest}
    >
      <Button
        type="button"
        variant="ghost"
        className={cn(
          "overflow-hidden",
          trigger || hasLabel ? "h-auto min-h-6 w-full justify-start gap-2 px-1 py-1" : "h-6 w-6 p-0",
          triggerClassName
        )}
        aria-expanded={isOpen}
        aria-controls={contentId}
        aria-label={trigger || !hasLabel ? triggerLabel : undefined}
        onClick={toggle}
        disabled={disabled}
      >
        {trigger ? trigger(isOpen) : defaultTrigger}
      </Button>

      <div
        id={contentId}
        role="region"
        aria-hidden={!isOpen}
        inert={!isOpen}
        ref={contentRef}
        className={cn("block overflow-hidden will-change-[height]", contentClassName)}
        style={{ height: 0 }}
      >
        {children}
      </div>
    </div>
  );
}
