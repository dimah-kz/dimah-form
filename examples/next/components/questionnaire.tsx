"use client";

import type { FormAnswers, FormField, FormSnapshot } from "@dimah-form/core";
import { useFormClient } from "@dimah-form/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { respondentId } from "@/lib/client";
import { formatFormError } from "@/lib/format-error";

function optionsOf(field: FormField) {
  const options = field.options;
  if (!Array.isArray(options)) return [];
  return options.flatMap((option) => {
    if (!option || typeof option !== "object" || !("value" in option))
      return [];
    const value = option.value;
    if (typeof value !== "string") return [];
    const label =
      "label" in option && typeof option.label === "string"
        ? option.label
        : value;
    return [{ value, label }];
  });
}

function selectedValues(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function FieldHint({ field }: { field: FormField }) {
  const parts: string[] = [];
  if (field.required === true) parts.push("required");
  if (typeof field.minLength === "number") parts.push(`min ${field.minLength}`);
  if (typeof field.maxLength === "number") parts.push(`max ${field.maxLength}`);
  if (typeof field.min === "number") parts.push(`min ${field.min}`);
  if (typeof field.max === "number") parts.push(`max ${field.max}`);
  if (field.integer === true) parts.push("integer");
  if (!parts.length) return null;
  return (
    <span className="text-xs text-muted-foreground">{parts.join(" · ")}</span>
  );
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const label = typeof field.label === "string" ? field.label : field.id;

  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>
          {label}
          {field.required === true ? " *" : ""}
        </span>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="grid gap-1 text-sm">
        <span>
          {label}
          {field.required === true ? " *" : ""}
        </span>
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
          value={typeof value === "string" ? value : ""}
          onChange={(event) =>
            onChange(event.target.value === "" ? null : event.target.value)
          }
        >
          <option value="">Select…</option>
          {optionsOf(field).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldHint field={field} />
      </label>
    );
  }

  if (field.type === "multiSelect") {
    const selected = selectedValues(value);
    return (
      <fieldset className="grid gap-1 text-sm">
        <legend>
          {label}
          {field.required === true ? " *" : ""}
        </legend>
        {optionsOf(field).map((option) => {
          const checked = selected.includes(option.value);
          return (
            <label key={option.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  if (event.target.checked) {
                    onChange([...selected, option.value]);
                    return;
                  }
                  onChange(selected.filter((item) => item !== option.value));
                }}
              />
              {option.label}
            </label>
          );
        })}
        <FieldHint field={field} />
      </fieldset>
    );
  }

  if (field.type === "number") {
    return (
      <label className="grid gap-1 text-sm">
        <span>
          {label}
          {field.required === true ? " *" : ""}
        </span>
        <Input
          type="number"
          value={typeof value === "number" ? value : ""}
          onChange={(event) =>
            onChange(
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
        />
        <FieldHint field={field} />
      </label>
    );
  }

  return (
    <label className="grid gap-1 text-sm">
      <span>
        {label}
        {field.required === true ? " *" : ""}
      </span>
      <Input
        type={field.type === "email" ? "email" : "text"}
        value={typeof value === "string" ? value : ""}
        onChange={(event) =>
          onChange(event.target.value === "" ? null : event.target.value)
        }
      />
      <FieldHint field={field} />
    </label>
  );
}

export function Questionnaire({
  form,
  responseId,
  initialAnswers = {},
  initialStatus = "draft",
  initialUpdatedAt,
}: {
  form: FormSnapshot;
  responseId?: string;
  initialAnswers?: FormAnswers;
  initialStatus?: string;
  initialUpdatedAt?: string;
}) {
  const client = useFormClient();
  const router = useRouter();
  const [id, setId] = useState(responseId);
  const [answers, setAnswers] = useState<FormAnswers>(initialAnswers);
  const [updatedAt, setUpdatedAt] = useState<string | undefined>(
    initialUpdatedAt,
  );
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState(initialStatus);

  const title = useMemo(() => form.title, [form.title]);
  const canStart = form.status === "active";

  async function ensureResponse() {
    if (id) return id;
    const started = await client.startResponse({
      formId: form.id,
      respondentId: respondentId(),
    });
    setId(started.id);
    setUpdatedAt(started.updatedAt);
    router.replace(`/r/${started.id}`);
    return started.id;
  }

  async function onSave() {
    setError(undefined);
    try {
      const responseId = await ensureResponse();
      const saved = await client.saveDraft({
        responseId,
        answers,
        updatedAt,
      });
      setUpdatedAt(saved.updatedAt);
      setStatus(saved.status);
    } catch (caught) {
      setError(formatFormError(caught, "Could not save draft"));
    }
  }

  async function onSubmit() {
    setError(undefined);
    try {
      const responseId = await ensureResponse();
      const saved = await client.saveDraft({
        responseId,
        answers,
        updatedAt,
      });
      const submitted = await client.submitResponse({
        responseId,
        updatedAt: saved.updatedAt,
      });
      setStatus(submitted.status);
      setUpdatedAt(submitted.updatedAt);
    } catch (caught) {
      setError(formatFormError(caught, "Could not submit"));
    }
  }

  async function onAbandon() {
    if (!id) return;
    setError(undefined);
    try {
      const abandoned = await client.abandonResponse({
        responseId: id,
        updatedAt,
      });
      setStatus(abandoned.status);
    } catch (caught) {
      setError(formatFormError(caught, "Could not abandon"));
    }
  }

  if (status === "submitted") {
    return (
      <p className="text-sm">
        Submitted. Response <span className="font-mono">{id}</span>
      </p>
    );
  }

  if (status === "abandoned") {
    return <p className="text-sm">This draft was abandoned.</p>;
  }

  if (!id && !canStart) {
    return (
      <div className="grid max-w-md gap-2 text-sm">
        <h1 className="font-medium">{title}</h1>
        <p className="text-muted-foreground">
          {form.slug} · {form.status}. New responses can only start on{" "}
          <code>active</code> forms.
        </p>
      </div>
    );
  }

  return (
    <div className="grid max-w-md gap-4">
      <div>
        <p className="text-xs text-muted-foreground">
          {form.slug} · {form.status}
        </p>
        <h1 className="font-medium">{title}</h1>
      </div>
      {form.fields.map((field) => (
        <FieldControl
          key={field.id}
          field={field}
          value={answers[field.id]}
          onChange={(value) =>
            setAnswers((current) => ({ ...current, [field.id]: value }))
          }
        />
      ))}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onSave}>
          Save draft
        </Button>
        <Button type="button" onClick={onSubmit}>
          Submit stored draft
        </Button>
        {id ? (
          <Button type="button" variant="outline" onClick={onAbandon}>
            Abandon
          </Button>
        ) : null}
      </div>
    </div>
  );
}
