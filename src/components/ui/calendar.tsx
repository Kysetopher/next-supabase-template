"use client";

import { DayPicker } from "react-day-picker";
import { Icon } from "@iconify/react";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * react-day-picker v10 ships no default stylesheet — every part is restyled
 * through `classNames`, keyed by the exact UI/DayFlag/SelectionState strings
 * its types export (confirmed against the installed version's own .d.ts,
 * not assumed, since these keys have changed across major versions).
 *
 * Modifier classes (`selected`/`today`/`outside`/`disabled`) attach to the
 * day *cell* (a `<td>`), not the visible round button inside it (confirmed
 * in the library's own source) — styling the primary fill there would leave
 * the cell's square corners showing past the button's rounded ones. `day`
 * instead just marks `group`, and `day_button` reads the cell's matching
 * `data-selected`/`data-today` attributes via `group-data-*` so the actual
 * fill and the rounding live on the same element.
 */
export function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn("p-1", className)}
      classNames={{
        months: "flex flex-col gap-2",
        month: "flex flex-col gap-2",
        month_caption: "flex items-center justify-center px-8 py-1 text-sm font-medium text-foreground",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-1 top-1 flex items-center justify-between",
        button_previous:
          "flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-30",
        button_next:
          "flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-30",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-8 text-center text-xs font-normal text-muted-foreground",
        week: "flex w-full",
        day: "group p-0 text-center text-sm",
        day_button:
          "flex h-8 w-8 items-center justify-center rounded-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground " +
          "group-data-[selected]:bg-primary group-data-[selected]:text-primary-foreground group-data-[selected]:hover:bg-primary " +
          "group-data-[today]:text-primary group-data-[today]:font-medium " +
          "group-data-[outside]:text-muted-foreground/40 group-data-[disabled]:pointer-events-none group-data-[disabled]:text-muted-foreground/30",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) => (
          <Icon
            icon={orientation === "left" ? "mdi:chevron-left" : "mdi:chevron-right"}
            className={cn("h-4 w-4", chevronClassName)}
            aria-hidden="true"
          />
        ),
      }}
      {...props}
    />
  );
}
