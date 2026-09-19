"use client";

import type { ReactNode } from "react";
import { TranslationProvider } from "@fuma-translate/react";
import { FieldWidgetsProvider } from "@/components/dimah-form/form-context";
import type { Translations } from "@/lib/dimah-form-translations";
import type { FieldWidgetRegistry } from "@/lib/widget-registry";

export type FormUiProviderProps = {
  /**
   * Optional consumer-owned Fuma locale map (`Partial<Translations>`).
   * Omit for English — source strings in `t("…")` are the default
   * ([Fuma Translate](https://translate.fuma-nama.dev/) key fallback).
   */
  translations?: Partial<Translations>;
  /**
   * Custom / override widgets keyed by field `type`. Merged on top of
   * built-ins. Register custom `defineFieldType` widgets once here.
   */
  widgets?: FieldWidgetRegistry;
  children: ReactNode;
};

/**
 * i18n + widget registry boundary. Protocol stays on `formClient.Provider`.
 *
 * @example
 * ```tsx
 * const fa = {
 *   "Submit(form action)": "ارسال",
 * } satisfies Partial<Translations>;
 *
 * <formClient.Provider>
 *   <FormUiProvider translations={fa} widgets={{ rating: StarRatingField }}>
 *     {children}
 *   </FormUiProvider>
 * </formClient.Provider>
 * ```
 */
export function FormUiProvider({
  translations,
  widgets,
  children,
}: FormUiProviderProps) {
  const tree = (
    <FieldWidgetsProvider widgets={widgets}>{children}</FieldWidgetsProvider>
  );
  if (!translations) return tree;

  return (
    <TranslationProvider translations={translations}>
      {tree}
    </TranslationProvider>
  );
}
