"use client";

import dynamic from "next/dynamic";

/**
 * CalendarView rendered on the client only. Use it when events carry absolute
 * instants (ISO strings with an offset) and the server's timezone may differ
 * from the viewer's — day placement and times would otherwise mismatch on
 * hydration. Events built from local wall-clock dates don't need it.
 */
export const CalendarViewClient = dynamic(
  () => import("@/components/calendar/calendar-view").then((m) => m.CalendarView),
  { ssr: false, loading: () => <div className="h-[40rem] animate-pulse rounded-md bg-muted/50" /> },
);
