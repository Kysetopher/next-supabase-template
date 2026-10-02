import { cn } from "@/lib/utils";

type RadioButtonProps = Omit<React.ComponentProps<"input">, "type"> & {
  label: React.ReactNode;
};

/**
 * Native radio inside a bordered, full-width clickable card — for option
 * lists inside plain <form>s (works without JS; group by giving each the
 * same `name`). For a controlled, Radix-driven group use RadioGroup.
 */
export function RadioButton({ className, label, ...props }: RadioButtonProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm leading-relaxed transition-colors",
        "hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        className
      )}
    >
      <input type="radio" className="mt-0.5 h-4 w-4 shrink-0 accent-primary" {...props} />
      <span>{label}</span>
    </label>
  );
}
