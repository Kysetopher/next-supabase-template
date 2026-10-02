"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Icon } from "@iconify/react";
import { addDays, addMonths, endOfWeek, format, isSameMonth, isSameYear, startOfWeek } from "date-fns";

import { DayCalendar } from "@/components/calendar/day-calendar";
import { EventCard } from "@/components/calendar/event-card";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { UpcomingSidebar } from "@/components/calendar/upcoming-sidebar";
import { WeekCalendar } from "@/components/calendar/week-calendar";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useNow } from "@/hooks/use-now";
import type {
  CalendarCategories,
  CalendarEvent,
  CalendarLabels,
  CalendarViewMode,
  RenderCalendarEvent,
  WeekStartsOn,
} from "@/lib/calendar/types";
import { DEFAULT_CALENDAR_LABELS } from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";

const ALL_VIEWS: CalendarViewMode[] = ["month", "week", "day"];
const DESKTOP_QUERY = "(min-width: 768px)";

function subscribeDesktop(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
const getDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;
const getServerDesktop = () => false;

function shiftDate(date: Date, view: CalendarViewMode, amount: number) {
  if (view === "month") return addMonths(date, amount);
  return addDays(date, view === "week" ? amount * 7 : amount);
}

function formatTitle(date: Date, view: CalendarViewMode, weekStartsOn: WeekStartsOn) {
  if (view === "month") return format(date, "MMMM yyyy");
  if (view === "day") return format(date, "EEEE, MMMM d, yyyy");
  const start = startOfWeek(date, { weekStartsOn });
  const end = endOfWeek(date, { weekStartsOn });
  if (isSameMonth(start, end)) return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
  if (isSameYear(start, end)) return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}

export type CalendarViewProps<TMeta = unknown> = {
  events: readonly CalendarEvent<TMeta>[];

  /** Controlled anchor date (the month/week/day being shown). */
  date?: Date;
  /** Uncontrolled initial anchor date. Without `date`/`defaultDate` the calendar opens on today once mounted. */
  defaultDate?: Date;
  onDateChange?: (date: Date) => void;

  /** Controlled view. */
  view?: CalendarViewMode;
  defaultView?: CalendarViewMode;
  onViewChange?: (view: CalendarViewMode) => void;
  /** Views offered in the switcher (hidden when only one). Defaults to all three. */
  views?: CalendarViewMode[];

  /** Highlighted day; purely presentational, the consumer owns it. */
  selectedDate?: Date | null;
  /** A day cell (month) or 30-minute slot (week/day) was clicked. */
  onSelectDate?: (date: Date, view: CalendarViewMode) => void;
  onSelectEvent?: (event: CalendarEvent<TMeta>) => void;
  /** Open the built-in details dialog when an event is clicked. Default true. */
  showEventDialog?: boolean;
  /** Replaces EventCard inside the details dialog. */
  renderEventDetails?: (event: CalendarEvent<TMeta>) => ReactNode;
  /** Replaces the default chip content in every view and the upcoming list. */
  renderEvent?: RenderCalendarEvent<TMeta>;

  categories?: CalendarCategories;
  labels?: Partial<CalendarLabels>;
  weekStartsOn?: WeekStartsOn;
  /**
   * "Now" for today highlights, the now-line and the upcoming list. Omitted: a
   * live clock that starts after hydration. Pass a fixed date for demos/tests.
   */
  today?: Date | null;

  /** Offer the upcoming sidebar. Default true. */
  showUpcoming?: boolean;
  /** Initial sidebar state; defaults to open from the md breakpoint up. */
  defaultUpcomingOpen?: boolean;
  /** Extra content rendered at the end of the toolbar. */
  toolbarExtra?: ReactNode;

  slotHeight?: number;
  scrollToHour?: number;
  maxEventsPerDay?: number;
  /** Give the root a definite height (e.g. "h-[40rem]"); the views fill it. */
  className?: string;
};

/** Month/week/day calendar with a toolbar, upcoming sidebar and event details dialog — all driven by props. */
export function CalendarView<TMeta = unknown>({
  events,
  date: dateProp,
  defaultDate,
  onDateChange,
  view: viewProp,
  defaultView = "month",
  onViewChange,
  views = ALL_VIEWS,
  selectedDate,
  onSelectDate,
  onSelectEvent,
  showEventDialog = true,
  renderEventDetails,
  renderEvent,
  categories,
  labels,
  weekStartsOn = 0,
  today,
  showUpcoming = true,
  defaultUpcomingOpen,
  toolbarExtra,
  slotHeight,
  scrollToHour,
  maxEventsPerDay,
  className,
}: CalendarViewProps<TMeta>) {
  const text = { ...DEFAULT_CALENDAR_LABELS, ...labels };
  const now = useNow(today);

  const [internalDate, setInternalDate] = useState<Date | null>(defaultDate ?? null);
  const date = dateProp ?? internalDate ?? now;
  const setDate = (next: Date) => {
    if (dateProp === undefined) setInternalDate(next);
    onDateChange?.(next);
  };

  const [internalView, setInternalView] = useState<CalendarViewMode>(defaultView);
  const view = viewProp ?? internalView;
  const setView = (next: CalendarViewMode) => {
    if (viewProp === undefined) setInternalView(next);
    onViewChange?.(next);
  };

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent<TMeta> | null>(null);
  const handleSelectEvent = (event: CalendarEvent<TMeta>) => {
    onSelectEvent?.(event);
    if (showEventDialog) setSelectedEvent(event);
  };

  // The sidebar follows the breakpoint (open from md up) until the viewer toggles it.
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktop, getServerDesktop);
  const [upcomingOverride, setUpcomingOverride] = useState<boolean | null>(defaultUpcomingOpen ?? null);
  const upcomingOpen = showUpcoming && (upcomingOverride ?? isDesktop);

  const shared = {
    events,
    now,
    selectedDate,
    onSelectEvent: handleSelectEvent,
    renderEvent,
    categories,
    labels,
  };

  return (
    <div className={cn("relative flex h-[40rem] min-h-0 gap-6 overflow-hidden", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <h2 className="min-w-0 truncate text-lg font-semibold text-foreground sm:text-xl">
            {date ? formatTitle(date, view, weekStartsOn) : " "}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {views.length > 1 && (
              <ButtonGroup>
                {views.map((v) => (
                  <Button
                    key={v}
                    variant="outline"
                    aria-pressed={v === view}
                    onClick={() => setView(v)}
                    className={cn("px-3 py-1.5", v === view && "bg-secondary")}
                  >
                    {text[v]}
                  </Button>
                ))}
              </ButtonGroup>
            )}
            <div className="flex gap-1">
              <Button
                variant="secondary"
                className="px-3 py-1.5"
                aria-label={text.previous}
                disabled={!date}
                onClick={() => date && setDate(shiftDate(date, view, -1))}
              >
                <Icon icon="lucide:chevron-left" className="size-4" />
              </Button>
              <Button variant="secondary" className="px-3 py-1.5" disabled={!now} onClick={() => now && setDate(now)}>
                {text.today}
              </Button>
              <Button
                variant="secondary"
                className="px-3 py-1.5"
                aria-label={text.next}
                disabled={!date}
                onClick={() => date && setDate(shiftDate(date, view, 1))}
              >
                <Icon icon="lucide:chevron-right" className="size-4" />
              </Button>
              {showUpcoming && (
                <Button
                  variant={upcomingOpen ? "primary" : "secondary"}
                  className="px-3 py-1.5"
                  aria-label={upcomingOpen ? text.hideUpcoming : text.showUpcoming}
                  aria-expanded={upcomingOpen}
                  onClick={() => setUpcomingOverride(!upcomingOpen)}
                >
                  <Icon icon="lucide:list" className="size-4" />
                </Button>
              )}
            </div>
            {toolbarExtra}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
          {!date ? (
            <div className="size-full animate-pulse bg-muted/50" />
          ) : view === "month" ? (
            <MonthCalendar
              {...shared}
              date={date}
              onDateChange={setDate}
              onSelectDate={onSelectDate && ((d) => onSelectDate(d, "month"))}
              onShowMore={(d) => {
                setDate(d);
                if (views.includes("day")) setView("day");
              }}
              weekStartsOn={weekStartsOn}
              maxEventsPerDay={maxEventsPerDay}
            />
          ) : view === "week" ? (
            <WeekCalendar
              {...shared}
              date={date}
              onDateChange={setDate}
              onSelectDate={onSelectDate && ((d) => onSelectDate(d, "week"))}
              weekStartsOn={weekStartsOn}
              slotHeight={slotHeight}
              scrollToHour={scrollToHour}
            />
          ) : (
            <DayCalendar
              {...shared}
              date={date}
              onDateChange={setDate}
              onSelectDate={onSelectDate && ((d) => onSelectDate(d, "day"))}
              slotHeight={slotHeight}
              scrollToHour={scrollToHour}
            />
          )}
        </div>
      </div>

      {upcomingOpen && (
        // Drawer over the calendar on mobile; a column beside it from md up.
        <UpcomingSidebar
          events={events}
          now={now}
          onSelectEvent={handleSelectEvent}
          onClose={() => setUpcomingOverride(false)}
          renderEvent={renderEvent}
          categories={categories}
          labels={labels}
          className="absolute inset-y-0 right-0 z-30 w-[85%] max-w-80 border-l border-border bg-background pl-4 md:static md:w-72 md:shrink-0 md:border-l-0 md:pl-0"
        />
      )}

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent
          aria-describedby={undefined}
          className="inset-auto left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2"
        >
          {selectedEvent && (
            <>
              <DialogTitle className="sr-only">{selectedEvent.title}</DialogTitle>
              {renderEventDetails ? (
                renderEventDetails(selectedEvent)
              ) : (
                <EventCard event={selectedEvent} categories={categories} labels={labels} />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
