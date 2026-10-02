"use client";

import { useMemo, useState } from "react";
import { startOfToday } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import { SlideSelector } from "@/components/ui/slide-selector";
import { cn } from "@/lib/utils";

type DateTimeYearProps = {
  id?: string;
  /** Controlled value. Leave undefined (and use `defaultValue`) for uncontrolled. */
  value?: Date;
  defaultValue?: Date;
  onChange?: (next: Date | undefined) => void;
  /** First selectable year. Defaults to 100 years ago. */
  startYear?: number;
  /** Last selectable year. Defaults to 20 years from now. */
  endYear?: number;
  className?: string;
};

const HOUR_ITEMS = Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: String(h).padStart(2, "0") }));
const MINUTE_ITEMS = Array.from({ length: 60 }, (_, m) => {
  const v = String(m).padStart(2, "0");
  return { value: v, label: v };
});

/**
 * Inline (not a popover) date-time picker for dates far from today: a
 * horizontal year strip on top, then the calendar beside 24-hour hour and
 * minute columns. Choosing a year jumps the calendar to it.
 */
export function DateTimeYear({
  id,
  value,
  defaultValue,
  onChange,
  startYear,
  endYear,
  className,
}: DateTimeYearProps) {
  const [internal, setInternal] = useState<Date | undefined>(defaultValue);
  const date = value !== undefined ? value : internal;
  const [month, setMonth] = useState<Date>(() => date ?? startOfToday());

  const currentYear = new Date().getFullYear();
  const firstYear = startYear ?? currentYear - 100;
  const lastYear = endYear ?? currentYear + 20;

  const yearItems = useMemo(
    () =>
      Array.from({ length: Math.max(lastYear - firstYear + 1, 0) }, (_, i) => {
        const y = String(lastYear - i);
        return { value: y, label: y };
      }),
    [firstYear, lastYear]
  );

  const commit = (next: Date) => {
    setInternal(next);
    onChange?.(next);
  };

  const base = () => new Date(date ?? startOfToday());

  const handleDateSelect = (selected: Date | undefined) => {
    if (!selected) return;
    const next = new Date(selected);
    if (date) next.setHours(date.getHours(), date.getMinutes(), 0, 0);
    commit(next);
  };

  const handleYearSelect = (yearValue: string) => {
    const year = Number.parseInt(yearValue, 10);
    if (Number.isNaN(year)) return;
    const next = base();
    next.setFullYear(year);
    commit(next);
    setMonth(new Date(year, next.getMonth(), 1));
  };

  const handleTimeChange = (type: "hour" | "minute", v: string) => {
    const next = base();
    if (type === "hour") next.setHours(Number.parseInt(v, 10));
    if (type === "minute") next.setMinutes(Number.parseInt(v, 10));
    commit(next);
  };

  return (
    <div id={id} className={cn("flex flex-col", className)}>
      <SlideSelector
        aria-label="Year"
        items={yearItems}
        selectedValue={date ? String(date.getFullYear()) : undefined}
        onSelect={handleYearSelect}
        orientation="horizontal"
        variant="pill"
      />
      <div className="flex items-stretch">
        <div className="relative min-w-0 flex-1 p-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            month={month}
            onMonthChange={setMonth}
            startMonth={new Date(firstYear, 0, 1)}
            endMonth={new Date(lastYear, 11, 31)}
          />
        </div>
        <div className="flex h-[300px] divide-x divide-border overflow-hidden rounded-md">
          <SlideSelector
            aria-label="Hour"
            items={HOUR_ITEMS}
            selectedValue={date ? String(date.getHours()) : undefined}
            onSelect={(v) => handleTimeChange("hour", v)}
            orientation="vertical"
            className="w-auto"
          />
          <SlideSelector
            aria-label="Minute"
            items={MINUTE_ITEMS}
            selectedValue={date ? String(date.getMinutes()).padStart(2, "0") : undefined}
            onSelect={(v) => handleTimeChange("minute", v)}
            orientation="vertical"
            className="w-auto"
          />
        </div>
      </div>
    </div>
  );
}
