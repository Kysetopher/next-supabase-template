import { Icon } from "@iconify/react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { button: "size-7", icon: "size-3.5" },
  md: { button: "size-9", icon: "size-4" },
  lg: { button: "size-11", icon: "size-5" },
} as const;

export type IconButtonProps = Omit<ButtonProps, "aria-label" | "size"> & {
  /** Required: an icon-only button has no visible text to name it. */
  "aria-label": string;
  /** Iconify icon name, e.g. "lucide:x". Omit to pass a custom icon as `children`. */
  icon?: string;
  size?: keyof typeof SIZES;
  iconClassName?: string;
};

/**
 * A square, icon-only `Button`. Defaults to the `ghost` variant and
 * `type="button"` (so it never submits an enclosing form by accident).
 */
export function IconButton({
  icon,
  size = "md",
  variant = "ghost",
  type = "button",
  className,
  iconClassName,
  children,
  ...props
}: IconButtonProps) {
  return (
    <Button type={type} variant={variant} className={cn("shrink-0 p-0", SIZES[size].button, className)} {...props}>
      {icon ? <Icon icon={icon} className={cn(SIZES[size].icon, iconClassName)} aria-hidden="true" /> : children}
    </Button>
  );
}
