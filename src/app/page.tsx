import Link from "next/link";

import { PublicHeader } from "@/components/core/public-header";
import { buttonVariants } from "@/components/ui/button";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">{site.name}</h1>
        <p className="text-muted-foreground">{site.description}</p>
        <div className="flex gap-3">
          <Link href="/signup" className={buttonVariants()}>
            Create account
          </Link>
          <Link href="/login" className={buttonVariants({ variant: "secondary" })}>
            Log in
          </Link>
        </div>
      </main>
    </div>
  );
}
