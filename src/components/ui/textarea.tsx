import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full min-h-24 rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
