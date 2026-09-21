"use client";

import {
  fieldLabel,
  stripHiddenAnswers,
  visibleFields,
  type FormAnswers,
  type FormSnapshot,
  type ResponseStatus,
} from "@dimah-form/react";

import { StatusBadge } from "@/components/status-badge";
import { formatAnswer } from "@/lib/field-display";
import { cn } from "@/lib/utils";

export function AnswersPreview({
  form,
  answers,
  status,
  className,
}: {
  form: FormSnapshot;
  answers: FormAnswers;
  status?: ResponseStatus | string;
  className?: string;
}) {
  const payload = stripHiddenAnswers(form, answers);
  const fields = visibleFields(form, answers);

  return (
    <aside className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Answers</p>
          <p className="text-sm text-muted-foreground">
            Hidden fields are stripped before save and submit.
          </p>
        </div>
        {status ? <StatusBadge status={status} /> : null}
      </div>
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing answered yet.</p>
      ) : (
        <dl className="flex flex-col gap-3">
          {fields.map((field) => (
            <div key={field.id} className="flex flex-col gap-0.5">
              <dt className="text-sm text-muted-foreground">
                {fieldLabel(field)}
              </dt>
              <dd className="text-sm wrap-anywhere">
                {formatAnswer(field, payload[field.id])}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <details className="group">
        <summary className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground">
          Payload
        </summary>
        <pre className="mt-3 overflow-x-auto font-mono text-xs text-muted-foreground">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </details>
    </aside>
  );
}
