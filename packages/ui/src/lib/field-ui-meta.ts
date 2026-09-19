import type {
  FieldOption,
  FormField,
  FormSnapshot,
  FormStatus,
} from "@dimah-form/react";

/** Built-in `meta.widget` values. Other strings are ignored by stock widgets. */
export const FIELD_UI_WIDGETS = ["radio", "switch", "chips"] as const;

export type FieldUiWidget = (typeof FIELD_UI_WIDGETS)[number];

export type FieldUiWidth = "full" | "half" | "third";

export type FieldUiOrientation = "vertical" | "horizontal" | "responsive";

export type FormViewLayout = "auto" | "fill" | "steps" | "review";

/**
 * Presentation bag on `field.meta`. Validation stays on the field document.
 * Known keys autocomplete; extra keys are allowed (same as core `meta`).
 * Author with `defineForm({ ... } satisfies FormDefinitionUi)`.
 */
export type FieldUiMeta = {
  widget?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  section?: string;
  step?: number | string;
  autocomplete?: string;
  inputMode?: string;
  prefix?: string;
  suffix?: string;
  width?: FieldUiWidth;
  orientation?: FieldUiOrientation;
  help?: string;
  [key: string]: unknown;
};

/** Presentation bag on `option.meta`. */
export type OptionUiMeta = {
  description?: string;
  [key: string]: unknown;
};

/** Presentation bag on `form.meta`. */
export type FormUiMeta = {
  layout?: FormViewLayout;
  submitLabel?: string;
  /** Step key (`meta.step`, default `"1"`) → heading for {@link FormSteps}. */
  steps?: Record<string, string>;
  [key: string]: unknown;
};

/**
 * `defineForm({ ... } satisfies FormDefinitionUi)` when using this package.
 * `meta` autocompletes known UI keys; extra keys stay allowed.
 * Type-specific field keys (`minLength`, `unsetOnOff`, custom
 * `defineFieldType` props) stay allowed.
 */
export type FormDefinitionUi = {
  title: string;
  description?: string;
  slug?: string;
  status?: FormStatus;
  meta?: FormUiMeta;
  fields: readonly FormDefinitionUiField[];
};

export type FormDefinitionUiOption = {
  value: string;
  label?: string;
  meta?: OptionUiMeta;
};

export type FormDefinitionUiField = {
  [key: string]: unknown;
  id: string;
  type: string;
  required?: boolean;
  label?: string;
  description?: string;
  defaultValue?: unknown;
  showWhen?: FormField["showWhen"];
  meta?: FieldUiMeta;
  options?: readonly FormDefinitionUiOption[];
};

const WIDTHS = new Set<string>(["full", "half", "third"]);
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

function metaFlag(
  meta: Record<string, unknown> | undefined,
  key: string,
): boolean {
  return meta?.[key] === true;
}

function metaNumber(
  meta: Record<string, unknown> | undefined,
  key: string,
): number | undefined {
  const value = meta?.[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function metaSteps(
  meta: Record<string, unknown> | undefined,
): Record<string, string> | undefined {
  const value = meta?.steps;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const steps: Record<string, string> = {};
  for (const [key, title] of Object.entries(value)) {
    if (typeof title === "string" && title.trim() !== "") {
      steps[key] = title.trim();
    }
  }
  return Object.keys(steps).length > 0 ? steps : undefined;
}

/** Read known UI keys from `field.meta`. Unknown keys are ignored at runtime. */
export function readFieldUiMeta(field: FormField | undefined): FieldUiMeta {
  const meta = metaRecord(field?.meta);
  const stepNumber = metaNumber(meta, "step");
  const width = metaString(meta, "width");
  const orientation = metaString(meta, "orientation");
  return {
    widget: metaString(meta, "widget"),
    placeholder: metaString(meta, "placeholder"),
    multiline: metaFlag(meta, "multiline") || undefined,
    rows: metaNumber(meta, "rows"),
    section: metaString(meta, "section"),
    step: stepNumber ?? metaString(meta, "step"),
    autocomplete: metaString(meta, "autocomplete"),
    inputMode: metaString(meta, "inputMode"),
    prefix: metaString(meta, "prefix"),
    suffix: metaString(meta, "suffix"),
    width: width && WIDTHS.has(width) ? (width as FieldUiWidth) : undefined,
    orientation:
      orientation && ORIENTATIONS.has(orientation)
        ? (orientation as FieldUiOrientation)
        : undefined,
    help: metaString(meta, "help"),
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
    steps: metaSteps(meta),
  };
}

/** Unchecked boolean: `false`, or `null` when `field.unsetOnOff`. */
export function booleanOffValue(field: FormField | undefined): false | null {
  return field?.unsetOnOff === true ? null : false;
}

const WIDTH_SPAN: Record<FieldUiWidth, string> = {
  full: "@min-[32rem]/field-group:col-span-6",
  half: "@min-[32rem]/field-group:col-span-3",
  third: "@min-[32rem]/field-group:col-span-2",
};

export function fieldWidthClass(
  field: FormField | undefined,
  grid: boolean,
): string | undefined {
  if (!grid) return undefined;
  const width = readFieldUiMeta(field).width ?? "full";
  return WIDTH_SPAN[width];
}

/** True when any field should share a row (`half` / `third`). */
export function fieldsUseGrid(fields: readonly FormField[]): boolean {
  return fields.some((field) => {
    const width = readFieldUiMeta(field).width;
    return width === "half" || width === "third";
  });
}

/** @deprecated Use {@link fieldsUseGrid}. */
export function fieldsUseHalfWidth(fields: readonly FormField[]): boolean {
  return fieldsUseGrid(fields);
}
