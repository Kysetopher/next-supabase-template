"use client";

import { Select, SelectItem } from "@/components/ui/select";

type YearPickerProps = {
  value: number | undefined;
  onChange: (year: number | undefined) => void;
  minYear?: number;
  /** Defaults to the current year, computed per render rather than once at module load, so a long-lived process doesn't drift into a stale ceiling. */
  maxYear?: number;
  placeholder?: string;
  className?: string;
};

/** A single-value bounded list (1900..current year) is exactly what a year is — reuses Select rather than a bespoke grid-popover control. */
export function YearPicker({
  value,
  onChange,
  minYear = 1900,
  maxYear = new Date().getFullYear(),
  placeholder = "Any year",
  className,
}: YearPickerProps) {
  const years: number[] = [];
  for (let year = maxYear; year >= minYear; year--) years.push(year);

  return (
    <Select
      value={value ? String(value) : ""}
      onValueChange={(v) => onChange(v ? Number(v) : undefined)}
      placeholder={placeholder}
      className={className}
    >
      {years.map((year) => (
        <SelectItem key={year} value={String(year)}>
          {year}
        </SelectItem>
      ))}
    </Select>
  );
}
