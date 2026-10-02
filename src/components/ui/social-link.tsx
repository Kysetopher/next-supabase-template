import Link from "next/link";
import { Icon } from "@iconify/react";

import { cn } from "@/lib/utils";

export interface SocialLinkItem {
  /** Accessible name, and the visible text when `showLabel` is set. */
  label: string;
  href: string;
  /** Iconify icon name, e.g. "simple-icons:github" or "lucide:mail". */
  icon: string;
}

export interface SocialLinkProps extends SocialLinkItem {
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
}

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}

/** An icon link to an external profile (or any URL). External links open in a new tab. */
export function SocialLink({ label, href, icon, showLabel = false, className, iconClassName }: SocialLinkProps) {
  const isExternal = isExternalHref(href);

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      aria-label={showLabel ? undefined : label}
      className={cn("inline-flex items-center gap-2 text-foreground transition-colors hover:text-primary", className)}
    >
      <Icon icon={icon} className={cn("size-4", iconClassName)} aria-hidden="true" />
      {showLabel && label}
    </Link>
  );
}

export interface SocialLinksProps {
  links: SocialLinkItem[];
  showLabel?: boolean;
  className?: string;
  linkClassName?: string;
  iconClassName?: string;
}

/** A horizontal row of `SocialLink`s. Links with an empty `href` are skipped. */
export function SocialLinks({ links, showLabel, className, linkClassName, iconClassName }: SocialLinksProps) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-4", className)}>
      {links
        .filter((link) => link.href)
        .map((link) => (
          <li key={link.href}>
            <SocialLink {...link} showLabel={showLabel} className={linkClassName} iconClassName={iconClassName} />
          </li>
        ))}
    </ul>
  );
}
