"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { addMonths, format, startOfMonth } from "date-fns";
import SimpleBar from "simplebar-react";

import type {
  CalendarCategories,
  CalendarEvent,
  CalendarLabels,
  RenderCalendarEvent,
  WeekStartsOn,
} from "@/lib/calendar/types";
import {
  DEFAULT_CALENDAR_LABELS,
  dayKey,
  formatCompactTime,
  formatEventWhen,
  getEventColorClasses,
  getEventStart,
  getMonthGridDays,
  getWeekdayLabels,
  groupEventsByDay,
  monthKey,
} from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";

export type MonthCalendarProps<TMeta = unknown> = {
  events: readonly CalendarEvent<TMeta>[];
  /** The active month (any date inside it). */
  date: Date;
  /** Fired with the 1st of whichever month scrolls to the center of the viewport. */
  onDateChange: (date: Date) => void;
  /** Fired when a day cell is clicked. */
  onSelectDate?: (date: Date) => void;
  onSelectEvent?: (event: CalendarEvent<TMeta>) => void;
  /** Fired by a day's "+N more" link; defaults to `onSelectDate`. */
  onShowMore?: (date: Date) => void;
  renderEvent?: RenderCalendarEvent<TMeta>;
  categories?: CalendarCategories;
  labels?: Partial<CalendarLabels>;
  weekStartsOn?: WeekStartsOn;
  /** Current time, for the today highlight; `null`/omitted shows none. */
  now?: Date | null;
  selectedDate?: Date | null;
  maxEventsPerDay?: number;
  className?: string;
};

function initialMonths(date: Date) {
  const current = startOfMonth(date);
  return [addMonths(current, -1), current, addMonths(current, 1)];
}

/**
 * Vertically scrolling month grid that loads months endlessly in both
 * directions and reports the month in view through `onDateChange`.
 * Needs a parent with a definite height.
 */
