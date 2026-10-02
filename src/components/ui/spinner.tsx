import { Icon } from "@iconify/react";

import { cn } from "@/lib/utils";

type SpinnerProps = Omit<React.ComponentProps<typeof Icon>, "icon"> & {
  /** Iconify name; defaults to the same loader Button uses for `loading`. */
  icon?: string;
};

/** Spinning loader icon with role="status". Size via className (default size-4). */
export function Spinner({ className, icon = "lucide:loader-2", ...props }: SpinnerProps) {
  return (
    <Icon
      role="status"
      aria-label="Loading"
      icon={icon}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}
