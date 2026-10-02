import type { MetadataRoute } from "next";

/** Keeps crawlers off the private and functional routes. Not a security boundary — requireUser() is. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/account", "/components", "/auth/", "/api/"],
    },
  };
}
