"use client";

import type { ReactNode } from "react";
import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { cn } from "cn";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { FormField } from "@/components/dimah-form/form-field";
import { useFormUi } from "@/hooks/use-form-ui";
import type { FieldWidgetRegistry } from "@/lib/widget-registry";

export type FormViewProps<TAnswers extends FormAnswers = FormAnswers> = {
  /** Headless fill session. This component does not call `useFormResponse`. */
  form: FormResponseApi<TAnswers>;
  /** Extra / override widgets keyed by field `type` (same strings as `defineFieldType`). */
  widgets?: FieldWidgetRegistry;
  className?: string;
  /**
   * Custom field layout. When omitted, visible fields render through
   * {@link FormField} + {@link widgets}.
   */
  children?: ReactNode;
};

/**
 * Questionnaire chrome around a `useFormResponse` return: title, fields,
 * session error, save, submit.
 */
export function FormView<TAnswers extends FormAnswers = FormAnswers>({
  form,
  widgets,
  className,
  children,
}: FormViewProps<TAnswers>) {
  const ui = useFormUi(form);
  const fields =
    children ??
    form.visibleFields.map((field) => (
      <FormField
        key={field.id}
        binding={form.field(field.id)}
        widgets={widgets}
      />
    ));

  if (form.inactive) {
    return (
      <Alert className={className}>
        <AlertTitle>{ui.inactiveTitle}</AlertTitle>
        <AlertDescription>{ui.inactiveMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form
      className={cn(
        "gap-6 flex flex-col text-start text-dimah-form-foreground",
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault();
        void form.submit();
      }}
    >
      <header className="gap-1 flex flex-col">
        <h2 className="text-lg font-semibold text-balance">
          {form.snapshot.title}
        </h2>
        {form.snapshot.description ? (
          <p className="text-sm text-pretty text-dimah-form-muted-foreground">
            {form.snapshot.description}
          </p>
        ) : null}
      </header>

      <FieldGroup>{fields}</FieldGroup>

      {form.error ? (
        <Alert variant="destructive">
          <AlertDescription className="wrap-anywhere">
            {form.error}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="gap-2 flex flex-wrap items-center justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={ui.busy || form.locked}
          onClick={() => void form.saveDraft()}
        >
          {form.pending === "save" ? (
            <Spinner data-icon="inline-start" />
          ) : null}
          {ui.saveLabel}
        </Button>
        <Button type="submit" disabled={ui.busy || form.locked}>
          {form.pending === "submit" ? (
            <Spinner data-icon="inline-start" />
          ) : null}
          {ui.submitLabel}
        </Button>
      </div>
    </form>
  );
}
