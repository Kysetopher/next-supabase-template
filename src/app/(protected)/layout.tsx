import type { Metadata } from "next";

import { requireUser } from "@/lib/supabase/dal";
import { Sidebar } from "@/components/core/sidebar";

/** Private app screens — no search-result value (robots.ts disallows these paths too; belt-and-suspenders, not the security boundary — requireUser() below is). */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Gates the whole segment on initial load. Pages under here also call
  // requireUser()/db() themselves for their own data — see docs/AUTH.md on
  // why a layout-only check isn't relied on as the sole gate.
  await requireUser();

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
