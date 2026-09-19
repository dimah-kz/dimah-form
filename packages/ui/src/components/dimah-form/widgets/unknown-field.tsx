"use client";

import { fieldLabel } from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { FieldWidgetProps } from "@/lib/widget-registry";

/**
 * Fallback when no widget is registered for `field.type`.
 * Custom types register on {@link FieldWidgetRegistry} with the same string
 * as `defineFieldType`.
 */
export function UnknownField({ className, ...binding }: FieldWidgetProps) {
  const t = useTranslations();
  const type = binding.field?.type ?? binding.id;

  return (
    <Alert className={className}>
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
