/** Authoring helper — identity at runtime; types come from the instance later. */
export function defineForm<const T extends object>(form: T): T {
  return form;
}

/** Custom field type — validator + answer shape. Not a UI component. */
export function defineFieldType<const T extends { type: string }>(
  fieldType: T,
): T {
  return fieldType;
}
