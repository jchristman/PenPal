import { registerComponent } from "../../penpal/client";
import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "./utils";

export interface ComboboxOption {
  value: string;
  label: string;
  id?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string | null;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  notFoundText?: string;
  disabled?: boolean;
  className?: string;
  popoverContentClassName?: string;
  isLoading?: boolean;
  loadingText?: string;
  listMaxHeight?: string; // e.g., "max-h-[300px]"
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  notFoundText = "No option found.",
  disabled = false,
  className,
  popoverContentClassName,
  isLoading = false,
  loadingText = "Loading...",
  listMaxHeight = "max-h-[300px]",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = React.useMemo(() => {
    return options.find((option) => option.value === value);
  }, [options, value]);

  const uniqueId = React.useId();

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild disabled={disabled || isLoading}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={`combobox-list-${uniqueId}`}
          className={cn("w-full justify-between font-normal", className)} // Ensure normal font weight
          id={`combobox-trigger-${uniqueId}`}
        >
          <span className="truncate">
            {" "}
            {/* Ensure text truncates nicely */}
            {isLoading
              ? loadingText
              : value && selectedOption
              ? selectedOption.label
              : placeholder}
          </span>
          {isLoading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("p-0", popoverContentClassName)}
        style={{ width: "var(--radix-popover-trigger-width)" }}
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing for smoother UX
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList
            id={`combobox-list-${uniqueId}`}
            className={listMaxHeight}
          >
            {isLoading && (
              <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingText}
              </div>
            )}
            {!isLoading && options.length === 0 && (
              <CommandEmpty>{notFoundText}</CommandEmpty>
            )}
            {/* This is needed because CommandEmpty only shows if there are NO items, 
                but CommandInput filters them, so if all are filtered out, nothing shows. 
                This ensures a message is shown if the filter results in no items. */}
            {!isLoading && options.length > 0 && (
              <CommandEmpty>{notFoundText}</CommandEmpty>
            )}
            {!isLoading && (
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id ?? option.value}
                    value={option.label}
                    onSelect={() => {
                      onValueChange(
                        option.value === value ? undefined : option.value
                      );
                      setOpen(false);
                    }}
                    className="w-full cursor-pointer justify-start text-left"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

registerComponent("Combobox", Combobox);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Combobox;
