import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-mono text-5xl font-semibold text-muted-foreground">404</p>
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      </div>
      <Link href="/" className={buttonVariants({ variant: "secondary" })}>
        Go home
      </Link>
    </div>
  );
}
