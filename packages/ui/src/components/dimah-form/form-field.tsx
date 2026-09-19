"use client";

import { createElement, type ReactNode } from "react";
import type { FormFieldBinding } from "@dimah-form/react";
import {
  useFieldWidgets,
  useFormFillMode,
} from "@/components/dimah-form/form-context";
import { UnknownField } from "@/components/dimah-form/widgets/unknown-field";
import {
  resolveFieldWidget,
  type FieldWidgetRegistry,
} from "@/lib/widget-registry";

export type FormFieldProps<TValue = unknown> = {
  binding: FormFieldBinding<TValue>;
  /** Merged on top of provider / built-in widgets for this field only. */
  widgets?: FieldWidgetRegistry;
  /** Replace the registered widget (including its chrome). */
  children?: ReactNode;
  className?: string;
};

/**
 * Dispatches one `form.field(id)` binding to the widget for `field.type`.
 * Hidden / unknown documents render nothing. Chrome lives on the widget
 * ({@link FormFieldFrame} for the default anatomy).
 */
export function FormField<TValue = unknown>({
  binding,
  widgets: widgetsOverride,
  children,
  className,
}: FormFieldProps<TValue>) {
  const widgets = useFieldWidgets(widgetsOverride);
  const mode = useFormFillMode();
  const field = binding.field;
  if (!binding.visible || !field) return null;
  if (children) return children;

  return createElement(
    resolveFieldWidget(field.type, widgets) ?? UnknownField,
    { binding, className, mode },
  );
}
