"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";

/**
 * Shared body for the error boundaries (app/error.tsx, app/(protected)/error.tsx).
 * Server Component errors arrive with a generic message in production — only
 * `digest` is safe to show; it matches the full error in the server logs.
 */
export function ErrorState({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Report to an error-monitoring service here.
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">Try again, or head back home if it keeps happening.</p>
        {error.digest ? <p className="font-mono text-xs text-muted-foreground">Ref: {error.digest}</p> : null}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => retry()}>Try again</Button>
        <Link href="/" className={buttonVariants({ variant: "secondary" })}>
          Go home
        </Link>
      </div>
    </div>
  );
}
