import type { ComponentType } from "react";
import type { FormFieldBinding } from "@dimah-form/react";
import { UnknownField } from "@/components/dimah-form/widgets/unknown-field";

export type FieldWidgetProps<TValue = unknown> = FormFieldBinding<TValue> & {
  className?: string;
};

export type FieldWidget<TValue = unknown> = ComponentType<
  FieldWidgetProps<TValue>
>;

/** Mixed answer types — a typed `form.field(id)` must be passable. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
export type AnyFieldWidget = FieldWidget<any>;

/**
 * Field `type` string → widget. Same keys as `defineFieldType`.
 * Built-ins: `text`, `email`, `date`, `number`, `boolean`, `select`,
 * `multiSelect`. Custom types use the same string as the server validator.
 */
export type FieldWidgetRegistry = Record<string, AnyFieldWidget>;

/** Later layers win. `undefined` layers are skipped. */
export function mergeFieldWidgets(
  ...layers: (FieldWidgetRegistry | undefined)[]
): FieldWidgetRegistry {
  const merged: FieldWidgetRegistry = {};
  for (const layer of layers) {
    if (!layer) continue;
    Object.assign(merged, layer);
  }
  return merged;
}

export function resolveFieldWidget(
  type: string | undefined,
  widgets: FieldWidgetRegistry,
): AnyFieldWidget {
  if (type) {
    const widget = widgets[type];
    if (widget) return widget;
  }
  return UnknownField;
}
