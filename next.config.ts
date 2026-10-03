import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/**
 * Sent on every response.
 *
 * - `frame-ancestors 'none'` / `X-Frame-Options: DENY`: no other site can
 *   frame our pages, so one-click forms (log out, account changes) can't be
 *   clickjacked.
 * - `nosniff`: browsers use the declared content type, never a guess.
 * - `strict-origin-when-cross-origin`: other sites see our origin, not full
 *   URLs (which can carry `?email=`).
 * - HSTS: HTTPS only, for a year, subdomains included. Not `preload` — that
 *   list is hard to leave, so it's a separate decision.
 *
 * Deliberately not a full Content-Security-Policy: it needs allow-listing for
 * whatever third parties a project adds and Next's inline scripts.
 *
 * Static files (`public/`, `/_next/static`) are served by Workers Assets
 * before Next runs and never get these; `public/_headers` repeats them.
 */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // Signed-in API responses must never be kept by a browser or proxy.
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
    ];
  },
};

// Gives `next dev` the Cloudflare bindings from wrangler.jsonc (the rate
// limiters), so getCloudflareContext() works locally as it does on Workers.
// Variables still come from .env.local. See docs/CLOUDFLARE.md.
initOpenNextCloudflareForDev();

export default nextConfig;
