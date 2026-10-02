"use client";

import { useSyncExternalStore } from "react";

// One shared clock for every subscriber, ticking on the minute.
let now: Date | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

function tick() {
  now = new Date();
  listeners.forEach((listener) => listener());
  timer = setTimeout(tick, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    // Refresh immediately: the cached value may be stale from an earlier mount.
    // React re-reads the snapshot after subscribing and re-renders if it changed.
    clearTimeout(timer);
    tick();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) clearTimeout(timer);
  };
}

const getSnapshot = () => now;
const getServerSnapshot = () => null;

/**
 * The current time, updated every minute — or `null` during SSR and hydration,
 * so markup that depends on "now" can't mismatch between server and client.
 * Pass `override` (e.g. a fixed date in demos/tests) to skip the clock entirely.
 */
export function useNow(override?: Date | null): Date | null {
  const live = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return override === undefined ? live : override;
}
