"use client";

import { ErrorState } from "@/components/core/error-state";

export default function Error(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorState {...props} />;
}
