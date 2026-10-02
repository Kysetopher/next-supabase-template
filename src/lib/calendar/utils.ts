import { addDays, addMinutes, endOfDay, format, startOfDay, startOfWeek } from "date-fns";

import type {
  CalendarCategories,
  CalendarColor,
  CalendarDateInput,
  CalendarEvent,
  CalendarLabels,
  WeekStartsOn,
} from "@/lib/calendar/types";

/** Duration a timed event without an `end` is drawn with. */
export const DEFAULT_EVENT_MINUTES = 30;
/** Longest span (in days) a single event is repeated across — guards against runaway ranges. */
const MAX_SPAN_DAYS = 62;

export const DEFAULT_CALENDAR_LABELS: CalendarLabels = {
  today: "Today",
  previous: "Previous",
  next: "Next",
  month: "Month",
  week: "Week",
  day: "Day",
  allDay: "All day",
  upcoming: "Upcoming",
  showUpcoming: "Show upcoming",
  hideUpcoming: "Hide upcoming",
  noUpcoming: "No upcoming events.",
  filterCategories: "Filter by category",
  more: (count) => `+${count} more`,
  learnMore: "Learn more",
  close: "Close",
};

// Static strings so Tailwind's scanner sees every class.
const COLOR_CLASSES: Record<CalendarColor, { bar: string; soft: string }> = {
  primary: { bar: "bg-primary", soft: "bg-primary/15" },
  secondary: { bar: "bg-secondary-foreground/60", soft: "bg-secondary" },
  muted: { bar: "bg-muted-foreground/40", soft: "bg-muted-foreground/10" },
  destructive: { bar: "bg-destructive", soft: "bg-destructive/15" },
  success: { bar: "bg-success", soft: "bg-success/15" },
  warning: { bar: "bg-warning", soft: "bg-warning/15" },
  "chart-1": { bar: "bg-chart-1", soft: "bg-chart-1/20" },
  "chart-2": { bar: "bg-chart-2", soft: "bg-chart-2/20" },
  "chart-3": { bar: "bg-chart-3", soft: "bg-chart-3/15" },
  "chart-4": { bar: "bg-chart-4", soft: "bg-chart-4/15" },
  "chart-5": { bar: "bg-chart-5", soft: "bg-chart-5/15" },
};

export function toDate(input: CalendarDateInput | undefined): Date | null {
  if (input === undefined) return null;
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Local-day key; toISOString() would shift days across the UTC boundary. */
export function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

export function getEventStart(event: CalendarEvent<unknown>): Date | null {
  return toDate(event.start);
}

/** The event's end, defaulted when missing or not after its start. */
export function getEventEnd(event: CalendarEvent<unknown>): Date | null {
  const start = getEventStart(event);
  if (!start) return null;
  const end = toDate(event.end);
  if (end && end > start) return end;
  return event.allDay ? endOfDay(start) : addMinutes(start, DEFAULT_EVENT_MINUTES);
}

export function compareEvents(a: CalendarEvent<unknown>, b: CalendarEvent<unknown>) {
  if (!!a.allDay !== !!b.allDay) return a.allDay ? -1 : 1;
  const diff = (getEventStart(a)?.getTime() ?? 0) - (getEventStart(b)?.getTime() ?? 0);
  return diff || a.title.localeCompare(b.title);
}

/**
 * Buckets events by every local day they touch (multi-day events repeat on
 * each day), each bucket sorted all-day first, then by start.
 */
export function groupEventsByDay<T extends CalendarEvent<unknown>>(events: readonly T[]) {
  const byDay = new Map<string, T[]>();
  for (const event of events) {
    const start = getEventStart(event);
    const end = getEventEnd(event);
    if (!start || !end) continue;
    // An end exactly at midnight belongs to the previous day.
    const lastDay = startOfDay(addMinutes(end, -1) < start ? start : addMinutes(end, -1));
    let day = startOfDay(start);
    for (let i = 0; day <= lastDay && i < MAX_SPAN_DAYS; i++, day = addDays(day, 1)) {
      const key = dayKey(day);
      const bucket = byDay.get(key);
      if (bucket) bucket.push(event);
      else byDay.set(key, [event]);
    }
  }
  for (const bucket of byDay.values()) bucket.sort(compareEvents);
  return byDay;
}

/** Normalizes a weekday into a 0–6 index relative to the week start. */
function weekdayIndex(date: Date, weekStartsOn: WeekStartsOn) {
  return (date.getDay() - weekStartsOn + 7) % 7;
}

/**
 * Full weeks covering the month. The trailing partial week is dropped (unless
 * the month ends on the last weekday) because the next month's first row shows it —
 * which is what lets stacked months scroll without repeating a week.
 */
export function getMonthGridDays(month: Date, weekStartsOn: WeekStartsOn): Date[] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const leading = weekdayIndex(new Date(year, m, 1), weekStartsOn);
  const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;

  const days: Date[] = [];
  for (let i = 0; i < totalCells; i++) days.push(new Date(year, m, i - leading + 1));

  if (weekdayIndex(new Date(year, m, daysInMonth), weekStartsOn) !== 6) days.splice(-7);
  return days;
}

