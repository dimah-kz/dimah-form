"use client";

import type { ReactNode } from "react";
import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { cn } from "cn";
import { FormActions } from "@/components/dimah-form/form-actions";
import {
  FormScope,
  useFormSession,
} from "@/components/dimah-form/form-context";
import { FormError } from "@/components/dimah-form/form-error";
import { FormFields } from "@/components/dimah-form/form-fields";
import { FormHeader } from "@/components/dimah-form/form-header";
import { FormInactive } from "@/components/dimah-form/form-inactive";
import { FormRoot } from "@/components/dimah-form/form-root";
import { FormStatus } from "@/components/dimah-form/form-status";
import type { FormSlot } from "@/lib/form-slot";
import type { FieldWidgetRegistry } from "@/lib/widget-registry";

export type FormViewProps<TAnswers extends FormAnswers = FormAnswers> = {
  /** Headless fill session. This component does not call `useFormResponse`. */
  form: FormResponseApi<TAnswers>;
  /** Extra / override widgets keyed by field `type`. */
  widgets?: FieldWidgetRegistry;
  className?: string;
  /**
   * Custom field layout. When omitted, visible fields render through
   * {@link FormFields}.
   */
  children?: ReactNode;
  header?: FormSlot;
  status?: FormSlot;
  error?: FormSlot;
  actions?: FormSlot;
};

function FormViewLayout<TAnswers extends FormAnswers = FormAnswers>({
  className,
  children,
  header,
  status,
  error,
  actions,
}: Omit<FormViewProps<TAnswers>, "form" | "widgets">) {
  const session = useFormSession<TAnswers>();

  if (session.inactive) {
    return <FormInactive className={className} />;
  }

  return (
    <FormRoot className={cn("gap-6 flex flex-col", className)}>
      {header === false ? null : (header ?? <FormHeader />)}
      {status === false ? null : (status ?? <FormStatus />)}
      {children ?? <FormFields />}
      {error === false ? null : (error ?? <FormError />)}
      {actions === false ? null : (actions ?? <FormActions />)}
    </FormRoot>
  );
}

/**
 * Default questionnaire template: header, status, fields, error, actions.
 * Slot props take `false` to hide or a node to replace. Compose
 * {@link FormScope} + primitives for a custom layout.
 */
export function FormView<TAnswers extends FormAnswers = FormAnswers>({
  form,
  widgets,
  ...layout
}: FormViewProps<TAnswers>) {
  return (
    <FormScope form={form} widgets={widgets}>
      <FormViewLayout {...layout} />
    </FormScope>
  );
}
