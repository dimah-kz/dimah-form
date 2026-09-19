import type { FormField } from "@dimah-form/react";

import { readFieldUiMeta, type FormUiMeta } from "@/lib/field-ui-meta";

export type FieldGroupBucket = {
  key: string;
  title?: string;
  fields: FormField[];
};

export function selectVisibleFields(
  fields: readonly FormField[],
  options?: {
    ids?: readonly string[];
    filter?: (field: FormField) => boolean;
  },
): FormField[] {
  let next = [...fields];
  if (options?.ids) {
    const allow = new Set(options.ids);
    next = next.filter((field) => allow.has(field.id));
  }
  if (options?.filter) next = next.filter(options.filter);
  return next;
}

export function fieldSectionTitle(field: FormField): string | undefined {
  return readFieldUiMeta(field).section;
}

export function fieldStepKey(field: FormField): string {
  const step = readFieldUiMeta(field).step;
  return step === undefined ? "1" : String(step);
}

export function fieldStepTitle(
  field: FormField,
  stepTitles?: FormUiMeta["steps"],
): string | undefined {
  const title = stepTitles?.[fieldStepKey(field)];
  return typeof title === "string" && title.trim() !== ""
    ? title.trim()
    : undefined;
}

export function shouldGroupBySection(fields: readonly FormField[]): boolean {
  return fields.some((field) => fieldSectionTitle(field) !== undefined);
}

export function shouldGroupByStep(fields: readonly FormField[]): boolean {
  return groupFieldsByStep(fields).length > 1;
}

function pushGroup(
  groups: FieldGroupBucket[],
  indexByKey: Map<string, number>,
  key: string,
  title: string | undefined,
  field: FormField,
) {
  const existing = indexByKey.get(key);
  if (existing === undefined) {
    indexByKey.set(key, groups.length);
    groups.push({ key, title, fields: [field] });
    return;
  }
  const group = groups[existing];
  group?.fields.push(field);
  if (group && title && !group.title) group.title = title;
}

/** Preserve first-seen section order. Fields without `meta.section` stay untitled. */
export function groupFieldsBySection(
  fields: readonly FormField[],
): FieldGroupBucket[] {
  const groups: FieldGroupBucket[] = [];
  const indexByKey = new Map<string, number>();
  for (const field of fields) {
    const title = fieldSectionTitle(field);
    const key = title ?? "";
    pushGroup(groups, indexByKey, key || "__default", title, field);
  }
  return groups;
}

function compareStepKeys(left: string, right: string): number {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  const leftIsNumber = left.trim() !== "" && Number.isFinite(leftNumber);
  const rightIsNumber = right.trim() !== "" && Number.isFinite(rightNumber);
  if (leftIsNumber && rightIsNumber) return leftNumber - rightNumber;
  if (leftIsNumber) return -1;
  if (rightIsNumber) return 1;
  return left.localeCompare(right);
}

/** Group by `meta.step` (number or string). Missing step is `"1"`. */
export function groupFieldsByStep(
  fields: readonly FormField[],
  stepTitles?: FormUiMeta["steps"],
): FieldGroupBucket[] {
  const groups: FieldGroupBucket[] = [];
  const indexByKey = new Map<string, number>();
  for (const field of fields) {
    const key = fieldStepKey(field);
    pushGroup(
      groups,
      indexByKey,
      key,
      fieldStepTitle(field, stepTitles),
      field,
    );
  }
  return groups.sort((left, right) => compareStepKeys(left.key, right.key));
}
