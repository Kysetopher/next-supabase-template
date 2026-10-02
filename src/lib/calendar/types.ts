import type { ReactNode } from "react";

/** A point in time as the calendar accepts it: a Date, an ISO 8601 string or epoch milliseconds. */
export type CalendarDateInput = Date | string | number;

/** Weekday a week starts on, date-fns style: 0 = Sunday … 6 = Saturday. */
export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type CalendarViewMode = "month" | "week" | "day";

/** Theme tokens an event or category can be tinted with (see src/app/globals.css). */
export type CalendarColor =
  | "primary"
  | "secondary"
  | "muted"
  | "destructive"
  | "success"
  | "warning"
  | "chart-1"
  | "chart-2"
  | "chart-3"
  | "chart-4"
  | "chart-5";

/**
 * One calendar entry. Times are placed on the viewer's local calendar day.
 *
 * `category` is an opaque key the consumer maps through the `categories` prop
 * (label + color); `color` tints a single event directly and wins over its category.
 * `meta` carries whatever app-specific payload the consumer wants back in callbacks.
 */
export type CalendarEvent<TMeta = unknown> = {
  id: string | number;
  title: string;
  start: CalendarDateInput;
  /** Omitted: a timed event is drawn as one 30-minute slot; an all-day event covers its start day. */
  end?: CalendarDateInput;
  /** All-day events show no time and sit in the all-day row of the week/day views. */
  allDay?: boolean;
  description?: string;
  location?: string;
  /** Internal path ("/…") or absolute URL shown as a link on the event card. */
  url?: string;
  /** Link text for `url`; falls back to the `learnMore` label. */
  urlLabel?: string;
  imageUrl?: string;
  imageAlt?: string;
  /** Key into the `categories` prop. */
  category?: string;
  color?: CalendarColor;
  meta?: TMeta;
};

/** Consumer-supplied display info for an event category. */
export type CalendarCategory = {
  label: string;
  /** Token used for the event's indicator bar and dot. Defaults to "primary". */
  color?: CalendarColor;
  /** Extra classes for the indicator bar/dot, e.g. "bg-success" — overrides `color`. */
  className?: string;
};

export type CalendarCategories = Record<string, CalendarCategory>;

/** Where an event is being rendered — passed to `renderEvent` so one renderer can adapt. */
export type CalendarEventContext = "month" | "week" | "day" | "upcoming";

export type RenderCalendarEvent<TMeta = unknown> = (
  event: CalendarEvent<TMeta>,
  context: CalendarEventContext,
) => ReactNode;

/** Every user-visible string the calendar renders, so it can be translated or reworded. */
export type CalendarLabels = {
  today: string;
  previous: string;
  next: string;
  month: string;
  week: string;
  day: string;
  allDay: string;
  upcoming: string;
  showUpcoming: string;
  hideUpcoming: string;
  noUpcoming: string;
  filterCategories: string;
  more: (count: number) => string;
  learnMore: string;
  close: string;
};
