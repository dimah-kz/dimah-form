"use client";

import type { ReactNode } from "react";
import { TranslationProvider } from "@fuma-translate/react";
import type { Translations } from "@/lib/dimah-form-translations";

export type FormUiProviderProps = {
  /**
   * Optional consumer-owned Fuma locale map (`Partial<Translations>`).
   * Omit for English — source strings in `t("…")` are the default
   * ([Fuma Translate](https://translate.fuma-nama.dev/) key fallback).
   */
  translations?: Partial<Translations>;
  children: ReactNode;
};

/**
 * i18n boundary for `@dimah-form/ui`. Protocol stays on `formClient.Provider`.
 *
 * @example
 * ```tsx
 * const fa = {
 *   "Submit(form action)": "ارسال",
 * } satisfies Partial<Translations>;
 *
 * <formClient.Provider>
 *   <FormUiProvider translations={fa}>{children}</FormUiProvider>
 * </formClient.Provider>
 * ```
 */
export function FormUiProvider({
  translations,
  children,
}: FormUiProviderProps) {
  if (!translations) return children;

  return (
    <TranslationProvider translations={translations}>
      {children}
    </TranslationProvider>
  );
}
