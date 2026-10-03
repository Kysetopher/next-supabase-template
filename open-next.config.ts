import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext's build config for Cloudflare Workers (docs/CLOUDFLARE.md). The
 * defaults: no incremental cache, which is right while no route uses ISR or
 * `revalidate`. Add a cache override here (and its binding in wrangler.jsonc)
 * if one starts to: https://opennext.js.org/cloudflare/caching
 */
export default defineCloudflareConfig();
