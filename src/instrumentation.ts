/** Runs once when a server instance starts, before it handles any request. */
export async function register() {
  const { assertEnv } = await import("@/lib/env");
  assertEnv();
}
