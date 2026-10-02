import { site } from "@/lib/site";

/** Footer for the focused, header-less flows (auth). */
export function SiteFooter() {
  return (
    <footer className="flex justify-center px-6 py-6 text-xs text-muted-foreground">
      © {new Date().getFullYear()} {site.name}
    </footer>
  );
}