export function getWeekDays(date: Date, weekStartsOn: WeekStartsOn): Date[] {
  const start = startOfWeek(date, { weekStartsOn });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Short weekday names in week order, e.g. ["Mon", …, "Sun"]. */
export function getWeekdayLabels(weekStartsOn: WeekStartsOn, pattern = "EEE") {
  // 2023-01-01 was a Sunday; any fixed Sunday works.
  return Array.from({ length: 7 }, (_, i) => format(new Date(2023, 0, 1 + ((weekStartsOn + i) % 7)), pattern));
}

/** "10:00 AM" → "10a", "1:30 PM" → "1:30p". */
export function formatCompactTime(date: Date) {
  const h = date.getHours() % 12 || 12;
  const m = date.getMinutes();
  return `${h}${m ? `:${String(m).padStart(2, "0")}` : ""}${date.getHours() < 12 ? "a" : "p"}`;
}

/** "9:00 AM" → "9 AM", "1:30 PM" stays. */
export function formatTime(date: Date) {
  return format(date, "h:mm a").replace(/:00\s/, " ");
}

export function formatTimeRange(start: Date, end: Date) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** Human date (+ time unless all-day), e.g. "Thu, Jan 15 · 9:30 AM". */
export function formatEventWhen(event: CalendarEvent<unknown>, { withYear = false } = {}) {
  const start = getEventStart(event);
  if (!start) return "";
  const date = format(start, withYear ? "EEE, MMM d, yyyy" : "EEE, MMM d");
  if (event.allDay) return date;
  const end = getEventEnd(event);
  const sameDay = end && dayKey(end) === dayKey(start);
  return `${date} · ${end && sameDay ? formatTimeRange(start, end) : formatTime(start)}`;
}

/** Classes for an event's indicator bar/dot: its own color, else its category's, else primary. */
export function getEventColorClasses(event: CalendarEvent<unknown>, categories?: CalendarCategories) {
  const category = event.category ? categories?.[event.category] : undefined;
  const color = event.color ?? category?.color ?? "primary";
  const classes = COLOR_CLASSES[color];
  return { bar: (!event.color && category?.className) || classes.bar, soft: classes.soft };
}

export function getCategoryColorClass(category: { color?: CalendarColor; className?: string }) {
  return category.className ?? COLOR_CLASSES[category.color ?? "primary"].bar;
}

export function isExternalUrl(url: string) {
  return !url.startsWith("/") || url.startsWith("//");
}

export type TimedSegment<T> = {
  event: T;
  start: Date;
  end: Date;
  /** Minutes from the day's midnight. */
  startMinutes: number;
  endMinutes: number;
  /** Column within its overlap cluster, and the cluster's column count. */
  lane: number;
  lanes: number;
};

/**
 * Clips each timed (non-all-day) event to `day` and assigns side-by-side lanes
 * so overlapping events don't draw over one another.
 */
export function layoutTimedEvents<T extends CalendarEvent<unknown>>(events: readonly T[], day: Date): TimedSegment<T>[] {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);
  const segments: TimedSegment<T>[] = [];

  for (const event of events) {
    if (event.allDay) continue;
    const start = getEventStart(event);
    const end = getEventEnd(event);
    if (!start || !end || end <= dayStart || start >= dayEnd) continue;
    const clippedStart = start < dayStart ? dayStart : start;
    const clippedEnd = end > dayEnd ? dayEnd : end;
    const startMinutes = (clippedStart.getTime() - dayStart.getTime()) / 60_000;
    // Keep a minimum visible height of 15 minutes.
    const endMinutes = Math.max(startMinutes + 15, (clippedEnd.getTime() - dayStart.getTime()) / 60_000);
    segments.push({ event, start, end, startMinutes, endMinutes, lane: 0, lanes: 1 });
  }

  segments.sort((a, b) => a.startMinutes - b.startMinutes || b.endMinutes - a.endMinutes);

  let cluster: TimedSegment<T>[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;
  const closeCluster = () => {
    for (const s of cluster) s.lanes = laneEnds.length;
    cluster = [];
    laneEnds = [];
  };

  for (const segment of segments) {
    if (segment.startMinutes >= clusterEnd) closeCluster();
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= segment.startMinutes);
    if (lane === -1) lane = laneEnds.push(0) - 1;
    laneEnds[lane] = segment.endMinutes;
    segment.lane = lane;
    cluster.push(segment);
    clusterEnd = Math.max(clusterEnd, segment.endMinutes);
  }
  closeCluster();

  return segments;
}

/** All-day (and multi-day) events that touch `day`, for the all-day row. */
export function allDayEventsFor<T extends CalendarEvent<unknown>>(byDay: Map<string, T[]>, day: Date) {
  return (byDay.get(dayKey(day)) ?? []).filter((event) => event.allDay);
}
