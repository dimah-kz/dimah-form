"use client";

import { fieldOptions } from "@dimah-form/react";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldGroup } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChoiceOption } from "@/components/dimah-form/choice-option";
import { FormFieldFrame } from "@/components/dimah-form/form-field-frame";
import { fieldControlProps, fieldWidget } from "@/lib/field-attr";
import { readOptionUiMeta } from "@/lib/field-ui-meta";
import type { FieldWidgetProps } from "@/lib/widget-registry";

function selectedValues(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function ChipSelectField({ binding, className }: FieldWidgetProps) {
  const field = binding.field;
  if (!field) return null;

  const selected = selectedValues(binding.value);
  const control = fieldControlProps(binding);

  return (
    <FormFieldFrame binding={binding} className={className} layout="group">
      <ToggleGroup
        multiple
        variant="outline"
        spacing={2}
        className="w-full flex-wrap"
        disabled={binding.disabled}
        value={selected}
        aria-invalid={control["aria-invalid"]}
        aria-required={control["aria-required"]}
        aria-describedby={control["aria-describedby"]}
        onValueChange={(next) => {
          binding.onChange(next.length > 0 ? next : null);
        }}
      >
        {fieldOptions(field).map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            disabled={binding.disabled}
            title={readOptionUiMeta(option).description}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </FormFieldFrame>
  );
}

export function MultiSelectField({ binding, className }: FieldWidgetProps) {
  if (fieldWidget(binding.field) === "chips") {
    return <ChipSelectField binding={binding} className={className} />;
  }

  const field = binding.field;
  if (!field) return null;

  const selected = selectedValues(binding.value);

  return (
    <FormFieldFrame binding={binding} className={className} layout="group">
      <FieldGroup>
        {fieldOptions(field).map((option) => {
          const id = `${field.id}-${option.value}`;
          return (
            <ChoiceOption
              key={option.value}
              id={id}
              label={option.label}
              description={readOptionUiMeta(option).description}
              disabled={binding.disabled}
              control={
                <Checkbox
                  id={id}
                  disabled={binding.disabled}
                  checked={selected.includes(option.value)}
                  onCheckedChange={(checked) =>
                    binding.onChange(
                      checked
                        ? [...selected, option.value]
                        : selected.filter((item) => item !== option.value),
                    )
                  }
                />
              }
            />
          );
        })}
      </FieldGroup>
    </FormFieldFrame>
  );
}
