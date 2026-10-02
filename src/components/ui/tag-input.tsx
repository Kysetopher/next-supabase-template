"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { groupConsecutiveTags } from "@/lib/tag-groups";
import { cn } from "@/lib/utils";

type TagInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
  /** Rejects a candidate tag (e.g. zip codes: `(v) => /^\d{5}$/.test(v)`) — invalid drafts just don't commit, rather than throwing an error. */
  validate?: (candidate: string) => boolean;
  /** Runs before validate/dedupe/storage — defaults to trimming. */
  normalize?: (raw: string) => string;
};

/**
 * Generic multi-value tag entry — type into the input, then either press
 * Enter or click out (blur) to turn the current draft into a tag. Built as
 * our own primitive (input + `Badge` pills with a trash-can remove
 * button each) since neither shadcn nor Radix ships one. Pass `validate`
 * to restrict what counts as a valid tag.
 */
export function TagInput({
  value,
  onChange,
  placeholder,
  className,
  validate,
  normalize = (raw) => raw.trim(),
}: TagInputProps) {
  const [draft, setDraft] = React.useState("");

  function commit() {
    const candidate = normalize(draft);
    if (!candidate) return;
    if (validate && !validate(candidate)) return;
    if (value.includes(candidate)) {
      setDraft("");
      return;
    }
    onChange([...value, candidate]);
    setDraft("");
  }

  const isInvalid = draft.length > 0 && validate ? !validate(normalize(draft)) : false;

  return (
    <div
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md bg-secondary px-2 py-1.5",
        "has-[input:focus-visible]:ring-1 has-[input:focus-visible]:ring-ring",
        className
      )}
    >
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        placeholder={value.length === 0 ? placeholder : undefined}
        aria-invalid={isInvalid}
        className={cn(
          "min-w-24 flex-1 bg-transparent text-sm text-secondary-foreground outline-none placeholder:text-muted-foreground",
          isInvalid && "text-destructive"
        )}
      />
      {groupConsecutiveTags(value).map((group) => (
        <Badge
          key={group.tags[0]}
          onRemove={() => onChange(value.filter((v) => !group.tags.includes(v)))}
          removeLabel={`Remove ${group.label}`}
        >
          {group.label}
        </Badge>
      ))}
    </div>
  );
}
