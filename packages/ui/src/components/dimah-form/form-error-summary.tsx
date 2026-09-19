"use client";

import {
  fieldLabel,
  type FormAnswers,
  type FormFieldBinding,
  type FormResponseApi,
} from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";
import { CircleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFormSession } from "@/components/dimah-form/form-context";
import { useFieldIssue } from "@/hooks/use-field-issue";
import { scheduleFocusInvalidField } from "@/lib/focus-invalid";

export type FormErrorSummaryProps<TAnswers extends FormAnswers = FormAnswers> =
  {
    form?: FormResponseApi<TAnswers>;
    className?: string;
  };

function IssueLink({
  binding,
}: {
  binding: Pick<
    FormFieldBinding,
    "id" | "field" | "error" | "errorCode" | "errorParams"
  >;
}) {
  const issue = useFieldIssue(binding);
  const field = binding.field;
  if (!field || !issue) return null;

  return (
    <li>
      <a
        href={`#${field.id}`}
        className="underline underline-offset-4"
        onClick={(event) => {
          event.preventDefault();
          const root = event.currentTarget.closest("form") ?? document;
          scheduleFocusInvalidField(root);
          document.getElementById(field.id)?.focus();
        }}
      >
        {fieldLabel(field)}
        <span className="text-dimah-form-muted-foreground"> — {issue}</span>
      </a>
    </li>
  );
}

/** Links to invalid visible fields. Hidden when every visible field is clean. */
export function FormErrorSummary<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
}: FormErrorSummaryProps<TAnswers>) {
  const session = useFormSession(form);
  const t = useTranslations();
  const invalid = session.visibleFields
    .map((field) => session.field(field.id))
    .filter((binding) => binding.invalid);

  if (invalid.length === 0) return null;

  const title = t("{count} need attention", {
    note: "error summary",
    variables: { count: String(invalid.length) },
  });

  return (
    <Alert variant="destructive" className={className} aria-live="assertive">
      <CircleAlertIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="gap-1 ps-4 flex list-disc flex-col">
          {invalid.map((binding) => (
            <IssueLink key={binding.id} binding={binding} />
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
