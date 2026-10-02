"use client";

import { useRef } from "react";
import { addDays, startOfWeek } from "date-fns";

import { WeekView, type WeekViewProps } from "@/components/calendar/week-view";
import { useSwipeCarousel } from "@/hooks/use-swipe-carousel";
import { dayKey } from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";

export type WeekCalendarProps<TMeta = unknown> = WeekViewProps<TMeta> & {
  /** Called with the new anchor date when the viewer swipes to another week. */
  onDateChange: (date: Date) => void;
};

/** WeekView with touch-swipe paging: the neighbouring weeks are pre-rendered either side. */
export function WeekCalendar<TMeta = unknown>({ date, onDateChange, className, ...props }: WeekCalendarProps<TMeta>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { handlers, style } = useSwipeCarousel(
    containerRef,
    () => onDateChange(addDays(date, 7)),
    () => onDateChange(addDays(date, -7)),
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full min-h-0 overflow-hidden", className)}
      style={{ touchAction: "pan-y pinch-zoom" }}
      {...handlers}
    >
      <div className="flex h-full min-h-0" style={style}>
        {[-7, 0, 7].map((offset) => {
          const panelDate = addDays(date, offset);
          return (
            <div
              key={dayKey(startOfWeek(panelDate, { weekStartsOn: props.weekStartsOn ?? 0 }))}
              className="h-full w-full shrink-0"
              inert={offset !== 0 || undefined}
            >
              <WeekView {...props} date={panelDate} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
