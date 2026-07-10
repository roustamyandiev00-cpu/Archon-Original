"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/components/ui/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  description?: string;
};

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Selecteer...",
  searchPlaceholder = "Zoeken...",
  emptyText = "Geen resultaten.",
  className,
}: {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:border-white/20",
            className,
          )}
        >
          <span className={cn("truncate", !selected && "text-zinc-500")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown size={14} className="shrink-0 text-zinc-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            className="border-zinc-200/80 dark:border-white/10"
            inputClassName="text-zinc-900 placeholder:text-zinc-500 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <CommandList>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="justify-between text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/[0.06]"
              >
                <span className="min-w-0">
                  <span className="block truncate">{option.label}</span>
                  {option.description && (
                    <span className="block truncate text-xs text-zinc-500">
                      {option.description}
                    </span>
                  )}
                </span>
                {option.value === value && (
                  <Check size={14} className="shrink-0 text-sky-500" />
                )}
              </CommandItem>
            ))}
            <CommandEmpty>{emptyText}</CommandEmpty>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
