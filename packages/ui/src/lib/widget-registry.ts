import type { ComponentType } from "react";
import type { FormFieldBinding } from "@dimah-form/react";
import { UnknownField } from "@/components/dimah-form/widgets/unknown-field";

export type FieldWidgetProps<TValue = unknown> = FormFieldBinding<TValue>;

export type FieldWidget<TValue = unknown> = ComponentType<
  FieldWidgetProps<TValue>
>;

/** Mixed answer types — a typed `form.field(id)` must be passable. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
type AnyFieldWidget = FieldWidget<any>;

/** Field `type` string → widget. Same keys as `defineFieldType`. */
export type FieldWidgetRegistry = Record<string, AnyFieldWidget>;

/**
 * Built-in type widgets land here (`text`, `number`, `boolean`, …).
 * Empty on purpose: the package skeleton ships chrome + the registry contract.
 */
export const defaultFieldWidgets: FieldWidgetRegistry = {};

export function resolveFieldWidget(
  type: string | undefined,
  widgets?: FieldWidgetRegistry,
): AnyFieldWidget {
  if (type) {
    const widget = widgets?.[type] ?? defaultFieldWidgets[type];
    if (widget) return widget;
  }
  return UnknownField;
}
