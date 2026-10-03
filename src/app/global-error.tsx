"use client";

import { useEffect } from "react";

/**
 * Colors repeat the tokens in src/app/globals.css :root (this page gets no
 * stylesheet) — keep them in sync when rebranding.
 *
 * Replaces the root layout when it (or something above every error.tsx)
 * throws, so it renders its own document and gets none of globals.css —
 * styles are inline, with the same values as the theme tokens.
 */
export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 16,
          textAlign: "center",
          background: "#0a0a0a",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <title>Something went wrong</title>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Something went wrong</h1>
        <p style={{ fontSize: 14, color: "#71717a", margin: 0 }}>Try again, or reload the page.</p>
        {error.digest ? (
          <p style={{ fontSize: 12, color: "#71717a", margin: 0, fontFamily: "monospace" }}>Ref: {error.digest}</p>
        ) : null}
        <button
          onClick={() => retry()}
          style={{
            border: 0,
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 500,
            background: "#5b6cf0",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
