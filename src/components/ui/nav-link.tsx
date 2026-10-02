"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export interface NavLinkProps extends Omit<React.ComponentProps<typeof Link>, "href"> {
  href: string;
  /**
   * "exact" (default) marks the link active only on its own path; "prefix"
   * also marks it active on nested routes (e.g. /docs is active on /docs/intro).
   */
  match?: "exact" | "prefix";
  /** Classes applied only when active. */
  activeClassName?: string;
}

function isActivePath(pathname: string, href: string, match: "exact" | "prefix") {
  if (pathname === href) return true;
  if (match === "prefix" && href !== "/") return pathname.startsWith(href.endsWith("/") ? href : `${href}/`);
  return false;
}

/**
 * A navigation link that knows when it points at the current page. The link
 * for the current page renders as a non-interactive span with
 * `aria-current="page"`.
 */
export function NavLink({ href, match = "exact", className, activeClassName, children, ...props }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href, match);

  // On the page itself: render a non-interactive span. On a nested route (prefix match):
  // stay a link back to the section root, styled active.
  if (pathname === href) {
    return (
      <span aria-current="page" className={cn(className, "pointer-events-none select-none text-primary", activeClassName)}>
        {children as React.ReactNode}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        className,
        isActive ? cn("text-primary", activeClassName) : "text-muted-foreground transition-colors hover:text-foreground"
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
