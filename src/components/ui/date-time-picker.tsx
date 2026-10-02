"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { format, startOfToday } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SlideSelector } from "@/components/ui/slide-selector";
import { cn } from "@/lib/utils";

type DateTimePickerProps = {
  id?: string;
  /** Controlled value. Leave undefined (and use `defaultValue`) for uncontrolled. */
  value?: Date;
  defaultValue?: Date;
  onChange?: (next: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

// 12-hour clock order: 12, 1, 2, … 11.
const HOUR_ITEMS = [12, ...Array.from({ length: 11 }, (_, i) => i + 1)].map((h) => ({
  value: String(h),
  label: String(h),
}));
const MINUTE_ITEMS = Array.from({ length: 60 }, (_, m) => {
  const v = String(m).padStart(2, "0");
  return { value: v, label: v };
});
const MERIDIEM_ITEMS = [
  { value: "AM", label: "AM" },
  { value: "PM", label: "PM" },
];

/**
 * Date + 12-hour time in one popover: calendar on the left, hour / minute /
 * AM-PM columns on the right (below it on mobile). Stays open while
 * adjusting; picking a time before a date starts from today.
 */
export function DateTimePicker({
  id,
  value,
  defaultValue,
  onChange,
  placeholder = "MM/DD/YYYY hh:mm aa",
  className,
  disabled,
}: DateTimePickerProps) {
  const [internal, setInternal] = useState<Date | undefined>(defaultValue);
  const [open, setOpen] = useState(false);
  const date = value !== undefined ? value : internal;

  const commit = (next: Date) => {
    setInternal(next);
    onChange?.(next);
  };

  const handleDateSelect = (selected: Date | undefined) => {
    if (!selected) return;
    const next = new Date(selected);
    if (date) next.setHours(date.getHours(), date.getMinutes(), 0, 0);
    commit(next);
  };

  const handleTimeChange = (type: "hour" | "minute" | "meridiem", v: string) => {
    const next = new Date(date ?? startOfToday());
    const hours = next.getHours();
    const isPm = hours >= 12;

    if (type === "hour") next.setHours((Number.parseInt(v, 10) % 12) + (isPm ? 12 : 0));
    if (type === "minute") next.setMinutes(Number.parseInt(v, 10));
    if (type === "meridiem") {
      if (v === "PM" && !isPm) next.setHours(hours + 12);
      if (v === "AM" && isPm) next.setHours(hours - 12);
    }
    commit(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="secondary"
          disabled={disabled}
          className={cn("w-full justify-start gap-2 font-normal", !date && "text-muted-foreground", className)}
        >
          <Icon icon="mdi:calendar-clock-outline" className="h-4 w-4 shrink-0" aria-hidden="true" />
          {date ? format(date, "MM/dd/yyyy hh:mm aa") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="sm:flex">
          <div className="relative p-2">
            <Calendar mode="single" selected={date} defaultMonth={date} onSelect={handleDateSelect} autoFocus />
          </div>
          <div className="flex h-48 justify-center divide-x divide-border border-t border-border sm:h-[300px] sm:border-t-0 sm:border-l">
            <SlideSelector
              aria-label="Hour"
              items={HOUR_ITEMS}
              selectedValue={date ? String(date.getHours() % 12 || 12) : undefined}
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
            <SlideSelector
              aria-label="AM or PM"
              items={MERIDIEM_ITEMS}
              selectedValue={date ? (date.getHours() >= 12 ? "PM" : "AM") : undefined}
              onSelect={(v) => handleTimeChange("meridiem", v)}
              orientation="vertical"
              className="w-auto"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
