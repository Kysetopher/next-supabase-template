"use client";

import { Icon } from "@iconify/react";

import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export type TagSelectOption = {
  value: string;
  label: string;
  /** Optional per-option iconify id, shown before the label in both the list and the selected chip — omit for callers with no natural icon per value. */
  icon?: string;
};

type TagSelectProps = {
  options: TagSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
};

/**
 * A persistent search box with the filtered list always visible directly
 * beneath it — no popover layer to open first. For a large *fixed* set
 * (RealEstateAPI's ~360 property use codes) the user is browsing/searching
 * known values, not typing arbitrary new ones the way `TagInput` assumes.
 * Selected values still render as removable `Badge` pills below the list,
 * same visual family as `TagInput`, just reached by toggling instead of
 * type-then-commit.
 */
export function TagSelect({ options, value, onChange, placeholder = "Search…", className }: TagSelectProps) {
  function toggle(optionValue: string) {
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]);
  }

  function remove(optionValue: string) {
    onChange(value.filter((v) => v !== optionValue));
  }

  const selected = options.filter((option) => value.includes(option.value));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Command>
        <CommandInput placeholder={placeholder} />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          <CommandGroup>
            {options.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <CommandItem key={option.value} value={option.label} onSelect={() => toggle(option.value)}>
                  <Icon
                    icon={isSelected ? "mdi:checkbox-marked" : "mdi:checkbox-blank-outline"}
                    className={cn("h-4 w-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")}
                    aria-hidden="true"
                  />
                  {option.icon && (
                    <Icon icon={option.icon} className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                  {option.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((option) => (
            <Badge key={option.value} onRemove={() => remove(option.value)} removeLabel={`Remove ${option.label}`}>
              {option.icon && <Icon icon={option.icon} className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              {option.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
