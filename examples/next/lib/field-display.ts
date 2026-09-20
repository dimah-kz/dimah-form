import {
  formatAnswer as formatStoredAnswer,
  type FormField,
} from "@dimah-form/react";

import { fieldTypes } from "@/lib/field-types";

export function formatAnswer(field: FormField, value: unknown) {
  const formatted = formatStoredAnswer(field, value, fieldTypes);
  return formatted === "" ? "—" : formatted;
}
