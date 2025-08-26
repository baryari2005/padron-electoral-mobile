// components/FormsCreate/FormCombo.tsx
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

type Option = Record<string, any>;

type Props<T extends Option> = {
  id?: string;
  labelId?: string;
  value: string;
  onChange: (v: string) => void;
  options: T[];
  getOptionLabel: (o: T) => string;
  getOptionValue: (o: T) => string;
  placeholder?: string;
  disabled?: boolean;
  onOptionSelected?: (opt: T) => void;
  className?: string;                // 👈 opcional para el trigger
};

export function FormCombo<T extends Option>({
  id, labelId, value, onChange, options,
  getOptionLabel, getOptionValue, placeholder = "Seleccionar…",
  disabled, onOptionSelected, className,
}: Props<T>) {
  const [open, setOpen] = React.useState(false);
  const selected = React.useMemo(
    () => options.find(o => getOptionValue(o) === value),
    [options, value, getOptionValue]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          aria-labelledby={labelId}
          type="button"
          disabled={disabled}
          className={cn(
            "w-full inline-flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm",
            "bg-white hover:bg-neutral-50 disabled:opacity-50",
            className                           // 👈 p.ej. "h-11 rounded-xl"
          )}
        >
          <span className="truncate">
            {selected ? getOptionLabel(selected) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>

      {/* Ancho EXACTO del trigger */}
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="
          z-[9999] p-0
          w-[var(--radix-popover-trigger-width)]   /* 👈 esta es la clave */
          bg-white border border-neutral-200 shadow-xl rounded-md
          overflow-x-hidden                        /* evita scroll horizontal */
          dark:bg-neutral-900 dark:border-neutral-700
        "
      >
        <Command className="bg-white dark:bg-neutral-900">
          <div className="sticky top-0 z-10 bg-white  p-2">
            <CommandInput placeholder="Buscar…" />
          </div>

          <CommandEmpty className="px-3 py-2 text-sm">Sin resultados</CommandEmpty>

          <CommandGroup className="max-h-80 overflow-auto">
            {options.map((opt) => {
              const val = getOptionValue(opt);
              const label = getOptionLabel(opt);
              const active = val === value;
              return (
                <CommandItem
                  key={val}
                  value={label}
                  onSelect={() => { onChange(val); onOptionSelected?.(opt); setOpen(false); }}
                  className={cn(
                    "flex items-center gap-2 min-h-11 cursor-pointer",
                    "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  )}
                >
                  <Check className={cn("h-4 w-4", active ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
