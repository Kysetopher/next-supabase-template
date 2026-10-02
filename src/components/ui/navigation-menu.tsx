"use client";

import * as React from "react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { Icon } from "@iconify/react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** Trigger look, exported so plain links in the same menu (via NavigationMenuLink asChild) can match it. */
export const navigationMenuTriggerStyle = cva(
  "inline-flex h-9 items-center justify-center gap-1 rounded-md border border-transparent px-3 text-sm font-medium outline-none transition-colors " +
    "hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "data-[state=open]:border-border data-[active]:text-primary"
);

const OpenUpwardsContext = React.createContext(false);

type NavigationMenuProps = React.ComponentProps<typeof NavigationMenuPrimitive.Root> & {
  /**
   * Render every panel inside one shared Radix viewport (animates size between
   * panels, slides content left/right). Off by default: each panel renders in
   * place under the menu root.
   */
  viewport?: boolean;
  /** Open panels above the menu instead of below (e.g. a menu in a footer). */
  openUpwards?: boolean;
};

export function NavigationMenu({
  className,
  children,
  viewport = false,
  openUpwards = false,
  ...props
}: NavigationMenuProps) {
  return (
    <OpenUpwardsContext.Provider value={openUpwards}>
      <NavigationMenuPrimitive.Root
        data-viewport={viewport}
        data-open-upwards={openUpwards || undefined}
        className={cn("group/navigation-menu relative flex max-w-max flex-1 items-center justify-center", className)}
        {...props}
      >
        {children}
        {viewport ? <NavigationMenuViewport /> : null}
      </NavigationMenuPrimitive.Root>
    </OpenUpwardsContext.Provider>
  );
}

export function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      className={cn("group flex flex-1 list-none items-center justify-center gap-1", className)}
      {...props}
    />
  );
}

export const NavigationMenuItem = NavigationMenuPrimitive.Item;

/** Trigger with a chevron that flips while its panel is open. Pass `chevron={false}` to hide it. */
export function NavigationMenuTrigger({
  className,
  children,
  chevron = true,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger> & { chevron?: boolean }) {
  const openUpwards = React.useContext(OpenUpwardsContext);
  return (
    <NavigationMenuPrimitive.Trigger className={cn(navigationMenuTriggerStyle(), "group", className)} {...props}>
      {children}
      {chevron ? (
        <Icon
          icon={openUpwards ? "lucide:chevron-up" : "lucide:chevron-down"}
          className="size-3 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      ) : null}
    </NavigationMenuPrimitive.Trigger>
  );
}

/**
 * Dropdown panel for a trigger. Without a viewport (the default) it renders in
 * place: absolutely positioned under (or above, with `openUpwards`) the menu
 * root on md+, stacked full-width below that. With `viewport`, it renders
 * inside the shared viewport and slides between panels.
 */
export function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  const openUpwards = React.useContext(OpenUpwardsContext);
  return (
    <NavigationMenuPrimitive.Content
      className={cn(
        // Shared-viewport mode: Radix sizes the viewport; content slides on motion.
        "left-0 top-0 w-full md:absolute md:w-auto",
        "data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in-0 data-[motion^=to-]:fade-out-0",
        "data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52",
        // In-place mode: the content is the panel itself.
        "group-data-[viewport=false]/navigation-menu:z-50 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-md group-data-[viewport=false]/navigation-menu:bg-secondary group-data-[viewport=false]/navigation-menu:text-secondary-foreground group-data-[viewport=false]/navigation-menu:shadow-md",
        openUpwards
          ? "group-data-[viewport=false]/navigation-menu:top-auto group-data-[viewport=false]/navigation-menu:bottom-full group-data-[viewport=false]/navigation-menu:mb-1.5"
          : "group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5",
        "group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-in group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-out group-data-[viewport=false]/navigation-menu:data-[state=open]:fade-in-0 group-data-[viewport=false]/navigation-menu:data-[state=closed]:fade-out-0 group-data-[viewport=false]/navigation-menu:data-[state=open]:zoom-in-95 group-data-[viewport=false]/navigation-menu:data-[state=closed]:zoom-out-95",
        className
      )}
      {...props}
    />
  );
}

/** Shared panel container. Rendered automatically by `<NavigationMenu viewport>`; export kept for custom placement. */
export function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  const openUpwards = React.useContext(OpenUpwardsContext);
  return (
    <div className={cn("absolute left-0 isolate z-50 flex justify-center", openUpwards ? "bottom-full" : "top-full")}>
      <NavigationMenuPrimitive.Viewport
        className={cn(
          "relative h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md bg-secondary text-secondary-foreground shadow-md md:w-[var(--radix-navigation-menu-viewport-width)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90",
          openUpwards ? "mb-1.5 origin-bottom" : "mt-1.5 origin-top",
          className
        )}
        {...props}
      />
    </div>
  );
}

/** Small arrow under the active trigger. Place inside `NavigationMenuList`, after the items. */
export function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      className={cn(
        "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden",
        "data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out-0 data-[state=visible]:fade-in-0",
        className
      )}
      {...props}
    >
      <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  );
}

/** Use with Next's <Link> via `asChild`: <NavigationMenuLink asChild><Link href="/x">X</Link></NavigationMenuLink>. */
export const NavigationMenuLink = NavigationMenuPrimitive.Link;
