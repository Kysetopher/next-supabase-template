import { Icon } from "@iconify/react";

import { cn } from "@/lib/utils";

const VARIANTS = {
  // The brand accent — "one primary action" per screen, sparingly.
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  // The grey variant — everything else. Not an outline; a real filled muted surface.
  secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
  // No fill at all — for small inline controls (e.g. a clear button inside an input) where even the grey surface would be too heavy.
  ghost: "bg-transparent text-foreground hover:bg-secondary",
  // A real destructive action (delete, irreversible) — same token Badge's remove button already hovers to.
  destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
  // Transparent with a hairline border — for toolbars and button groups where a filled surface would be too loud.
  outline: "border border-border bg-transparent text-foreground hover:bg-secondary",
  // Looks like an inline text link but keeps button semantics.
  link: "bg-transparent text-primary underline-offset-4 hover:underline",
} as const;

type ButtonVariant = keyof typeof VARIANTS;

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** Button classes for non-button elements, e.g. `<Link className={buttonVariants({ variant: "secondary" })}>`. */
export function buttonVariants({ variant = "primary", className }: { variant?: ButtonVariant; className?: string } = {}) {
  return cn(BASE, VARIANTS[variant], className);
}

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  /** Any button triggering an awaited request sets this — swaps children for a spinning loader icon and disables the button. */
  loading?: boolean;
};

export function Button({ className, variant = "primary", loading = false, disabled, children, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonVariants({ variant, className })}
      {...props}
    >
      {loading ? <Icon icon="lucide:loader-2" className="size-4 animate-spin" aria-hidden="true" /> : children}
    </button>
  );
}

export type { ButtonProps, ButtonVariant };
