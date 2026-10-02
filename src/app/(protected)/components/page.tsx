import { ComponentGallery } from "@/components/gallery/component-gallery";
import { requireUser } from "@/lib/supabase/dal";

export const metadata = {
  title: "Components",
};

const SECTIONS = [
  { id: "actions", title: "Actions" },
  { id: "forms", title: "Forms" },
  { id: "overlays", title: "Overlays" },
  { id: "data-display", title: "Data display" },
  { id: "navigation", title: "Navigation" },
  { id: "layout", title: "Layout" },
  { id: "motion", title: "Motion" },
];

/** Living gallery of src/components/ui — one representative example of every component. */
export default async function ComponentsPage() {
  await requireUser();

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12">
        <header className="space-y-3">
          <h1 className="text-lg font-semibold">Components</h1>
          <p className="text-sm text-muted-foreground">
            Every component in <code className="font-mono">src/components/ui</code>, grouped by purpose.
          </p>
          <nav aria-label="Sections" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="text-muted-foreground transition-colors hover:text-foreground">
                {s.title}
              </a>
            ))}
          </nav>
        </header>
        <ComponentGallery />
      </div>
    </div>
  );
}
