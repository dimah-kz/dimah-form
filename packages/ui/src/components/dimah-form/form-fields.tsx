"use client";

import { Fragment, type ReactNode } from "react";
import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { cn } from "cn";
import { FieldGroup } from "@/components/ui/field";
import {
  FieldWidgetsProvider,
  useFormSession,
} from "@/components/dimah-form/form-context";
import { FormField } from "@/components/dimah-form/form-field";
import type { FieldWidgetRegistry } from "@/lib/widget-registry";

export type FormFieldsProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  widgets?: FieldWidgetRegistry;
  className?: string;
  /** Replace the default {@link FormField} for one binding. */
  renderField?: (
    binding: ReturnType<FormResponseApi<TAnswers>["field"]>,
  ) => ReactNode;
};

/**
 * Visible fields as a shadcn `FieldGroup`. Pass `renderField` to keep the
 * loop and swap chrome per field.
 */
export function FormFields<TAnswers extends FormAnswers = FormAnswers>({
  form,
  widgets,
  className,
  renderField,
}: FormFieldsProps<TAnswers>) {
  const session = useFormSession(form);

  const fields = (
    <FieldGroup className={cn(className)}>
      {session.visibleFields.map((field) => {
        const binding = session.field(field.id);
        if (renderField) {
          return <Fragment key={field.id}>{renderField(binding)}</Fragment>;
        }
        return <FormField key={field.id} binding={binding} />;
      })}
    </FieldGroup>
  );

  if (!widgets) return fields;
  return (
    <FieldWidgetsProvider widgets={widgets}>{fields}</FieldWidgetsProvider>
  );
}
