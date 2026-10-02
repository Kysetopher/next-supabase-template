"use client";

import { useMemo } from "react";
import { startOfDay } from "date-fns";

import { TimeGrid, type TimeGridProps } from "@/components/calendar/time-grid";

export type DayViewProps<TMeta = unknown> = Omit<TimeGridProps<TMeta>, "days" | "context"> & {
  date: Date;
};

/** A single day as a 30-minute time grid with an all-day row. */
export function DayView<TMeta = unknown>({ date, ...props }: DayViewProps<TMeta>) {
  const day = startOfDay(date).getTime();
  const days = useMemo(() => [new Date(day)], [day]);
  return <TimeGrid {...props} days={days} context="day" />;
}
