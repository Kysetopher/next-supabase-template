import { cn } from "@/lib/utils";

export type BannerHeaderProps = React.ComponentProps<"h1"> & {
  /** Blur radius of the glow in px. 0 disables it. */
  glowBlur?: number;
  /** Any CSS color; defaults to the foreground token so it follows the theme. */
  glowColor?: string;
};

/** A large hero heading with a soft text glow. */
export function BannerHeader({
  className,
  style,
  glowBlur = 5,
  glowColor = "var(--foreground)",
  ...props
}: BannerHeaderProps) {
  return (
    <h1
      className={cn("text-4xl font-bold md:text-6xl", className)}
      style={{
        ...(glowBlur > 0 ? { textShadow: `0 0 ${glowBlur}px ${glowColor}` } : null),
        ...style,
      }}
      {...props}
    />
  );
}
