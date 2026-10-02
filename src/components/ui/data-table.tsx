"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Feature set for DataTable (TanStack Table v9 registers features
 * explicitly): click-to-sort headers with the built-in sort functions. Build
 * columns against it with `createDataTableColumnHelper<Row>()` or type them
 * as `DataTableColumnDef<Row>[]`.
 */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
});

export type DataTableFeatures = typeof dataTableFeatures;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- column value types differ per column, same as TanStack's own examples
export type DataTableColumnDef<TData extends RowData> = ColumnDef<DataTableFeatures, TData, any>;

export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>();
}

type DataTableProps<TData extends RowData> = {
  /** Keep stable (module scope or useMemo) — a new array each render rebuilds the table models. */
  columns: DataTableColumnDef<TData>[];
  /** Keep stable for the same reason. */
  data: TData[];
  emptyMessage?: React.ReactNode;
  className?: string;
  /**
   * Opt-in spreadsheet-style cell selection: click a cell, shift-click another
   * to select the rectangle between them, then Ctrl/Cmd+C copies it as
   * tab-separated values (raw cell values, not rendered output).
   */
  selectable?: boolean;
  /** With `selectable`, show a "Copy selection" button + hint above the table. Defaults to true. */
  showCopyButton?: boolean;
};

const SORT_ICONS = {
  asc: "mdi:arrow-up",
  desc: "mdi:arrow-down",
} as const;

type CellPos = { row: number; col: number };

function inRange(pos: CellPos, a: CellPos, b: CellPos) {
  return (
    pos.row >= Math.min(a.row, b.row) &&
    pos.row <= Math.max(a.row, b.row) &&
    pos.col >= Math.min(a.col, b.col) &&
    pos.col <= Math.max(a.col, b.col)
  );
}

function cellText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Sortable table on top of the plain Table primitives. Click a header to cycle asc → desc → none; disable per column with `enableSorting: false`.
 * Pass `selectable` for spreadsheet-style range selection + copy as TSV.
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  emptyMessage = "No results.",
  className,
  selectable = false,
  showCopyButton = true,
}: DataTableProps<TData>) {
  const table = useTable({ features: dataTableFeatures, columns, data });
  const rows = table.getRowModel().rows;

  const [anchor, setAnchor] = React.useState<CellPos | null>(null);
  const [focus, setFocus] = React.useState<CellPos | null>(null);
  const [status, setStatus] = React.useState<"idle" | "copied" | "error">("idle");
  const statusTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(statusTimer.current), []);

  function flash(next: "copied" | "error") {
    setStatus(next);
    clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus("idle"), next === "copied" ? 1200 : 1500);
  }

  function selectionText(): string {
    if (!anchor || !focus) return "";
    const lines: string[] = [];
    for (let r = Math.min(anchor.row, focus.row); r <= Math.max(anchor.row, focus.row); r++) {
      const cells = rows[r]?.getAllCells();
      if (!cells) continue;
      const line: string[] = [];
      for (let c = Math.min(anchor.col, focus.col); c <= Math.max(anchor.col, focus.col); c++) {
        line.push(cellText(cells[c]?.getValue()));
      }
      lines.push(line.join("\t"));
    }
    return lines.join("\n");
  }

  async function copySelection() {
    const text = selectionText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      flash("copied");
    } catch {
      // Clipboard access can be denied (permissions policy, unfocused document) — surface it instead of failing silently.
      flash("error");
    }
  }

  function handleCellMouseDown(pos: CellPos, shiftKey: boolean) {
    if (shiftKey && anchor) {
      setFocus(pos);
    } else {
      setAnchor(pos);
      setFocus(pos);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c" && anchor) {
      e.preventDefault();
      void copySelection();
    } else if (e.key === "Escape") {
      setAnchor(null);
      setFocus(null);
    }
  }

  const tableEl = (
    <Table className={className}>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => {
              const canSort = header.column.getCanSort();
              const sorted = header.column.getIsSorted();
              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                  className={cn(canSort && "cursor-pointer select-none hover:text-foreground")}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder ? null : (
                    <span className="inline-flex items-center gap-1">
                      <table.FlexRender header={header} />
                      {sorted ? <Icon icon={SORT_ICONS[sorted]} className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                    </span>
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>

      <TableBody>
        {rows.length ? (
          rows.map((row, rowIndex) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell, colIndex) => {
                const pos = { row: rowIndex, col: colIndex };
                const selected = selectable && anchor && focus && inRange(pos, anchor, focus);
                return (
                  <TableCell
                    key={cell.id}
                    onMouseDown={selectable ? (e) => handleCellMouseDown(pos, e.shiftKey) : undefined}
                    aria-selected={selectable ? Boolean(selected) : undefined}
                    className={cn(
                      selectable && "cursor-cell select-none",
                      selected && "bg-primary/10 ring-1 ring-inset ring-primary"
                    )}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={table.getAllLeafColumns().length || 1} className="h-24 text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  if (!selectable) return tableEl;

  return (
    <div className="flex flex-col gap-2">
      {showCopyButton ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            onClick={() => void copySelection()}
            disabled={!anchor}
          >
            {status === "copied" ? "Copied" : status === "error" ? "Couldn't copy" : "Copy selection"}
          </Button>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            Click a cell, shift-click to select a range, then copy (⌘/Ctrl+C).
          </span>
        </div>
      ) : null}
      <div
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {tableEl}
      </div>
    </div>
  );
}
