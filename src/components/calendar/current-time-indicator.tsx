import { format } from "date-fns";

import { cn } from "@/lib/utils";

type CurrentTimeIndicatorProps = {
  now: Date;
  /** Pixel height of one 30-minute slot in the time grid it overlays. */
  slotHeight: number;
  /** True when the visible range contains today: draws the line, not just the gutter label. */
  isCurrent?: boolean;
  className?: string;
};

/** Horizontal "now" marker for the week/day time grids; sits in a `relative` container. */
export function CurrentTimeIndicator({ now, slotHeight, isCurrent = false, className }: CurrentTimeIndicatorProps) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = (minutes / 30) * slotHeight;

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-x-0 z-20", className)}
      style={{ top }}
    >
      {isCurrent && <div className="absolute left-14 right-0 h-0.5 -translate-y-1/2 bg-primary" />}
      <div
        className={cn(
          "absolute left-0 w-14 -translate-y-1/2 rounded px-1 text-center text-[10px] font-semibold leading-4 shadow-sm",
          isCurrent ? "bg-primary text-primary-foreground" : "border border-border bg-secondary text-secondary-foreground",
        )}
      >
        {format(now, "h:mm a")}
      </div>
    </div>
  );
}
