"use client";

import { useTranslations } from "@fuma-translate/react";
import { fieldOptions } from "@dimah-form/react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFieldFrame } from "@/components/dimah-form/form-field-frame";
import { fieldControlProps } from "@/lib/field-attr";
import type { FieldWidgetProps } from "@/lib/widget-registry";

export function SelectField({ binding, className }: FieldWidgetProps) {
  const t = useTranslations();
  const field = binding.field;
  if (!field) return null;

  const placeholder = t("Select…", { note: "select placeholder" });
  const options = fieldOptions(field);
  const items = [
    ...(binding.required
      ? []
      : [{ label: placeholder, value: null as string | null }]),
    ...options.map((option) => ({
      label: option.label,
      value: option.value,
    })),
  ];
  const { id, disabled, ...control } = fieldControlProps(binding);

  return (
    <FormFieldFrame binding={binding} className={className}>
      <Select
        items={items}
        value={typeof binding.value === "string" ? binding.value : null}
        disabled={disabled}
        onValueChange={(value) => {
          binding.onChange(typeof value === "string" ? value : null);
        }}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={control["aria-invalid"]}
          aria-required={control["aria-required"]}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} side="bottom">
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={String(item.value)} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </FormFieldFrame>
  );
}
