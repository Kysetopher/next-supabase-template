import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/core/site-footer";
import { site } from "@/lib/site";

/** Functional entry points, not content — no search-result value, and a random login form ranking in search would be actively confusing. Applies to every page in this group since it's set on the shared layout. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SessionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4">
        <Link href="/" aria-label={`${site.name} home`} className="mx-auto text-2xl font-semibold tracking-tight">
          {site.name}
        </Link>
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
