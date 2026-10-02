"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Icon } from "@iconify/react";

import { cn } from "@/lib/utils";

const SELECT_CONTENT_ANIMATION =
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)";

const ANY_VALUE = "__any__";

export function Select({
  value,
  onValueChange,
  placeholder = "Any",
  className,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <SelectPrimitive.Root
      value={value === "" ? ANY_VALUE : value}
      onValueChange={(v) => onValueChange(v === ANY_VALUE ? "" : v)}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <Icon icon="mdi:chevron-down" className="h-4 w-4 text-secondary-foreground/70" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "z-50 max-h-64 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md bg-secondary text-sm text-secondary-foreground",
            SELECT_CONTENT_ANIMATION
          )}
        >
          <SelectPrimitive.Viewport className="p-1">
            <SelectItem value={ANY_VALUE}>{placeholder}</SelectItem>
            {children}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export function SelectItem({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <SelectPrimitive.Item
      value={value}
      className={cn(
        "flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground",
        className
      )}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <Icon icon="mdi:check" className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

/*
 * Composable parts for when the all-in-one `Select` above doesn't fit — no
 * implicit "Any" option, grouped/labelled options, a custom trigger, or an
 * uncontrolled select inside a <form>. Same surfaces as `Select`; reuse
 * `SelectItem` for the options.
 *
 *   <SelectRoot value={v} onValueChange={setV}>
 *     <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
 *     <SelectContent>
 *       <SelectGroup>
 *         <SelectLabel>Fruit</SelectLabel>
 *         <SelectItem value="apple">Apple</SelectItem>
 *       </SelectGroup>
 *     </SelectContent>
 *   </SelectRoot>
 */
export const SelectRoot = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 data-[placeholder]:text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <Icon icon="mdi:chevron-down" className="h-4 w-4 text-secondary-foreground/70" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <Icon icon="mdi:chevron-up" className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

export function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <Icon icon="mdi:chevron-down" className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export function SelectContent({
  className,
  children,
  position = "popper",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-h-64 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md bg-secondary text-sm text-secondary-foreground shadow-md",
          SELECT_CONTENT_ANIMATION,
          className
        )}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return <SelectPrimitive.Label className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)} {...props} />;
}

export function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}
