"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

/**
 * `data-orientation` comes from Radix itself (mirrors the `orientation` prop
 * passed to `Tabs`) — a horizontal `TabsList` is a row of pill triggers, a
 * vertical one is a sidebar-nav-style column (full-width rows, left-aligned,
 * fixed width), same primitive either way rather than two components.
 */
export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "flex gap-1 bg-secondary p-1 text-sm",
        "data-[orientation=horizontal]:shrink-0 data-[orientation=horizontal]:flex-row data-[orientation=horizontal]:flex-wrap",
        "data-[orientation=vertical]:w-48 data-[orientation=vertical]:shrink-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch data-[orientation=vertical]:self-start data-[orientation=vertical]:rounded-md",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "flex items-center gap-2 rounded-sm px-3 py-1.5 text-left text-secondary-foreground/70 outline-none transition-colors",
        "hover:bg-secondary-foreground/10 hover:text-secondary-foreground focus-visible:ring-1 focus-visible:ring-ring",
        "data-[state=active]:bg-accent data-[state=active]:text-accent-foreground",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("flex flex-1 flex-col gap-2 outline-none", className)}
      {...props}
    />
  );
}
