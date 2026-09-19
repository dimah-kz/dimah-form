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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChoiceOption } from "@/components/dimah-form/choice-option";
import { FieldReviewValue } from "@/components/dimah-form/field-review-value";
import { FormFieldFrame } from "@/components/dimah-form/form-field-frame";
import { fieldControlProps, fieldWidget } from "@/lib/field-attr";
import { readFieldUiMeta, readOptionUiMeta } from "@/lib/field-ui-meta";
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
            <ChoiceOption
              key={option.value}
              id={id}
              label={option.label}
              description={readOptionUiMeta(option).description}
              disabled={binding.disabled}
              control={
                <RadioGroupItem
                  id={id}
                  value={option.value}
                  disabled={binding.disabled}
                />
              }
            />
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

  const ui = readFieldUiMeta(field);
  const placeholder =
    ui.placeholder ?? t("Select…", { note: "select placeholder" });
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
  if (props.mode === "review") {
    return <FieldReviewValue {...props} />;
  }
  if (fieldWidget(props.binding.field) === "radio") {
    return <RadioSelectField {...props} />;
  }
  return <DropdownSelectField {...props} />;
}
