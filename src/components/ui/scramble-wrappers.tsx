import {
  CrunchReplace as CrunchReplaceClient,
  DisappearReplace as DisappearReplaceClient,
  SmoothReplace as SmoothReplaceClient,
  type ReplaceProps,
} from "@/components/ui/scramble-typing";

/**
 * Server-renderable wrappers around the client-only Replace effects that add a
 * `<noscript>` fallback containing every message, so the copy is still present
 * for crawlers and no-JS visitors. Accent markup (`<` / `>`) is stripped.
 */

function plainMessages(messages: string[]) {
  return messages.map((m) => m.replace(/[<>]/g, "")).join(" ");
}

export function SmoothReplace(props: ReplaceProps) {
  return (
    <>
      <SmoothReplaceClient {...props} />
      <noscript suppressHydrationWarning>{plainMessages(props.messages)}</noscript>
    </>
  );
}

export function DisappearReplace(props: ReplaceProps) {
  return (
    <>
      <DisappearReplaceClient {...props} />
      <noscript suppressHydrationWarning>{plainMessages(props.messages)}</noscript>
    </>
  );
}

export function CrunchReplace(props: ReplaceProps) {
  return (
    <>
      <CrunchReplaceClient {...props} />
      <noscript suppressHydrationWarning>{plainMessages(props.messages)}</noscript>
    </>
  );
}

export type { ReplaceProps };
