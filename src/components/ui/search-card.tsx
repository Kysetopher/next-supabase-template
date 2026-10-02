"use client";

import { ScrollableCard, type ScrollableCardProps } from "@/components/ui/scrollable-card";
import { SearchBar } from "@/components/ui/search-bar";

export type SearchCardProps = Omit<ScrollableCardProps, "headerActions"> & {
  searchValue: string;
  onSearchChange: React.ChangeEventHandler<HTMLInputElement>;
  searchPlaceholder?: string;
  /** Accessible label for the search input (defaults to the placeholder, then "Search"). */
  searchLabel?: string;
};

/** A `ScrollableCard` with a search input in its header — for filterable lists. */
export function SearchCard({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchLabel,
  ...props
}: SearchCardProps) {
  return (
    <ScrollableCard
      {...props}
      headerActions={
        <SearchBar
          containerClassName="w-1/2"
          placeholder={searchPlaceholder}
          aria-label={searchLabel ?? searchPlaceholder ?? "Search"}
          value={searchValue}
          onChange={onSearchChange}
        />
      }
    />
  );
}
