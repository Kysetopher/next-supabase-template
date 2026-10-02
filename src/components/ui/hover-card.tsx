"use client";

import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { Icon } from "@iconify/react";

import { cn } from "@/lib/utils";

export const HoverCard = HoverCardPrimitive.Root;
export const HoverCardTrigger = HoverCardPrimitive.Trigger;

/** Floating preview shown on hover/focus of the trigger. Same surface as Popover. */
export function HoverCardContent({
  className,
  align = "center",
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-md bg-secondary p-4 text-sm text-secondary-foreground shadow-md outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-hover-card-content-transform-origin)",
          className
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  );
}

/** Small external-link pill for use inside HoverCardContent; opens in a new tab. */
export function HoverCardLink({
  href,
  children = "Open link",
  className,
  icon = "mdi:open-in-new",
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
  icon?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent",
        className
      )}
    >
      <span>{children}</span>
      <Icon icon={icon} className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}
