"use client";

import SimpleBar from "simplebar-react";

import { Card, CardHeader, CardTitle, type CardProps } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ScrollableCardProps = Omit<CardProps, "children"> & {
  /** Title shown in the fixed header above the scrolling body. */
  header: React.ReactNode;
  /** Extra content placed at the right of the header (actions, filters, search). */
  headerActions?: React.ReactNode;
  children?: React.ReactNode;
  bodyClassName?: string;
};

/**
 * A `Card` with a fixed header and a scrolling body that fills the remaining
 * height. Give it (or its parent) a bounded height for the body to scroll.
 */
export function ScrollableCard({
  header,
  headerActions,
  children,
  className,
  bodyClassName,
  ...props
}: ScrollableCardProps) {
  return (
    <Card className={cn("flex h-full min-h-0 flex-col", className)} {...props}>
      <CardHeader className="shrink-0 flex-row items-center justify-between gap-4 px-4 py-3">
        <CardTitle className="select-none">{header}</CardTitle>
        {headerActions}
      </CardHeader>

      <div className="min-h-0 flex-1">
        <SimpleBar style={{ height: "100%" }} autoHide={false}>
          <div className={cn("space-y-4 p-4 text-sm", bodyClassName)}>{children}</div>
        </SimpleBar>
      </div>
    </Card>
  );
}
