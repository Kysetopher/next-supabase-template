"use client";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import * as Flags from "country-flag-icons/react/3x2";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input, type InputProps } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  PHONE_COUNTRIES,
  findPhoneCountryByDial,
  getDefaultPhoneCountry,
  type PhoneCountry,
} from "@/lib/phone-countries";
import { cn } from "@/lib/utils";

type FlagComponent = React.ComponentType<React.SVGProps<SVGSVGElement> & { title?: string }>;
const FLAGS = Flags as unknown as Record<string, FlagComponent | undefined>;

type PhoneInputProps = Omit<InputProps, "value" | "onChange" | "type" | "defaultValue"> & {
  /** E.164-like value, e.g. "+14155552671". */
  value?: string;
  onValueChange?: (next: string) => void;
  /** Country preselected while the value is empty (ISO 3166-1 alpha-2). */
  defaultCountryIso2?: string;
  /** Restrict or reorder the country list. */
  countries?: PhoneCountry[];
  /** Applied to the outer wrapper; `className` goes to the <input>. */
  wrapperClassName?: string;
};

function onlyDigits(s: string): string {
  return s.replace(/\D+/g, "");
}

function buildValue(country: PhoneCountry, nationalDigits: string): string {
  const national = onlyDigits(nationalDigits);
  // An empty field stays empty rather than becoming a bare "+<dial>"; the picked country is kept in state.
  return national ? `+${country.dial}${national}` : "";
}

/** Splits a stored value into (country, national digits), preferring the user's picked country when its dial code matches. */
function splitValue(
  countries: PhoneCountry[],
  value: string | undefined,
  picked: PhoneCountry
): { country: PhoneCountry; national: string } {
  const digits = onlyDigits(value ?? "");
  if (!digits) return { country: picked, national: "" };
  if (digits.startsWith(picked.dial)) return { country: picked, national: digits.slice(picked.dial.length) };

  const matched = findPhoneCountryByDial(digits, countries);
  if (!matched) return { country: picked, national: digits };
  return { country: matched, national: digits.slice(matched.dial.length) };
}

function Flag({ iso2 }: { iso2: string }) {
  const Component = FLAGS[iso2];
  return Component ? (
    <Component className="h-4 w-6 shrink-0 overflow-hidden rounded-[2px]" aria-hidden="true" />
  ) : (
    <span className="h-4 w-6 shrink-0 rounded-[2px] bg-muted" aria-hidden="true" />
  );
}

/**
 * Phone number field with a searchable country-code picker. Emits a single
 * "+<dial><national>" string. Typing or pasting a full international number
 * ("+44…", "0044…") switches the country automatically.
 */
export function PhoneInput({
  value,
  onValueChange,
  defaultCountryIso2,
  countries: countriesProp,
  className,
  wrapperClassName,
  disabled,
  placeholder = "Phone number",
  ...props
}: PhoneInputProps) {
  const countries = countriesProp ?? PHONE_COUNTRIES;
  const defaultCountry = useMemo(
    () => countries.find((c) => c.iso2 === defaultCountryIso2) ?? getDefaultPhoneCountry(countries),
    [countries, defaultCountryIso2]
  );

  const [pickedIso2, setPickedIso2] = useState<string>(defaultCountry.iso2);
  const [open, setOpen] = useState(false);

  const picked = countries.find((c) => c.iso2 === pickedIso2) ?? defaultCountry;
  const { country, national } = splitValue(countries, value, picked);

  const emit = (next: PhoneCountry, nationalDigits: string) => {
    setPickedIso2(next.iso2);
    onValueChange?.(buildValue(next, nationalDigits));
  };

  const handleNationalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    // Treat a "00" international prefix like "+".
    const normalized = raw.startsWith("00") ? `+${raw.slice(2)}` : raw;
    const plus = normalized.startsWith("+");
    const digits = onlyDigits(normalized);

    // Only try to detect a country code when the input is explicitly
    // international or long enough to plausibly include one — otherwise a
    // national number starting with "1" would flip the country to NANP.
    const shouldDetect = (plus && digits.length >= 7) || (!plus && digits.length >= 11);

    if (shouldDetect) {
      if (digits.startsWith(country.dial) && digits.length > country.dial.length) {
        emit(country, digits.slice(country.dial.length));
        return;
      }
      const matched = findPhoneCountryByDial(digits, countries);
      if (matched && matched.dial !== country.dial) {
        emit(matched, digits.slice(matched.dial.length));
        return;
      }
    }

    emit(country, digits);
  };

  const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
    const text = e.clipboardData.getData("text").trim();
    if (!text.startsWith("+")) return;
    const digits = onlyDigits(text);
    const matched = findPhoneCountryByDial(digits, countries);
    if (!matched) return;

    e.preventDefault();
    emit(matched, digits.slice(matched.dial.length));
  };

  return (
    <div className={cn("flex w-full max-w-[400px] items-center gap-2", wrapperClassName)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            disabled={disabled}
            className="h-9 shrink-0 gap-2 px-2"
            aria-label={`Country code: ${country.name} +${country.dial}`}
          >
            <Flag iso2={country.iso2} />
            <span className="text-sm text-secondary-foreground/80">+{country.dial}</span>
            <Icon icon="mdi:chevron-down" className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country…" />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup heading="Countries">
                {countries.map((c) => (
                  <CommandItem
                    key={c.iso2}
                    value={`${c.name} ${c.iso2} +${c.dial}`}
                    onSelect={() => {
                      setOpen(false);
                      emit(c, national);
                    }}
                  >
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Flag iso2={c.iso2} />
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm">{c.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {c.iso2} · +{c.dial}
                          </span>
                        </div>
                      </div>
                      {c.iso2 === country.iso2 ? (
                        <Icon icon="mdi:check" className="h-4 w-4" aria-hidden="true" />
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        disabled={disabled}
        placeholder={placeholder}
        value={national}
        onChange={handleNationalChange}
        onPaste={handlePaste}
        className={cn("flex-1", className)}
        {...props}
      />
    </div>
  );
}
