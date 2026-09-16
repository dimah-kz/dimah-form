"use client";

import type { FormAnswers, FormField } from "@dimah-form/core";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fieldLabel, fieldOptions } from "@/lib/field-display";

function FieldHint({ field }: { field: FormField }) {
  const parts: string[] = [];
  if (field.required === true) parts.push("required");
  if (typeof field.minLength === "number") parts.push(`min ${field.minLength}`);
  if (typeof field.maxLength === "number") parts.push(`max ${field.maxLength}`);
  if (typeof field.min === "number") parts.push(`min ${field.min}`);
  if (typeof field.max === "number") parts.push(`max ${field.max}`);
  if (field.integer === true) parts.push("integer");
  if (!parts.length) return null;
  return <FieldDescription>{parts.join(" · ")}</FieldDescription>;
}

function FormFieldControl({
  field,
  value,
  issue,
  disabled,
  onChange,
}: {
  field: FormField;
  value: unknown;
  issue?: string;
  disabled?: boolean;
  onChange: (value: unknown) => void;
}) {
  const label = fieldLabel(field);
  const invalid = Boolean(issue);
  const errors = issue ? [{ message: issue }] : undefined;

  if (field.type === "boolean") {
    return (
      <Field
        orientation="horizontal"
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
      >
        <Checkbox
          id={field.id}
          checked={value === true}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onCheckedChange={(checked) => onChange(checked ? true : null)}
        />
        <FieldLabel htmlFor={field.id} className="font-normal">
          {label}
        </FieldLabel>
        <FieldError errors={errors} />
      </Field>
    );
  }

  if (field.type === "select") {
    const options = fieldOptions(field);
    const items = [
      { label: "Select…", value: null },
      ...options.map((option) => ({
        label: option.label,
        value: option.value,
      })),
    ];

    return (
      <Field
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
      >
        <FieldLabel htmlFor={field.id}>
          {label}
          {field.required === true ? " *" : ""}
        </FieldLabel>
        <Select
          id={field.id}
          items={items}
          value={typeof value === "string" ? value : null}
          disabled={disabled}
          onValueChange={(next) => onChange(next)}
        >
          <SelectTrigger className="w-full" aria-invalid={invalid || undefined}>
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
        <FieldHint field={field} />
        <FieldError errors={errors} />
      </Field>
    );
  }

  if (field.type === "multiSelect") {
    const selected = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];

    return (
      <FieldSet>
        <FieldLegend variant="label">
          {label}
          {field.required === true ? " *" : ""}
        </FieldLegend>
        <FieldGroup>
          {fieldOptions(field).map((option) => {
            const id = `${field.id}-${option.value}`;
            const checked = selected.includes(option.value);
            return (
              <Field
                key={option.value}
                orientation="horizontal"
                data-disabled={disabled || undefined}
              >
                <Checkbox
                  id={id}
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(next) => {
                    if (next) {
                      onChange([...selected, option.value]);
                      return;
                    }
                    onChange(selected.filter((item) => item !== option.value));
                  }}
                />
                <FieldLabel htmlFor={id} className="font-normal">
                  {option.label}
                </FieldLabel>
              </Field>
            );
          })}
        </FieldGroup>
        <FieldHint field={field} />
        <FieldError errors={errors} />
      </FieldSet>
    );
  }

  if (field.type === "number") {
    return (
      <Field
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
      >
        <FieldLabel htmlFor={field.id}>
          {label}
          {field.required === true ? " *" : ""}
        </FieldLabel>
        <Input
          id={field.id}
          type="number"
          disabled={disabled}
          aria-invalid={invalid || undefined}
          value={typeof value === "number" ? value : ""}
          onChange={(event) =>
            onChange(
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
        />
        <FieldHint field={field} />
        <FieldError errors={errors} />
      </Field>
    );
  }

  if (field.type === "text") {
    return (
      <Field
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
      >
        <FieldLabel htmlFor={field.id}>
          {label}
          {field.required === true ? " *" : ""}
        </FieldLabel>
        <Input
          id={field.id}
          type="text"
          disabled={disabled}
          aria-invalid={invalid || undefined}
          value={typeof value === "string" ? value : ""}
          onChange={(event) =>
            onChange(event.target.value === "" ? null : event.target.value)
          }
        />
        <FieldHint field={field} />
        <FieldError errors={errors} />
      </Field>
    );
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <FieldDescription>Unsupported type: {field.type}</FieldDescription>
    </Field>
  );
}

export function FormFields({
  fields,
  answers,
  issues,
  disabled,
  onChange,
}: {
  fields: readonly FormField[];
  answers: FormAnswers;
  issues?: Record<string, string>;
  disabled?: boolean;
  onChange: (id: string, value: unknown) => void;
}) {
  return (
    <FieldGroup>
      {fields.map((field) => (
        <FormFieldControl
          key={field.id}
          field={field}
          value={answers[field.id]}
          issue={issues?.[field.id]}
          disabled={disabled}
          onChange={(value) => onChange(field.id, value)}
        />
      ))}
    </FieldGroup>
  );
}
