"use client";

import { fieldLabel, type FormFieldBinding } from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Placeholder control until a widget exists for `field.type`.
 * Custom types register on {@link FieldWidgetRegistry} the same way they
 * register `defineFieldType` on the server.
 */
export function UnknownField(binding: FormFieldBinding) {
  const t = useTranslations();
  const type = binding.field?.type ?? binding.id;

  return (
    <Alert>
      <AlertTitle>
        {binding.field ? fieldLabel(binding.field) : binding.id}
      </AlertTitle>
      <AlertDescription>
        {t('Unknown field type "{type}"', {
          note: "fallback",
          variables: { type },
        })}
      </AlertDescription>
    </Alert>
  );
}
