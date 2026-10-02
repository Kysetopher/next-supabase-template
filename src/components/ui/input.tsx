import { cn } from "@/lib/utils";

export type InputProps = React.ComponentProps<"input">;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
