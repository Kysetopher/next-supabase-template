// components/ui/password-input-field.tsx
"use client";

import * as React from "react";
import { Icon } from "@iconify/react";

import { cn } from "@/lib/utils";
import { InputField, type InputFieldProps } from "@/components/ui/input-field";

type PasswordInputFieldProps = Omit<InputFieldProps, "type" | "rightElement"> & {
  defaultVisible?: boolean;
};

export function PasswordInputField({
  defaultVisible = false,
  leftIcon = "mdi:lock-outline",
  className,
  ...props
}: PasswordInputFieldProps) {
  const [visible, setVisible] = React.useState(defaultVisible);

  return (
    <InputField
      {...props}
      leftIcon={leftIcon}
      type={visible ? "text" : "password"}
      className={cn("pr-10", className)}
      rightElement={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className={cn(
            "inline-flex items-center justify-center",
            "text-muted-foreground/60 transition hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <Icon
            icon={visible ? "mdi:eye-off-outline" : "mdi:eye-outline"}
            className="h-4 w-4"
          />
        </button>
      }
    />
  );
}
