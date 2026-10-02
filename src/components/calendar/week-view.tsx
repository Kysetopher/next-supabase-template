"use client";

import { useMemo } from "react";

import { TimeGrid, type TimeGridProps } from "@/components/calendar/time-grid";
import type { WeekStartsOn } from "@/lib/calendar/types";
import { getWeekDays } from "@/lib/calendar/utils";

export type WeekViewProps<TMeta = unknown> = Omit<TimeGridProps<TMeta>, "days" | "context"> & {
  /** Any date inside the week to show. */
  date: Date;
  weekStartsOn?: WeekStartsOn;
};

/** One week as a 7-column, 30-minute time grid with an all-day row. */
export function WeekView<TMeta = unknown>({ date, weekStartsOn = 0, ...props }: WeekViewProps<TMeta>) {
  const time = date.getTime();
  const days = useMemo(() => getWeekDays(new Date(time), weekStartsOn), [time, weekStartsOn]);
  return <TimeGrid {...props} days={days} context="week" />;
}
