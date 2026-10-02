"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Icon } from "@iconify/react";

import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={cn("border-b border-border", className)} {...props} />;
}

type AccordionTriggerProps = React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
  /** Optional leading icon (Iconify name, e.g. "mdi:compass"), shown in a small tile. */
  icon?: string;
  /** Chevron icon (Iconify name). Rotates 180° while open. */
  chevronIcon?: string;
};

export function AccordionTrigger({
  className,
  children,
  icon,
  chevronIcon = "mdi:chevron-down",
  ...props
}: AccordionTriggerProps) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex flex-1 items-center justify-between gap-3 py-4 text-left text-sm font-medium outline-none transition-all hover:underline",
          "focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        <span className="flex min-w-0 items-center gap-3">
          {icon ? (
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon icon={icon} className="h-4 w-4" aria-hidden="true" />
            </span>
          ) : null}
          <span className="min-w-0">{children}</span>
        </span>

        <Icon
          icon={chevronIcon}
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

/**
 * Animates open/close without keyframes: the content stays mounted
 * (`forceMount`) and an inner grid transitions `grid-template-rows` between
 * 0fr and 1fr while the innermost wrapper clips overflow. `visibility`
 * transitions alongside so collapsed content drops out of the tab order and
 * accessibility tree once the collapse finishes. The transition lives on the
 * inner element because Radix briefly zeroes `transition-duration` on the
 * Content node itself whenever it toggles.
 */
export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content forceMount className="group/accordion-content text-sm" {...props}>
      <div
        className={cn(
          "grid transition-[grid-template-rows,visibility] duration-200 ease-out",
          "group-data-[state=open]/accordion-content:visible group-data-[state=open]/accordion-content:grid-rows-[1fr]",
          "group-data-[state=closed]/accordion-content:invisible group-data-[state=closed]/accordion-content:grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={cn("pb-4 pt-0", className)}>{children}</div>
        </div>
      </div>
    </AccordionPrimitive.Content>
  );
}
