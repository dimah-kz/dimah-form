import { BooleanField } from "@/components/dimah-form/widgets/boolean-field";
import { DateField } from "@/components/dimah-form/widgets/date-field";
import { EmailField } from "@/components/dimah-form/widgets/email-field";
import { MultiSelectField } from "@/components/dimah-form/widgets/multi-select-field";
import { NumberField } from "@/components/dimah-form/widgets/number-field";
import { SelectField } from "@/components/dimah-form/widgets/select-field";
import { TextField } from "@/components/dimah-form/widgets/text-field";
import {
  mergeFieldWidgets,
  type FieldWidgetRegistry,
} from "@/lib/widget-registry";

/**
 * Built-in `type` → widget. Pass overrides to {@link createFieldWidgets} or
 * `FormUiProvider` / `FormView` / `FormField` — later layers win.
 */
export const defaultFieldWidgets: FieldWidgetRegistry = {
  text: TextField,
  email: EmailField,
  date: DateField,
  number: NumberField,
  boolean: BooleanField,
  select: SelectField,
  multiSelect: MultiSelectField,
};

export function createFieldWidgets(
  overrides?: FieldWidgetRegistry,
): FieldWidgetRegistry {
  return mergeFieldWidgets(defaultFieldWidgets, overrides);
}
