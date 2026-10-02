"use client";

import { Icon } from "@iconify/react";
import SimpleBar from "simplebar-react";

import { cn } from "@/lib/utils";

/** Stops pointer events from reaching a surrounding drag/grid layout, so clicking the remove button doesn't start a drag. */
const stopDrag = {
  onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
  onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
};

type WidgetCardProps = {
  title: React.ReactNode;
  /** Extra controls rendered after the title (filters, option toggles, menus). */
  headerActions?: React.ReactNode;
  /** Shows a remove (trash) button when provided. */
  onRemove?: () => void;
  removeLabel?: string;
  /**
   * Class put on the header so a grid/drag library can use it as the drag
   * handle (e.g. react-grid-layout's `draggableHandle=".widget-drag-handle"`).
   */
  dragHandleClassName?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Dashboard tile: a fixed header (title, optional actions, optional remove
 * button) above a content area that scrolls with SimpleBar. Fills its
 * parent's height, so size it from the surrounding grid cell.
 */
export function WidgetCard({
  title,
  headerActions,
  onRemove,
  removeLabel = "Remove widget",
  dragHandleClassName = "widget-drag-handle",
  className,
  children,
}: WidgetCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      <div className={cn("flex items-center justify-between gap-2 border-b border-border p-2", dragHandleClassName)}>
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="select-none truncate text-base font-semibold">{title}</h3>
          {headerActions}
        </div>
        {onRemove ? (
          <button
            type="button"
            aria-label={removeLabel}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            {...stopDrag}
            className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-destructive"
          >
            <Icon icon="mdi:trash-can-outline" className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1">
        <SimpleBar className="h-full w-full" autoHide={false}>
          <div className="min-w-full">{children}</div>
        </SimpleBar>
      </div>
    </div>
  );
}

/** Placeholder tile for a widget that failed to load or whose definition is missing. */
export function WidgetCardFallback({
  title = "Unknown widget",
  description = "This widget could not be loaded.",
  onRemove,
  removeLabel = "Remove widget",
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col gap-1 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-foreground",
        className
      )}
    >
      {onRemove ? (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          {...stopDrag}
          className="absolute right-2 top-2 rounded-sm p-1 text-destructive transition-colors hover:bg-destructive/20"
        >
          <Icon icon="mdi:trash-can-outline" className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
