import Image from "next/image";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LogoLinkCardProps = {
  href: string;
  title: string;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  /** Image URL for the logo badge (rendered with next/image; remote hosts must be allowed in next.config `images`). */
  logoSrc?: string;
  /** Or any node (e.g. an <Icon />) instead of an image. Takes precedence over `logoSrc`. */
  logo?: React.ReactNode;
  /** Alt text for `logoSrc`. Defaults to "<title> logo". */
  logoAlt?: string;
  /** Open in a new tab. Defaults to true for absolute http(s) URLs. */
  external?: boolean;
  className?: string;
};

/**
 * Link card with a round logo badge overlapping its top edge, plus title,
 * optional subtitle and description — for "where to find me", partner, or
 * project lists. The whole card is the link; the badge lifts on hover.
 */
export function LogoLinkCard({
  href,
  title,
  subtitle,
  description,
  logoSrc,
  logo,
  logoAlt,
  external = /^https?:\/\//.test(href),
  className,
}: LogoLinkCardProps) {
  const badge = logo ?? (logoSrc ? <Image src={logoSrc} alt={logoAlt ?? `${title} logo`} width={32} height={32} /> : null);

  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn("group block rounded-lg pt-4 focus-visible:outline-none", className)}
    >
      <Card className="relative transition-shadow group-hover:ring-2 group-hover:ring-primary group-focus-visible:ring-2 group-focus-visible:ring-ring">
        {badge ? (
          <div className="absolute -top-4 left-4 flex size-10 items-center justify-center overflow-hidden rounded-full border border-border bg-card shadow transition-transform group-hover:-translate-y-1 group-hover:scale-110">
            {badge}
          </div>
        ) : null}
        <div className={cn("px-4 pb-3", badge ? "pt-9" : "pt-3")}>
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm font-medium">{subtitle}</p> : null}
          {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </Card>
    </Link>
  );
}

export type { LogoLinkCardProps };
