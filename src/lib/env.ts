/**
 * Server env vars, checked once at boot (src/instrumentation.ts) so a missing
 * or malformed value stops the server with a plain message instead of
 * failing deep inside the first request. Read them through `env` rather than
 * `process.env.X!`. See .env.example for where each value comes from.
 */
const VARS = {
  SUPABASE_URL: "your Supabase project URL (Dashboard > Settings > API)",
  SUPABASE_PUBLISHABLE_KEY: "the publishable key (Dashboard > Settings > API Keys)",
  SUPABASE_SECRET_KEY: "the secret key (Dashboard > Settings > API Keys)",
  SITE_URL: "the origin this app is served from, e.g. http://localhost:3000",
} as const;

type EnvName = keyof typeof VARS;

function problem(name: EnvName, value: string | undefined): string | null {
  if (!value?.trim()) return `${name} is not set — ${VARS[name]}`;
  if (name === "SUPABASE_URL" || name === "SITE_URL") {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return `${name} must be a full URL (got "${value}")`;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return `${name} must start with http:// or https://`;
    if (name === "SITE_URL" && (value.endsWith("/") || url.pathname !== "/")) {
      return `SITE_URL must be an origin with no path or trailing slash (got "${value}")`;
    }
  }
  return null;
}

/** Throws one error listing every missing or malformed variable. */
export function assertEnv(): void {
  const problems = (Object.keys(VARS) as EnvName[])
    .map((name) => problem(name, process.env[name]))
    .filter((message): message is string => message !== null);

  if (problems.length) {
    throw new Error(
      `Missing or invalid environment variables:\n${problems.map((p) => `  - ${p}`).join("\n")}\n` +
        "Copy .env.example to .env.local (or set them in your host's dashboard) and restart."
    );
  }
}

function read(name: EnvName): string {
  const value = process.env[name];
  const message = problem(name, value);
  if (message) throw new Error(message);
  return value!;
}

export const env = {
  get SUPABASE_URL() {
    return read("SUPABASE_URL");
  },
  get SUPABASE_PUBLISHABLE_KEY() {
    return read("SUPABASE_PUBLISHABLE_KEY");
  },
  get SUPABASE_SECRET_KEY() {
    return read("SUPABASE_SECRET_KEY");
  },
  get SITE_URL() {
    return read("SITE_URL");
  },
};
