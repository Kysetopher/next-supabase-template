import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface LoadingProps {
  /** Screen-reader text announced while loading. */
  label?: string;
  /** Classes for the spinner icon (size, color). */
  className?: string;
  /** Classes for the centering container — override `min-h-*` to change the reserved height. */
  containerClassName?: string;
}

/**
 * A large centered spinner that reserves vertical space — for page/section
 * placeholders. Works as the default export of a route's `loading.tsx`, or
 * inline. For an inline icon-sized loader, use `Spinner` directly.
 */
export function Loading({ label = "Loading", className, containerClassName }: LoadingProps) {
  return (
    <div className={cn("flex min-h-[400px] w-full items-center justify-center", containerClassName)}>
      <Spinner aria-label={label} className={cn("size-12 text-primary", className)} />
    </div>
  );
}

export default Loading;
