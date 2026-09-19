"use client";

import { StringField } from "@/components/dimah-form/widgets/string-field";
import type { FieldWidgetProps } from "@/lib/widget-registry";

export function DateField(props: FieldWidgetProps) {
  return <StringField {...props} inputType="date" />;
}
