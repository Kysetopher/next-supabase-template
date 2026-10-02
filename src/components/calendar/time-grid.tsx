"use client";

import { Fragment, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { format, isSameDay } from "date-fns";
import SimpleBar from "simplebar-react";

import { CurrentTimeIndicator } from "@/components/calendar/current-time-indicator";
import type {
  CalendarCategories,
  CalendarEvent,
  CalendarLabels,
  RenderCalendarEvent,
} from "@/lib/calendar/types";
import {
  allDayEventsFor,
  DEFAULT_CALENDAR_LABELS,
  formatEventWhen,
  formatTimeRange,
  getEventColorClasses,
  groupEventsByDay,
  layoutTimedEvents,
} from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";

const SLOTS = 48;
const MAX_ALL_DAY = 3;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const noopSubscribe = () => () => {};
/** Viewer's UTC offset label ("GMT-7"); empty on the server, whose zone may differ. */
function useZoneLabel() {
  return useSyncExternalStore(noopSubscribe, () => format(new Date(), "O"), () => "");
}

export type TimeGridProps<TMeta = unknown> = {
  days: Date[];
  events: readonly CalendarEvent<TMeta>[];
  /** Current time; `null`/omitted hides the now-line and today highlight. */
  now?: Date | null;
  selectedDate?: Date | null;
  /** Fired with the clicked 30-minute slot's start time. */
  onSelectDate?: (date: Date) => void;
  onSelectEvent?: (event: CalendarEvent<TMeta>) => void;
  renderEvent?: RenderCalendarEvent<TMeta>;
  categories?: CalendarCategories;
  labels?: Partial<CalendarLabels>;
  /** Pixel height of one 30-minute slot. */
  slotHeight?: number;
  /** Hour the grid is scrolled to on mount. */
  scrollToHour?: number;
  context: "week" | "day";
  className?: string;
};

/** Shared vertical time grid behind WeekView (7 columns) and DayView (1 column). */
export function TimeGrid<TMeta = unknown>({
  days,
  events,
  now = null,
  selectedDate,
  onSelectDate,
  onSelectEvent,
  renderEvent,
  categories,
  labels,
  slotHeight = 24,
  scrollToHour = 8,
  context,
  className,
}: TimeGridProps<TMeta>) {
  const text = { ...DEFAULT_CALENDAR_LABELS, ...labels };
  const zoneLabel = useZoneLabel();
  const scrollRef = useRef<React.ComponentRef<typeof SimpleBar>>(null);
  const totalHeight = SLOTS * slotHeight;

  const byDay = useMemo(() => groupEventsByDay(events), [events]);
  const columns = useMemo(
    () => days.map((day) => ({ day, allDay: allDayEventsFor(byDay, day), timed: layoutTimedEvents(events, day) })),
    [days, byDay, events],
  );
  const hasAllDay = columns.some((c) => c.allDay.length > 0);
  const showsToday = !!now && days.some((d) => isSameDay(d, now));
  const gridTemplateColumns = `3.5rem repeat(${days.length}, minmax(0, 1fr))`;

  useLayoutEffect(() => {
    const el = scrollRef.current?.getScrollElement();
    if (el) el.scrollTop = scrollToHour * 2 * slotHeight;
    // Only on mount: later re-renders must not yank the user's scroll position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col", className)}>
      <div className="shrink-0 border-b border-border bg-muted/50">
        <div className="grid text-sm font-medium text-muted-foreground" style={{ gridTemplateColumns }}>
          <div className="flex items-end justify-end px-2 pb-2 text-[10px]">{zoneLabel}</div>
          {days.map((day) => {
            const isToday = !!now && isSameDay(day, now);
            const isSelected = !!selectedDate && isSameDay(day, selectedDate);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex flex-col items-center py-2",
                  isToday && "text-primary",
                  isSelected && "bg-primary/10",
                )}
              >
                {context === "day" ? (
                  <span className="font-semibold">{format(day, "EEE d")}</span>
                ) : (
                  <>
                    <span className="hidden md:block">{format(day, "EEE d")}</span>
                    <span className="text-xs md:hidden">{format(day, "EEEEE")}</span>
                    <span className="md:hidden">{format(day, "d")}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {hasAllDay && (
          <div className="grid border-t border-border text-xs" style={{ gridTemplateColumns }}>
            <div className="px-2 py-1 text-right text-[10px] text-muted-foreground">{text.allDay}</div>
            {columns.map(({ day, allDay }) => (
              <div key={day.toISOString()} className="flex min-w-0 flex-col gap-0.5 border-l border-border p-0.5">
                {allDay.slice(0, MAX_ALL_DAY).map((event) => {
                  const colors = getEventColorClasses(event, categories);
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onSelectEvent?.(event)}
                      className={cn(
                        "flex min-w-0 items-center gap-1.5 rounded-sm pr-1 text-left text-foreground hover:brightness-110",
                        colors.soft,
                      )}
                    >
                      <span className={cn("h-4 w-1 shrink-0 rounded-l-sm", colors.bar)} />
                      <span className="truncate">{renderEvent ? renderEvent(event, context) : event.title}</span>
                    </button>
                  );
                })}
                {allDay.length > MAX_ALL_DAY && (
                  <span className="px-1 text-muted-foreground">{text.more(allDay.length - MAX_ALL_DAY)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <SimpleBar ref={scrollRef} className="min-h-0 flex-1">
        <div className="relative grid" style={{ gridTemplateColumns, height: totalHeight }}>
          {/* Hour labels */}
          <div className="relative border-r border-border">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-[10px] text-muted-foreground"
                style={{ top: hour * 2 * slotHeight }}
              >
                {hour === 0 ? null : format(new Date(2000, 0, 1, hour), "h a")}
              </div>
            ))}
          </div>

          {columns.map(({ day, timed }) => (
            <div
              key={day.toISOString()}
              className="relative min-w-0 cursor-pointer border-r border-border"
              onClick={(e) => {
                if (!onSelectDate) return;
                const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
                const slot = Math.min(SLOTS - 1, Math.max(0, Math.floor(y / slotHeight)));
                onSelectDate(new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(slot / 2), (slot % 2) * 30));
              }}
            >
              {/* Slot lines: solid on the hour, faint on the half hour */}
              {HOURS.map((hour) => (
                <Fragment key={hour}>
                  <div className="border-b border-border/40" style={{ height: slotHeight }} />
                  <div className="border-b border-border" style={{ height: slotHeight }} />
                </Fragment>
              ))}

              {timed.map(({ event, start, end, startMinutes, endMinutes, lane, lanes }) => {
                const colors = getEventColorClasses(event, categories);
                const height = ((endMinutes - startMinutes) / 30) * slotHeight;
                return (
                  <button
                    key={event.id}
                    type="button"
                    aria-label={`${event.title}, ${formatEventWhen(event)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent?.(event);
                    }}
                    className={cn(
                      "absolute z-10 min-w-0 overflow-hidden rounded-sm border border-background py-0.5 pl-2.5 pr-1 text-left text-xs text-foreground hover:brightness-110",
                      colors.soft,
                    )}
                    style={{
                      top: (startMinutes / 30) * slotHeight,
                      height,
                      left: `${(lane / lanes) * 100}%`,
                      width: `${100 / lanes}%`,
                    }}
                  >
                    <span className={cn("absolute inset-y-0 left-0 w-1", colors.bar)} />
                    {renderEvent ? (
                      renderEvent(event, context)
                    ) : (
                      <>
                        <span className="block truncate font-medium">{event.title}</span>
                        {height >= slotHeight * 1.5 && (
                          <span className="block truncate text-muted-foreground">{formatTimeRange(start, end)}</span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {now && <CurrentTimeIndicator now={now} slotHeight={slotHeight} isCurrent={showsToday} />}
        </div>
      </SimpleBar>
    </div>
  );
}
