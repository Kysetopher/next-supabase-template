"use client";

import { useRef } from "react";
import { addDays } from "date-fns";

import { DayView, type DayViewProps } from "@/components/calendar/day-view";
import { useSwipeCarousel } from "@/hooks/use-swipe-carousel";
import { dayKey } from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";

export type DayCalendarProps<TMeta = unknown> = DayViewProps<TMeta> & {
  /** Called with the new date when the viewer swipes to another day. */
  onDateChange: (date: Date) => void;
};

/** DayView with touch-swipe paging: the neighbouring days are pre-rendered either side. */
export function DayCalendar<TMeta = unknown>({ date, onDateChange, className, ...props }: DayCalendarProps<TMeta>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { handlers, style } = useSwipeCarousel(
    containerRef,
    () => onDateChange(addDays(date, 1)),
    () => onDateChange(addDays(date, -1)),
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full min-h-0 overflow-hidden", className)}
      style={{ touchAction: "pan-y pinch-zoom" }}
      {...handlers}
    >
      <div className="flex h-full min-h-0" style={style}>
        {[-1, 0, 1].map((offset) => {
          const panelDate = addDays(date, offset);
          return (
            <div
              key={dayKey(panelDate)}
              className="h-full w-full shrink-0"
              inert={offset !== 0 || undefined}
            >
              <DayView {...props} date={panelDate} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
