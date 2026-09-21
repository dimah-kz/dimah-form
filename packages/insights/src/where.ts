import type { ResponseRecord } from "@dimah-form/core";

/** Segment a walk by one snapshot answer. Unknown field → no match. */
export function rowMatchesWhere(
  row: ResponseRecord,
  fieldId: string,
  expected: string,
): boolean {
  const field = row.definition.fields.find((item) => item.id === fieldId);
  if (!field) return false;
  const value = Object.hasOwn(row.answers, field.id)
    ? row.answers[field.id]
    : undefined;
  if (field.type === "boolean") {
    if (expected === "true") return value === true;
    if (expected === "false") return value === false;
    return false;
  }
  if (Array.isArray(value)) {
    return value.includes(expected);
  }
  return value === expected;
}
