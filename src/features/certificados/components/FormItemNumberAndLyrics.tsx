"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  UseFormReturn,
  useWatch,
} from "react-hook-form";
import { useEffect, useState } from "react";
import { numberToWordsEs } from "../utils";


type Props<T extends FieldValues> = {
  control: UseFormReturn<T>["control"];
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
  showErrorCondition?: (name: FieldPath<T>, value: number | undefined) => boolean;
  errorMessage?: React.ReactNode;
};

export function FormItemNumberAndLyrics<T extends FieldValues>({
  control,
  name,
  label,
  disabled = false,
  showErrorCondition,
  errorMessage = "⚠ Valor inválido o inconsistente",
}: Props<T>) {
  const value = useWatch({ control, name }) as number | undefined;
  const [enLetras, setEnLetras] = useState("");

  useEffect(() => {
    const convertValue = Number(value);

    if (!isNaN(convertValue)) {
      setEnLetras(numberToWordsEs(convertValue).toUpperCase());
    } else {
      setEnLetras("");
    }
  }, [value]);

  const shouldShowError = showErrorCondition?.(name, value) ?? false;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }: { field: ControllerRenderProps<T, FieldPath<T>> }) => (
        <FormItem>
          <FormLabel className="block text-xs text-left mt-1 uppercase">{label}</FormLabel>
          <div className="flex gap-2">
            <FormControl>
              <Input
                type="number"
                className={`w-24 ${shouldShowError ? "border-red-500 ring-red-500 bg-red-50" : ""}`}
                {...field}
                onChange={(e) => {
                  const parsed = Number(e.target.value);
                  field.onChange(isNaN(parsed) ? 0 : parsed);
                }}
                onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                disabled={disabled}
              />
            </FormControl>
            <div
              className={`flex-1 bg-muted px-3 py-2 rounded-md text-[11px] text-muted-foreground border 
                          ${shouldShowError ? "border-red-500 ring-red-500 bg-red-50" : "border-input"}`}
            >
              {enLetras}
            </div>
          </div>
          <FormMessage />
          {shouldShowError && (
            <div className="text-xs text-red-500 mt-1">{errorMessage}</div>
          )}
        </FormItem>
      )}
    />
  );
}
