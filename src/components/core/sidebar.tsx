import Link from "next/link";
import { Icon } from "@iconify/react";

/** Slim icon-only nav for the protected app. Add a link here for each new page under `(protected)/`. */
const LINKS = [
  { href: "/dashboard", icon: "mdi:view-dashboard-outline", label: "Dashboard" },
  { href: "/components", icon: "mdi:shape-outline", label: "Components" },
  { href: "/account", icon: "mdi:account-outline", label: "Account" },
];

export function Sidebar() {
  return (
    <nav className="flex w-12 shrink-0 flex-col items-center gap-2 py-4">
      {LINKS.map(({ href, icon, label }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          className="relative inline-flex h-9 w-9 items-center justify-center text-muted-foreground/70 transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Icon icon={icon} className="h-5 w-5" />
        </Link>
      ))}
    </nav>
  );
}