export function MonthCalendar<TMeta = unknown>({
  events,
  date,
  onDateChange,
  onSelectDate,
  onSelectEvent,
  onShowMore,
  renderEvent,
  categories,
  labels,
  weekStartsOn = 0,
  now = null,
  selectedDate,
  maxEventsPerDay = 3,
  className,
}: MonthCalendarProps<TMeta>) {
  const text = { ...DEFAULT_CALENDAR_LABELS, ...labels };
  const scrollRef = useRef<React.ComponentRef<typeof SimpleBar>>(null);
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [months, setMonths] = useState<Date[]>(() => initialMonths(date));
  const [anchorKey, setAnchorKey] = useState(() => monthKey(date));
  // Last month reported to onDateChange by scrolling; null after a reset.
  const [scrolledKey, setScrolledKey] = useState<string | null>(null);
  // Bumped whenever the scroll position should snap back to the active month.
  const [snapToken, setSnapToken] = useState(0);

  // Reset the rendered months when `date` changes externally (not from scrolling).
  const currentKey = monthKey(date);
  if (currentKey !== anchorKey) {
    setAnchorKey(currentKey);
    if (currentKey !== scrolledKey) {
      setMonths(initialMonths(date));
      setScrolledKey(null);
      setSnapToken((t) => t + 1);
    }
  }

  const eventsByDay = useMemo(() => groupEventsByDay(events), [events]);
  const weekdays = useMemo(() => getWeekdayLabels(weekStartsOn), [weekStartsOn]);

  // Report whichever month sits at the vertical center of the viewport.
  const updateVisibleMonth = useCallback(() => {
    const scrollEl = scrollRef.current?.getScrollElement();
    if (!scrollEl || scrollEl.clientHeight === 0) return;
    const center = scrollEl.scrollTop + scrollEl.clientHeight / 2;
    for (const m of months) {
      const key = monthKey(m);
      const el = monthRefs.current.get(key);
      if (!el) continue;
      if (el.offsetTop <= center && el.offsetTop + el.offsetHeight > center) {
        if (scrolledKey !== key) {
          setScrolledKey(key);
          // Already the active month (e.g. the snap on mount): keep the caller's day.
          if (key !== currentKey) onDateChange(m);
        }
        break;
      }
    }
  }, [months, scrolledKey, currentKey, onDateChange]);

  // Endless loading in both directions + visible-month reporting.
  const handleScroll = useCallback(() => {
    const scrollEl = scrollRef.current?.getScrollElement();
    if (!scrollEl) return;
    const firstEl = monthRefs.current.get(monthKey(months[0]));
    const lastEl = monthRefs.current.get(monthKey(months[months.length - 1]));
    const topThreshold = firstEl?.offsetHeight ?? 0;
    const bottomThreshold = lastEl?.offsetHeight ?? 0;
    if (scrollEl.scrollTop < topThreshold) {
      const newMonth = addMonths(months[0], -1);
      setMonths((prev) => [newMonth, ...prev]);
      // Keep the visible content still while the new month is inserted above it.
      requestAnimationFrame(() => {
        const el = monthRefs.current.get(monthKey(newMonth));
        if (el) scrollEl.scrollTop += el.offsetHeight;
      });
    } else if (scrollEl.scrollTop + scrollEl.clientHeight > scrollEl.scrollHeight - bottomThreshold) {
      const newMonth = addMonths(months[months.length - 1], 1);
      setMonths((prev) => [...prev, newMonth]);
    }
    updateVisibleMonth();
  }, [months, updateVisibleMonth]);

  // Snap to the active month after a programmatic reset (and on mount).
  useLayoutEffect(() => {
    const scrollEl = scrollRef.current?.getScrollElement();
    const activeEl = monthRefs.current.get(anchorKey);
    if (scrollEl && activeEl) scrollEl.scrollTop = activeEl.offsetTop;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only snap on reset, not on every month change
  }, [snapToken]);

  useEffect(() => {
    const scrollEl = scrollRef.current?.getScrollElement();
    if (!scrollEl) return;
    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const activeYear = date.getFullYear();
  const activeMonth = date.getMonth();
  const todayKey = now ? dayKey(now) : null;
  const selectedKey = selectedDate ? dayKey(selectedDate) : null;
  const showMore = onShowMore ?? onSelectDate;

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}>
      <div className="grid shrink-0 grid-cols-7 border-b border-border bg-muted/50 p-2 text-center text-sm font-medium text-muted-foreground">
        {weekdays.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <SimpleBar ref={scrollRef} className="min-h-0 flex-1">
        {months.map((month) => (
          <div
            key={monthKey(month)}
            ref={(el) => {
              if (el) monthRefs.current.set(monthKey(month), el);
              else monthRefs.current.delete(monthKey(month));
            }}
            className="grid grid-cols-7 gap-px pb-px text-sm"
          >
            {getMonthGridDays(month, weekStartsOn).map((day) => {
              const dayNumber = day.getDate();
              const daysInMonth = new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate();
              const showMonth = dayNumber === 1 || dayNumber === daysInMonth;
              const key = dayKey(day);
              const dayEvents = eventsByDay.get(key) ?? [];
              const isActiveMonth = day.getFullYear() === activeYear && day.getMonth() === activeMonth;
              const isToday = key === todayKey;
              const isSelected = key === selectedKey;

              return (
                <div
                  key={key}
                  onClick={() => onSelectDate?.(day)}
                  className={cn(
                    "flex h-32 min-w-0 flex-col overflow-hidden px-0.5 py-1.5 md:px-1",
                    onSelectDate && "cursor-pointer",
                    isActiveMonth ? "bg-muted text-foreground" : "bg-background/20 text-muted-foreground",
                    isSelected && "ring-1 ring-inset ring-primary",
                  )}
                >
                  <div className="flex justify-end">
                    <span
                      className={cn(
                        "rounded-sm px-1 text-xs leading-5",
                        isToday && "bg-primary font-bold text-primary-foreground",
                      )}
                    >
                      {showMonth && <span className="mr-1">{format(day, "MMM")}</span>}
                      {dayNumber}
                    </span>
                  </div>
                  <div className="mt-1 flex min-h-0 flex-col gap-1 font-medium">
                    {dayEvents.slice(0, maxEventsPerDay).map((event) => {
                      const colors = getEventColorClasses(event, categories);
                      const start = getEventStart(event);
                      // Multi-day events only show their time on the day they start.
                      const showTime = !event.allDay && start && dayKey(start) === key;
                      return (
                        <button
                          key={event.id}
                          type="button"
                          aria-label={`${event.title}, ${formatEventWhen(event)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent?.(event);
                          }}
                          className="flex w-full min-w-0 items-center gap-1.5 rounded-sm bg-background/40 text-left text-xs hover:brightness-110"
                        >
                          <span className={cn("h-4 w-1 shrink-0 rounded-l-sm", colors.bar)} />
                          {renderEvent ? (
                            renderEvent(event, "month")
                          ) : (
                            <span className="truncate pr-1">
                              {showTime && <span className="mr-1 text-muted-foreground">{formatCompactTime(start)}</span>}
                              {event.title}
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {dayEvents.length > maxEventsPerDay && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          showMore?.(day);
                        }}
                        className="self-start px-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {text.more(dayEvents.length - maxEventsPerDay)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </SimpleBar>
    </div>
  );
}
