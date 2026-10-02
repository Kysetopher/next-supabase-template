"use client";

import * as React from "react";
import { Icon } from "@iconify/react";

import { IconButton } from "@/components/ui/icon-button";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SearchBarProps = Omit<InputProps, "type"> & {
  /**
   * Called when the clear button is pressed. Optional — without it the input
   * is cleared through a synthetic input event, so a plain `onChange` handler
   * (controlled or not) still sees the empty value.
   */
  onClear?: () => void;
  /** Accessible label for the clear button. */
  clearLabel?: string;
  containerClassName?: string;
};

/** Sets an input's value the way the browser would, so React's onChange fires. */
function setNativeInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/** A search input with a trailing magnifier icon that turns into a clear button once there's a value. */
export function SearchBar({
  className,
  containerClassName,
  value,
  defaultValue,
  onChange,
  onClear,
  clearLabel = "Clear search",
  ref,
  ...props
}: SearchBarProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [uncontrolledValue, setUncontrolledValue] = React.useState(String(defaultValue ?? ""));
  const currentValue = value !== undefined ? String(value) : uncontrolledValue;
  const hasValue = currentValue.length > 0;

  const setRefs = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref]
  );

  const handleClear = () => {
    if (onClear) onClear();
    else if (inputRef.current) setNativeInputValue(inputRef.current, "");
    if (value === undefined) setUncontrolledValue("");
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", containerClassName)}>
      <Input
        ref={setRefs}
        type="search"
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => {
          if (value === undefined) setUncontrolledValue(event.target.value);
          onChange?.(event);
        }}
        className={cn("pr-9 [&::-webkit-search-cancel-button]:appearance-none", className)}
        {...props}
      />

      <div className="absolute inset-y-0 right-0 flex items-center pr-1">
        {hasValue ? (
          <IconButton aria-label={clearLabel} icon="lucide:x" size="sm" onClick={handleClear} />
        ) : (
          <span className="pointer-events-none flex size-7 items-center justify-center text-muted-foreground">
            <Icon icon="lucide:search" className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );
}
