import type { ComponentType } from "react";
import type { FormField, FormFieldBinding } from "@dimah-form/react";

import { readFieldUiMeta } from "@/lib/field-ui-meta";

export type FieldWidgetProps<TValue = unknown> = {
  binding: FormFieldBinding<TValue>;
  className?: string;
  /** `review` when the template is showing a read-only summary. */
  mode?: "edit" | "review";
};

export type FieldWidget<TValue = unknown> = ComponentType<
  FieldWidgetProps<TValue>
>;

/** Mixed answer types — a typed `form.field(id)` must be passable. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
export type AnyFieldWidget = FieldWidget<any>;

/**
 * Field `type` or `meta.widget` string → widget. Same keys as `defineFieldType`.
 * Built-ins: `text`, `email`, `date`, `number`, `boolean`, `select`,
 * `multiSelect`. Custom types use the same string as the server validator.
 * Register a `meta.widget` key to swap one field without replacing the type.
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

/**
 * `meta.widget` when that key is registered, else `field.type`.
 * A type string still resolves as before.
 */
export function resolveFieldWidget(
  fieldOrType: FormField | string | undefined,
  widgets: FieldWidgetRegistry,
): AnyFieldWidget | undefined {
  if (fieldOrType == null || fieldOrType === "") return undefined;
  if (typeof fieldOrType === "string") return widgets[fieldOrType];
  const widget = readFieldUiMeta(fieldOrType).widget;
  if (widget && widgets[widget]) return widgets[widget];
  return fieldOrType.type ? widgets[fieldOrType.type] : undefined;
}

/** Component-identity compare so inline `{ rating: StarRatingField }` stays stable. */
export function sameFieldWidgets(
  left?: FieldWidgetRegistry,
  right?: FieldWidgetRegistry,
): boolean {
  if (left === right) return true;
  if (!left || !right) return false;
  const keys = Object.keys(left);
  if (keys.length !== Object.keys(right).length) return false;
  for (const key of keys) {
    if (left[key] !== right[key]) return false;
  }
  return true;
}
