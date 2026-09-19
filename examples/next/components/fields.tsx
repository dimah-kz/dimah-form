"use client";

import {
  type FormField,
  type FormFieldBinding,
  type FormResponseApi,
  emptyToNull,
  fieldLabel,
  fieldOptions,
} from "@dimah-form/react";
import type { ReactNode } from "react";

import { StarRating } from "@/components/star-rating";
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
import { Textarea } from "@/components/ui/textarea";
import { ratingMax } from "@/lib/field-display";

function LabeledField({
  field,
  error,
  disabled,
  children,
}: {
  field: FormField;
  error?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const invalid = Boolean(error);
  return (
    <Field
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      <FieldLabel htmlFor={field.id}>
        {fieldLabel(field)}
        {field.required === true ? " *" : ""}
      </FieldLabel>
      {children}
      {typeof field.description === "string" ? (
        <FieldDescription>{field.description}</FieldDescription>
      ) : null}
      <FieldError errors={error ? [{ message: error }] : undefined} />
    </Field>
  );
}

function FormFieldControl({
  field,
  value,
  error,
  disabled,
  onChange,
}: FormFieldBinding) {
  if (!field) return null;
  const invalid = Boolean(error);
  const errors = error ? [{ message: error }] : undefined;

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
          {fieldLabel(field)}
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
      <LabeledField field={field} error={error} disabled={disabled}>
        <Select
          id={field.id}
          items={items}
          value={typeof value === "string" ? value : null}
          disabled={disabled}
          onValueChange={onChange}
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
      </LabeledField>
    );
  }

  if (field.type === "multiSelect") {
    const selected = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];

    return (
      <FieldSet>
        <FieldLegend variant="label">
          {fieldLabel(field)}
          {field.required === true ? " *" : ""}
        </FieldLegend>
        <FieldGroup>
          {fieldOptions(field).map((option) => {
            const id = `${field.id}-${option.value}`;
            return (
              <Field
                key={option.value}
                orientation="horizontal"
                data-disabled={disabled || undefined}
              >
                <Checkbox
                  id={id}
                  checked={selected.includes(option.value)}
                  disabled={disabled}
                  onCheckedChange={(next) =>
                    onChange(
                      next
                        ? [...selected, option.value]
                        : selected.filter((item) => item !== option.value),
                    )
                  }
                />
                <FieldLabel htmlFor={id} className="font-normal">
                  {option.label}
                </FieldLabel>
              </Field>
            );
          })}
        </FieldGroup>
        {typeof field.description === "string" ? (
          <FieldDescription>{field.description}</FieldDescription>
        ) : null}
        <FieldError errors={errors} />
      </FieldSet>
    );
  }

  if (field.type === "rating") {
    return (
      <Field
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
      >
        <FieldSet>
          <FieldLegend id={`${field.id}-label`} variant="label">
            {fieldLabel(field)}
            {field.required === true ? " *" : ""}
          </FieldLegend>
          <StarRating
            id={field.id}
            value={value}
            max={ratingMax(field)}
            disabled={disabled}
            invalid={invalid}
            required={field.required === true}
            onChange={onChange}
          />
        </FieldSet>
        {typeof field.description === "string" ? (
          <FieldDescription>{field.description}</FieldDescription>
        ) : null}
        <FieldError errors={errors} />
      </Field>
    );
  }

  if (field.type === "number") {
    return (
      <LabeledField field={field} error={error} disabled={disabled}>
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
      </LabeledField>
    );
  }

  if (field.type === "text" && field.meta?.multiline === true) {
    return (
      <LabeledField field={field} error={error} disabled={disabled}>
        <Textarea
          id={field.id}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(emptyToNull(event.target.value))}
        />
      </LabeledField>
    );
  }

  if (
    field.type === "text" ||
    field.type === "email" ||
    field.type === "date"
  ) {
    return (
      <LabeledField field={field} error={error} disabled={disabled}>
        <Input
          id={field.id}
          type={field.type === "text" ? "text" : field.type}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(emptyToNull(event.target.value))}
        />
      </LabeledField>
    );
  }

  return (
    <Field>
      <FieldLabel>{fieldLabel(field)}</FieldLabel>
      <FieldDescription>Unsupported type: {field.type}</FieldDescription>
    </Field>
  );
}

/** Renders consumer widgets from a headless `useFormResponse` result. */
export function FormFields({ form }: { form: FormResponseApi }) {
  return (
    <FieldGroup>
      {form.visibleFields.map((field) => (
        <FormFieldControl key={field.id} {...form.field(field.id)} />
      ))}
    </FieldGroup>
  );
}
