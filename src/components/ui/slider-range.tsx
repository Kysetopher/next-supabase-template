"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

type SliderRangeProps = {
  value: [number, number];
  onChange: (value: [number, number]) => void;
} & Omit<
  React.ComponentProps<typeof SliderPrimitive.Root>,
  "value" | "defaultValue" | "onValueChange" | "onChange"
>;

export function SliderRange({
  className,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  ...props
}: SliderRangeProps) {
  return (
    <SliderPrimitive.Root
      className={cn("relative flex h-4 w-full touch-none items-center", className)}
      value={value}
      onValueChange={(next) => onChange([next[0], next[1]])}
      min={min}
      max={max}
      step={step}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full bg-border">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-3.5 w-3.5 rounded-full border border-primary bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
      <SliderPrimitive.Thumb className="block h-3.5 w-3.5 rounded-full border border-primary bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
    </SliderPrimitive.Root>
  );
}
