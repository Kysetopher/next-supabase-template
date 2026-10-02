"use client";

import type { ReactNode } from "react";

import { Collapsible } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type TreeNode = {
  id: string;
  label: ReactNode;
  children?: TreeNode[];
  icon?: ReactNode;
  /** Trailing controls for the row (buttons, menus). */
  actions?: ReactNode;
  defaultExpanded?: boolean;
  /** Controlled expansion; pair with `onToggle`. */
  expanded?: boolean;
  disabled?: boolean;
  meta?: Record<string, unknown>;
  /** Overrides `selectedId`/`selectedIds` for this node. */
  selected?: boolean;
};

export type HierarchyProps = {
  nodes: TreeNode[];
  onToggle?: (node: TreeNode, expanded: boolean) => void;
  selectedId?: string;
  selectedIds?: string[];
  className?: string;
  renderLabel?: (node: TreeNode, depth: number) => ReactNode;
};

const ROW_CLASS = cn(
  "flex min-h-7 w-full cursor-pointer items-center gap-2 p-0",
  "rounded-md rounded-r-none border border-r-0 border-transparent",
  "data-[selected=true]:border-primary/30 data-[selected=true]:bg-primary/10",
  "data-[disabled=true]:opacity-50"
);

/**
 * Recursive tree view. Branches expand via `Collapsible`; leaves get a dot
 * in the same fixed-size box as the chevron so labels align across depths.
 */
export function Hierarchy({ nodes, className, ...shared }: HierarchyProps) {
  return (
    <div className={cn("w-full", className)} role="tree">
      <HierarchyLevel list={nodes} depth={0} {...shared} />
    </div>
  );
}

type LevelProps = Omit<HierarchyProps, "nodes" | "className"> & { list: TreeNode[]; depth: number };

function HierarchyLevel({ list, depth, onToggle, selectedId, selectedIds, renderLabel }: LevelProps) {
  return list.map((node) => {
    const hasChildren = !!node.children?.length;
    const label = renderLabel ? renderLabel(node, depth) : node.label;
    const isSelected =
      node.selected ?? (selectedIds?.includes(node.id) || (selectedId !== undefined && node.id === selectedId));

    if (!hasChildren) {
      return (
        <div
          key={node.id}
          className={ROW_CLASS}
          role="treeitem"
          aria-selected={isSelected}
          data-disabled={!!node.disabled}
          data-selected={isSelected}
        >
          <span aria-hidden="true" className="inline-flex h-5 w-5 flex-none items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-current/60" />
          </span>
          <div className="inline-flex min-w-0 grow items-center gap-2">
            {node.icon ? <span className="shrink-0">{node.icon}</span> : null}
            <span className="truncate">{label}</span>
          </div>
          {node.actions ? <div className="shrink-0">{node.actions}</div> : null}
        </div>
      );
    }

    const branchLabel = (
      <div className="flex w-full min-w-0 items-center gap-2">
        <span className="inline-flex min-w-0 grow items-center gap-2">
          {node.icon ? <span className="shrink-0">{node.icon}</span> : null}
          <span className="truncate">{label}</span>
        </span>
        {node.actions ? <div className="shrink-0">{node.actions}</div> : null}
      </div>
    );

    return (
      <div
        key={node.id}
        className={ROW_CLASS}
        role="treeitem"
        aria-expanded={node.expanded}
        aria-selected={isSelected}
        data-disabled={!!node.disabled}
        data-selected={isSelected}
      >
        <Collapsible
          open={node.expanded}
          defaultOpen={node.defaultExpanded}
          onOpenChange={(open) => onToggle?.(node, open)}
          disabled={node.disabled}
          className="w-full"
          triggerClassName="rounded-r-none"
          contentClassName="pl-3"
          label={branchLabel}
        >
          <div role="group">
            <HierarchyLevel
              list={node.children ?? []}
              depth={depth + 1}
              onToggle={onToggle}
              selectedId={selectedId}
              selectedIds={selectedIds}
              renderLabel={renderLabel}
            />
          </div>
        </Collapsible>
      </div>
    );
  });
}
