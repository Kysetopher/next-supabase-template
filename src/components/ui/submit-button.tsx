"use client";

import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "@/components/ui/button";

type SubmitButtonProps = Omit<ButtonProps, "type" | "loading">;

/**
 * A `Button` wired to its enclosing `<form action={...}>`'s pending state via
 * `useFormStatus()` — that hook only works in a component that's itself a
 * descendant of the form, so a plain `Button` can't do this on its own. Use
 * this instead of `Button` for any Server Action form submit.
 */
export function SubmitButton({ children, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" loading={pending} {...props}>
      {children}
    </Button>
  );
}
