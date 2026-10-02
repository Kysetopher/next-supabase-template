"use client";

import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  /** Route to push. Omit to go back one entry in browser history. */
  href?: string;
};

/** Ghost button with a leading arrow — pushes `href` when given, otherwise `router.back()`. */
export function BackButton({ href, className, children = "Back", variant = "ghost", ...props }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant={variant}
      className={cn("gap-2", className)}
      onClick={() => (href ? router.push(href) : router.back())}
      {...props}
    >
      <Icon icon="mdi:arrow-left" className="h-5 w-5" aria-hidden="true" />
      {children}
    </Button>
  );
}
