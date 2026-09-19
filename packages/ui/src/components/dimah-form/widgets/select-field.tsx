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
import { Field, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormFieldFrame } from "@/components/dimah-form/form-field-frame";
import { fieldControlProps, fieldWidget } from "@/lib/field-attr";
import type { FieldWidgetProps } from "@/lib/widget-registry";

function RadioSelectField({ binding, className }: FieldWidgetProps) {
  const field = binding.field;
  if (!field) return null;

  const options = fieldOptions(field);
  const control = fieldControlProps(binding);

  return (
    <FormFieldFrame binding={binding} className={className} layout="group">
      <RadioGroup
        id={control.id}
        name={control.name}
        disabled={control.disabled}
        aria-invalid={control["aria-invalid"]}
        aria-required={control["aria-required"]}
        aria-describedby={control["aria-describedby"]}
        value={typeof binding.value === "string" ? binding.value : null}
        onValueChange={(value) => {
          binding.onChange(typeof value === "string" ? value : null);
        }}
      >
        {options.map((option) => {
          const id = `${field.id}-${option.value}`;
          return (
            <Field
              key={option.value}
              orientation="horizontal"
              data-disabled={binding.disabled || undefined}
            >
              <RadioGroupItem
                id={id}
                value={option.value}
                disabled={binding.disabled}
              />
              <FieldLabel htmlFor={id} className="font-normal">
                {option.label}
              </FieldLabel>
            </Field>
          );
        })}
      </RadioGroup>
    </FormFieldFrame>
  );
}

function DropdownSelectField({ binding, className }: FieldWidgetProps) {
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
          aria-describedby={control["aria-describedby"]}
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

export function SelectField(props: FieldWidgetProps) {
  if (fieldWidget(props.binding.field) === "radio") {
    return <RadioSelectField {...props} />;
  }
  return <DropdownSelectField {...props} />;
}
