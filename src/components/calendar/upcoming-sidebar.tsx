"use client";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { startOfDay } from "date-fns";
import SimpleBar from "simplebar-react";

import type { CalendarCategories, CalendarEvent, CalendarLabels, RenderCalendarEvent } from "@/lib/calendar/types";
import {
  DEFAULT_CALENDAR_LABELS,
  formatEventWhen,
  getCategoryColorClass,
  getEventColorClasses,
  getEventEnd,
  getEventStart,
} from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";

export type UpcomingSidebarProps<TMeta = unknown> = {
  events: readonly CalendarEvent<TMeta>[];
  /** Events ending on or after the start of this day are listed. `null` (e.g. before hydration) lists nothing. */
  now: Date | null;
  onSelectEvent?: (event: CalendarEvent<TMeta>) => void;
  /** Renders a close button when provided. */
  onClose?: () => void;
  renderEvent?: RenderCalendarEvent<TMeta>;
  /** When given, the header gets one toggle chip per category to filter the list. */
  categories?: CalendarCategories;
  labels?: Partial<CalendarLabels>;
  /** Cap on listed events. */
  limit?: number;
  className?: string;
};

/** Chronological list of what's coming up, with optional category filters. */
export function UpcomingSidebar<TMeta = unknown>({
  events,
  now,
  onSelectEvent,
  onClose,
  renderEvent,
  categories,
  labels,
  limit = 50,
  className,
}: UpcomingSidebarProps<TMeta>) {
  const text = { ...DEFAULT_CALENDAR_LABELS, ...labels };
  const [activeCategories, setActiveCategories] = useState<ReadonlySet<string>>(() => new Set());
  const categoryEntries = categories ? Object.entries(categories) : [];
  const from = now ? startOfDay(now).getTime() : null;

  const upcoming = useMemo(() => {
    if (from === null) return [];
    return events
      .filter((event) => (getEventEnd(event)?.getTime() ?? -Infinity) >= from)
      .filter((event) => activeCategories.size === 0 || (!!event.category && activeCategories.has(event.category)))
      .sort((a, b) => (getEventStart(a)?.getTime() ?? 0) - (getEventStart(b)?.getTime() ?? 0))
      .slice(0, limit);
  }, [events, from, activeCategories, limit]);

  const toggleCategory = (key: string) =>
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <aside className={cn("flex min-h-0 flex-col gap-3", className)}>
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">{text.upcoming}</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={text.hideUpcoming}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icon icon="lucide:x" className="size-4" />
          </button>
        )}
      </div>

      {categoryEntries.length > 0 && (
        <div role="group" aria-label={text.filterCategories} className="flex shrink-0 flex-wrap gap-1.5">
          {categoryEntries.map(([key, category]) => {
            const active = activeCategories.has(key);
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => toggleCategory(key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <span className={cn("size-2 rounded-full", getCategoryColorClass(category))} />
                {category.label}
              </button>
            );
          })}
        </div>
      )}

      {upcoming.length > 0 ? (
        <SimpleBar className="min-h-0 flex-1">
          <ul className="flex flex-col">
            {upcoming.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onSelectEvent?.(event)}
                  className="flex w-full items-stretch gap-2 rounded-sm py-2 pr-2 text-left transition-colors hover:bg-muted"
                >
                  <span className={cn("w-1 shrink-0 rounded-full", getEventColorClasses(event, categories).bar)} />
                  {renderEvent ? (
                    renderEvent(event, "upcoming")
                  ) : (
                    <span className="flex min-w-0 flex-col">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">{formatEventWhen(event)}</span>
                      <span className="truncate text-sm font-semibold text-foreground">{event.title}</span>
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </SimpleBar>
      ) : (
        now && <p className="text-sm text-muted-foreground">{text.noUpcoming}</p>
      )}
    </aside>
  );
}
