/**
 * Per-project identity — the only place the app's name and description live.
 * Rebrand a project here and in src/app/globals.css (colors); nothing else in
 * the template hard-codes a name. Two files repeat the color values because
 * they can't read CSS variables: src/app/global-error.tsx and FALLBACK in
 * src/components/billing/checkout-form.tsx — update them too.
 */
export const site = {
  name: "App",
  description: "A Next.js + Supabase application.",
} as const;
