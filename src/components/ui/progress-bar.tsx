import { cn } from "@/lib/utils";

type ProgressBarProps = {
  label?: string;
  value: number;
  max: number;
  /** Change indicator such as "+12%" or "-3". A leading "+" renders in success, anything else in destructive. */
  delta?: string;
  className?: string;
  /** Replaces the default "label: value · pct% · delta" overlay. */
  children?: React.ReactNode;
  /** Draws a vertical marker at the current fill position. */
  showHandle?: boolean;
  /** Accessible name; defaults to `label`. */
  handleAriaLabel?: string;
};

/** Tall labelled bar with the text overlaid on the fill. Value is clamped to [0, max]. */
export function ProgressBar({
  label,
  value,
  max,
  delta,
  className,
  children,
  showHandle = false,
  handleAriaLabel,
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const ratio = Math.min(Math.max(value / safeMax, 0), 1);
  const percentage = ratio * 100;
  const isPositiveDelta = delta?.trim().startsWith("+");

  return (
    <div
      className={cn("relative h-8 w-full overflow-hidden rounded-sm bg-muted", className)}
      role="progressbar"
      aria-label={handleAriaLabel ?? label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className="h-full bg-linear-to-r from-primary via-primary to-primary/90 transition-all"
        style={{ width: `${percentage}%` }}
      />

      {showHandle ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-10 -translate-x-1/2"
          style={{ left: `${percentage}%` }}
        >
          <div className="h-full w-1 bg-foreground" />
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3 text-[11px] font-semibold text-foreground">
        {children ?? (
          <>
            <span className="truncate">
              {label ? `${label}: ` : null}
              {value.toLocaleString()}
            </span>
            <div className="ml-2 flex items-center gap-2">
              <span className="text-xs tabular-nums text-muted-foreground">{Math.round(percentage)}%</span>
              {delta ? (
                <span className={cn("text-[10px]", isPositiveDelta ? "text-success" : "text-destructive")}>{delta}</span>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
