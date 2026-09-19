import type { FieldOption, FormField, FormSnapshot } from "@dimah-form/react";

import {
  fieldMetaFlag,
  fieldMetaNumber,
  fieldMetaString,
  fieldWidget,
} from "@/lib/field-attr";

/** Built-in `meta.widget` values. Other strings are ignored by stock widgets. */
export const FIELD_UI_WIDGETS = ["radio", "switch", "chips"] as const;

export type FieldUiWidget = (typeof FIELD_UI_WIDGETS)[number];

export type FieldUiWidth = "full" | "half";

export type FieldUiOrientation = "vertical" | "horizontal" | "responsive";

export type FormViewLayout = "auto" | "fill" | "steps" | "review";

/**
 * Presentation bag on `field.meta`. Validation stays on the field document.
 * Pass a matching Zod object to `dimahForm({ metaSchema: { field } })`.
 */
export type FieldUiMeta = {
  widget?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  section?: string;
  step?: number | string;
  stepTitle?: string;
  autocomplete?: string;
  inputMode?: string;
  prefix?: string;
  suffix?: string;
  width?: FieldUiWidth;
  orientation?: FieldUiOrientation;
  help?: string;
  /**
   * Boolean widgets send `null` when off (consent / opt-in). Default off
   * writes `false` so a required yes/no can submit “No”.
   */
  unsetOnOff?: boolean;
};

/** Presentation bag on `option.meta`. */
export type OptionUiMeta = {
  description?: string;
};

/** Presentation bag on `form.meta`. */
export type FormUiMeta = {
  layout?: FormViewLayout;
  submitLabel?: string;
};

const WIDTHS = new Set<string>(["full", "half"]);
const ORIENTATIONS = new Set<string>(["vertical", "horizontal", "responsive"]);
const LAYOUTS = new Set<string>(["auto", "fill", "steps", "review"]);

function metaRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function metaString(
  meta: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = meta?.[key];
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : undefined;
}

/** Read known UI keys from `field.meta`. Unknown keys are ignored. */
export function readFieldUiMeta(field: FormField | undefined): FieldUiMeta {
  const stepNumber = fieldMetaNumber(field, "step");
  const width = fieldMetaString(field, "width");
  const orientation = fieldMetaString(field, "orientation");
  const rows = fieldMetaNumber(field, "rows");
  return {
    widget: fieldWidget(field),
    placeholder: fieldMetaString(field, "placeholder"),
    multiline: fieldMetaFlag(field, "multiline") || undefined,
    rows,
    section: fieldMetaString(field, "section"),
    step: stepNumber ?? fieldMetaString(field, "step"),
    stepTitle: fieldMetaString(field, "stepTitle"),
    autocomplete: fieldMetaString(field, "autocomplete"),
    inputMode: fieldMetaString(field, "inputMode"),
    prefix: fieldMetaString(field, "prefix"),
    suffix: fieldMetaString(field, "suffix"),
    width: width && WIDTHS.has(width) ? (width as FieldUiWidth) : undefined,
    orientation:
      orientation && ORIENTATIONS.has(orientation)
        ? (orientation as FieldUiOrientation)
        : undefined,
    help: fieldMetaString(field, "help"),
    unsetOnOff: fieldMetaFlag(field, "unsetOnOff") || undefined,
  };
}

export function readOptionUiMeta(
  option: Pick<FieldOption, "meta"> | undefined,
): OptionUiMeta {
  return {
    description: metaString(metaRecord(option?.meta), "description"),
  };
}

export function readFormUiMeta(
  snapshot: Pick<FormSnapshot, "meta"> | undefined,
): FormUiMeta {
  const meta = metaRecord(snapshot?.meta);
  const layout = metaString(meta, "layout");
  return {
    layout:
      layout && LAYOUTS.has(layout) ? (layout as FormViewLayout) : undefined,
    submitLabel: metaString(meta, "submitLabel"),
  };
}

/** Unchecked boolean: `false`, or `null` when `meta.unsetOnOff`. */
export function booleanOffValue(field: FormField | undefined): false | null {
  return readFieldUiMeta(field).unsetOnOff ? null : false;
}

export function fieldWidthClass(
  field: FormField | undefined,
  grid: boolean,
): string | undefined {
  if (!grid) return undefined;
  return readFieldUiMeta(field).width === "half"
    ? undefined
    : "@min-[32rem]/field-group:col-span-2";
}

export function fieldsUseHalfWidth(fields: readonly FormField[]): boolean {
  return fields.some((field) => readFieldUiMeta(field).width === "half");
}
