import { cn } from "@/lib/utils";

export type SectionHeaderProps = React.ComponentProps<"h2"> & {
  /** Heading level to render. Defaults to h2. */
  as?: "h1" | "h2" | "h3" | "h4";
  /** Classes for the inner pill. */
  innerClassName?: string;
};

/** A section title rendered inside a bordered pill, e.g. above a landing-page section. */
export function SectionHeader({ as: Tag = "h2", children, className, innerClassName, ...props }: SectionHeaderProps) {
  return (
    <Tag className={cn("mb-3", className)} {...props}>
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-1.5 text-3xl tracking-wider shadow-lg backdrop-blur-sm",
          innerClassName
        )}
      >
        {children}
      </span>
    </Tag>
  );
}
