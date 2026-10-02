---
name: new-component
description: Use when adding or extending a UI component in this repo's own library (src/components/ui) or a feature module (src/components/<feature>/) — conventions, theme tokens, client/server boundary, the /components gallery entry, and keeping the docs-site component catalog in sync.
---

# Add or extend a component

Conventions: docs/PRACTICES.md → *Components* and *Styling*.

## 1. Where it goes

- A reusable primitive or composite → `src/components/ui/<kebab-name>.tsx`.
- Several components for one feature → `src/components/<feature>/` (like `calendar/`, `billing/`), with types and helpers in `src/lib/<feature>/`.
- App chrome → `src/components/core/`.

**Extend before you add.** If a component already covers most of it, add a
prop, variant or sub-component to it — additively, without changing existing
exports, props, defaults or styling (other code depends on them).

## 2. Write it

- Named exports; `cn` from `@/lib/utils` to merge `className`.
- `"use client"` only for state, effects, handlers or browser APIs — and then it's required, even with no hooks.
- Colors only from the semantic tokens in `src/app/globals.css` (`bg-secondary`, `text-muted-foreground`, `border-border`, `ring-ring`, `text-primary` …). No hex, no `dark:`. `accent` is a surface, not text.
- Icons from `@iconify/react`; scrolling via `simplebar-react`.
- Anything that awaits a request shows `loading` (or uses `SubmitButton` inside a form).
- Accessible: keyboard reachable, labelled (`aria-label` on icon-only controls), visible focus ring.
- Driven by props — no hard-coded copy, URLs, product names or data. This template is unbranded.
- Avoid hydration mismatches: no `Date.now()` / `Math.random()` in render; make "today" injectable or compute it in an effect.

## 3. Show it in the gallery

Add an example to `src/components/gallery/component-gallery.tsx` in the right
section (Actions, Forms, Overlays, Data display, Navigation, Layout, Motion, or
the feature's own section). Use fixed sample data so the server and browser render the same.

## 4. Check

```bash
npm run typecheck
npm run lint
npm run test:e2e
```

Then run the app, sign in, and look at `/components` at desktop and phone width.

## 5. Keep the docs site in sync

The docs site has a catalog of this library (the template's space in the docs
repo: `src/lib/records/template/component-catalog.ts`, plus screenshots in
`public/template/components/`). Add an entry for the new component — import
path, exports, notable props, a usage snippet checked against the real API —
and recapture that section's screenshot if it changed visibly.
