"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Icon } from "@iconify/react";
import SimpleBar from "simplebar-react";

import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-background/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        className
      )}
      {...props}
    />
  );
}

/**
 * Deliberately near full-screen and unconstrained in width — inset-4 on
 * every side, no max-width. Scrolls via SimpleBar when content overflows
 * vertically, not a native scrollbar.
 *
 * The default close button is a solid primary-colored badge (`rounded-md`, same
 * radius as `Button` — not a circle) that floats half outside the dialog's
 * own top edge (`-top-4`, overlapping the rounded corner) rather than
 * sitting flush inside the padding — `right-8` keeps it off the very corner,
 * not flush against the right edge either. Invisible until the pointer is
 * somewhere over the dialog (`group`/`group-hover` on `DialogPrimitive
 * .Content`), rather than sitting there permanently.
 *
 * `hideClose` drops it entirely — for a dialog that wants its own close
 * affordance instead (positioned inline somewhere in its own layout, or none
 * at all, relying on the overlay-click/Escape Radix already gives every
 * dialog for free). `closeClassName` is for the narrower case of keeping the
 * default button but changing *when* it's shown (e.g. `"hidden md:flex"` to
 * swap in a custom inline close on small screens while keeping this one on
 * desktop) — `hideClose` is all-or-nothing, this is responsive. A caller
 * doesn't need a separate prop to *supply* a wholly custom close button
 * elsewhere, though — `DialogClose` is exported below and works wrapped
 * around any element, anywhere inside `DialogContent`'s children, same as
 * the default one internally.
 */
export function DialogContent({
  className,
  children,
  hideClose = false,
  closeClassName,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { hideClose?: boolean; closeClassName?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "group fixed inset-4 z-50 flex flex-col rounded-3xl bg-popover/60 backdrop-blur-lg outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          className
        )}
        {...props}
      >
        <SimpleBar className="min-h-0 flex-1" style={{ maxHeight: "100%" }}>
          <div className="flex flex-col gap-4 p-6">{children}</div>
        </SimpleBar>
        {!hideClose && (
          <DialogPrimitive.Close
            aria-label="Close"
            className={cn(
              "absolute -top-4 right-8 flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-primary/90",
              closeClassName
            )}
          >
            <Icon icon="mdi:close" className="h-4 w-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-lg font-semibold", className)} {...props} />;
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
  );
}

/** Action row at the bottom of a dialog — stacked on mobile (primary action last = on top), right-aligned row from sm up. */
export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}
