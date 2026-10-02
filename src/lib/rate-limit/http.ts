import "server-only";

import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { BURST_PERIOD_SECONDS } from "@/lib/rate-limit/burst";

/** 429 for a burst-limited API request. */
export function burstLimitedResponse() {
  return NextResponse.json(
    { error: "Too many requests — try again in a minute." },
    { status: 429, headers: { "Retry-After": String(BURST_PERIOD_SECONDS) } }
  );
}

/**
 * The caller's IP, for pre-auth limits only (signup/login) — once a real
 * identity exists, key on it instead, since many users can share one IP.
 *
 * Only trust the header your host sets and overwrites: `cf-connecting-ip`
 * (Cloudflare) and `x-real-ip` (Vercel and most reverse proxies) can't be
 * spoofed through them. `x-forwarded-for` is a last-resort fallback for local
 * dev — behind a host that doesn't overwrite it, a client can set it freely.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
