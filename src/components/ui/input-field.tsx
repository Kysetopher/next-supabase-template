// components/ui/input-field.tsx
import * as React from "react";
import { Icon } from "@iconify/react";

import { cn } from "@/lib/utils";
import { Input, type InputProps } from "@/components/ui/input";

type InputFieldProps = InputProps & {
  leftIcon?: string;
  rightElement?: React.ReactNode;
  iconClassName?: string;
  rightClassName?: string;
};

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      leftIcon,
      rightElement,
      iconClassName,
      rightClassName,
      className,
      type,
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative group">
        {leftIcon ? (
          <Icon
            icon={leftIcon}
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
              "text-muted-foreground/50 transition group-focus-within:text-foreground",
              iconClassName
            )}
          />
        ) : null}

        <Input
          ref={ref}
          type={type}
          className={cn(leftIcon && "pl-9", rightElement && "pr-9", className)}
          {...props}
        />

        {rightElement ? (
          <div
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              rightClassName
            )}
          >
            {rightElement}
          </div>
        ) : null}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export { InputField };
export type { InputFieldProps };
