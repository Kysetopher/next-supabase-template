"use client";

import { ErrorState } from "@/components/core/error-state";

/** Inside the protected layout, so the sidebar stays put while the page errors. */
export default function ProtectedError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorState {...props} />;
}
