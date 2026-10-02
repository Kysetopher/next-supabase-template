"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type SlideSelectorItem = {
  value: string;
  label: React.ReactNode;
};

export type SlideSelectorProps = {
  items: SlideSelectorItem[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  /** "square" = fixed-size tiles (good for numbers), "pill" = rounded, width follows the label. */
  variant?: "pill" | "square";
  /** Override the item height, e.g. "h-8". */
  heightClassName?: string;
  /** Override the item width for the square variant, e.g. "w-12". */
  widthClassName?: string;
  className?: string;
  /** Accessible name for the option list. */
  "aria-label"?: string;
};

/** Scrollable strip of single-select buttons — the building block for the hour/minute/year columns in the date-time pickers. */
export function SlideSelector({
  items,
  selectedValue,
  onSelect,
  orientation = "vertical",
  variant = "square",
  heightClassName,
  widthClassName,
  className,
  "aria-label": ariaLabel,
}: SlideSelectorProps) {
  const isHorizontal = orientation === "horizontal";

  const itemClass =
    variant === "pill"
      ? cn("rounded-full px-4", heightClassName ?? "h-10")
      : cn("aspect-square rounded-md p-0", heightClassName ?? "h-10", widthClassName ?? "w-10");

  return (
    <ScrollArea className={cn(isHorizontal ? "w-full" : "h-full w-full", className)}>
      <div
        role="group"
        aria-label={ariaLabel}
        className={cn("flex gap-2 p-2", isHorizontal ? "flex-row py-3" : "flex-col px-3")}
      >
        {items.map((item) => {
          const selected = selectedValue === item.value;
          return (
            <Button
              key={item.value}
              type="button"
              aria-pressed={selected}
              variant={selected ? "primary" : "ghost"}
              className={cn("shrink-0", itemClass)}
              onClick={() => onSelect(item.value)}
            >
              {item.label}
            </Button>
          );
        })}
      </div>
      <ScrollBar orientation={isHorizontal ? "horizontal" : "vertical"} />
    </ScrollArea>
  );
}
