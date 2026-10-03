"use client";

import { useState } from "react";
import { loadStripe, type Appearance, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

import { Button } from "@/components/ui/button";

/**
 * The publishable key arrives as a prop, read on the server at request time
 * (env.STRIPE_PUBLISHABLE_KEY), not from a NEXT_PUBLIC_ variable: those are
 * baked in by whichever build ran, so one build deployed to two
 * environments could load a live key against a test-mode payment. Loaded
 * once per key.
 */
let stripePromise: { key: string; promise: Promise<Stripe | null> } | null = null;
function getStripe(publishableKey: string) {
  if (stripePromise?.key !== publishableKey) {
    stripePromise = { key: publishableKey, promise: loadStripe(publishableKey) };
  }
  return stripePromise.promise;
}

/**
 * Fallbacks: the values in src/app/globals.css :root. Used during server
 * render and if a token can't be read.
 */
// Mirrors the tokens in src/app/globals.css :root — keep in sync when rebranding
// (used before the CSS variables can be read, e.g. on the server).
const FALLBACK = {
  "--primary": "#5b6cf0",
  "--input": "#242426",
  "--background": "#0a0a0a",
  "--foreground": "#ffffff",
  "--muted-foreground": "#71717a",
  "--destructive": "#b4323f",
  "--success": "#2f8c5a",
  "--warning": "#c08a1e",
  "--ring": "#2a3170",
  "--radius": "0.5rem",
} as const;

type Token = keyof typeof FALLBACK;

/** #rrggbbaa -> rgba(), since Elements' color parser is only documented for hex/rgb/hsl. */
function normalizeColor(value: string): string {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  if (!match) return value;
  const [r, g, b, a] = match.slice(1).map((hex) => parseInt(hex, 16));
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
}

/** Relative luminance of a #rrggbb color (0 dark - 1 light), or null if it isn't one. */
function luminance(hex: string): number | null {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex);
  if (!match) return null;
  const [r, g, b] = match.slice(1).map((part) => parseInt(part, 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * The Payment Element renders in Stripe's iframe, which can't see this
 * page's CSS variables, so the theme tokens are read once (getComputedStyle)
 * and passed as concrete values. Rebranding globals.css restyles the form
 * with no change here.
 */
function readAppearance(): Appearance {
  const style = typeof document === "undefined" ? null : getComputedStyle(document.documentElement);
  const token = (name: Token) => style?.getPropertyValue(name).trim() || FALLBACK[name];

  let radius = token("--radius");
  const rem = /^([\d.]+)rem$/.exec(radius);
  if (rem) {
    const rootSize = style ? parseFloat(style.fontSize) || 16 : 16;
    radius = `${parseFloat(rem[1]) * rootSize}px`;
  }

  const background = token("--background");
  const ring = normalizeColor(token("--ring"));

  return {
    theme: (luminance(background) ?? 0) < 0.5 ? "night" : "stripe",
    variables: {
      colorPrimary: normalizeColor(token("--primary")),
      colorBackground: normalizeColor(token("--input")),
      colorText: normalizeColor(token("--foreground")),
      colorTextSecondary: normalizeColor(token("--muted-foreground")),
      colorDanger: normalizeColor(token("--destructive")),
      colorSuccess: normalizeColor(token("--success")),
      colorWarning: normalizeColor(token("--warning")),
      borderRadius: radius,
      fontFamily: "system-ui, sans-serif",
    },
    rules: {
      ".Input": { border: "none", boxShadow: "none" },
      ".Input:focus": { border: "none", boxShadow: `0 0 0 2px ${ring}` },
      ".Tab": { border: "none" },
      ".Tab--selected": { border: "none", boxShadow: `0 0 0 2px ${ring}` },
    },
  };
}

function PaymentForm({ returnUrl, submitLabel }: { returnUrl: string; submitLabel: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    // Only reached on an immediate failure (a declined card, a validation
    // error): success or a pending payment navigates to return_url instead.
    // Stripe's message here is written for customers, so it's shown as is.
    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" loading={submitting} disabled={!stripe || !elements} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}

/**
 * Stripe's embedded Payment Element for a subscription's first invoice or a
 * one-time PaymentIntent — both hand over a client secret the same shape.
 * Confirming here is not the record of payment: the webhook is
 * (docs/STRIPE.md). `returnUrl` must be absolute.
 */
export function CheckoutForm({
  clientSecret,
  returnUrl,
  publishableKey,
  submitLabel = "Pay now",
}: {
  clientSecret: string;
  returnUrl: string;
  publishableKey: string;
  submitLabel?: string;
}) {
  // Read once, on first client render. On the server this falls back to the
  // globals.css values; Elements renders no markup of its own, so there's
  // nothing to mismatch on hydration.
  const [appearance] = useState(readAppearance);

  return (
    <Elements stripe={getStripe(publishableKey)} options={{ clientSecret, appearance }}>
      <PaymentForm returnUrl={returnUrl} submitLabel={submitLabel} />
    </Elements>
  );
}
