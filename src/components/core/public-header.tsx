import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { site } from "@/lib/site";

export function PublicHeader() {
  return (
    <header className="flex items-center gap-6 px-6 py-4">
      <Link href="/" className="text-sm font-medium">
        {site.name}
      </Link>
      <Link href="/login" className={buttonVariants({ className: "ml-auto" })}>
        Sign in
      </Link>
    </header>
  );
}
