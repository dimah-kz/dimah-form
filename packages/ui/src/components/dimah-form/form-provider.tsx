"use client";

import type { ReactNode } from "react";
import { TranslationProvider } from "@fuma-translate/react";
import { FieldWidgetsProvider } from "@/components/dimah-form/form-context";
import {
  FormUiComponentsProvider,
  FormUiFormattersProvider,
  type FormIssueFormatter,
  type FormSessionErrorFormatter,
  type FormUiComponents,
} from "@/components/dimah-form/form-ui-components";
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
   * Custom / override widgets keyed by field `type` or `meta.widget`.
   * Merged on top of built-ins. Register custom `defineFieldType` widgets
   * once here.
   */
  widgets?: FieldWidgetRegistry;
  /**
   * Swap built-in chrome. Nested providers merge — later keys win.
   */
  components?: FormUiComponents;
  /** Override / extend field issue copy. Return `undefined` to use the catalog. */
  formatIssue?: FormIssueFormatter;
  /** Override / extend session request error copy. */
  formatSessionError?: FormSessionErrorFormatter;
  children: ReactNode;
};

/**
 * i18n + widget registry + chrome boundary. Protocol stays on
 * `formClient.Provider`.
 *
 * @example
 * ```tsx
 * const fa = {
 *   "Submit(form action)": "ارسال",
 * } satisfies Partial<Translations>;
 *
 * const widgets = { rating: StarRatingField, "text.mask": MaskedTextField };
 *
 * function RequiredMark() {
 *   return <span className="ms-1" aria-hidden>*</span>;
 * }
 *
 * <formClient.Provider>
 *   <FormUiProvider
 *     translations={fa}
 *     widgets={widgets}
 *     components={{ RequiredMark }}
 *   >
 *     {children}
 *   </FormUiProvider>
 * </formClient.Provider>
 * ```
 */
export function FormUiProvider({
  translations,
  widgets,
  components,
  formatIssue,
  formatSessionError,
  children,
}: FormUiProviderProps) {
  const tree = (
    <FieldWidgetsProvider widgets={widgets}>
      <FormUiComponentsProvider components={components}>
        <FormUiFormattersProvider
          formatIssue={formatIssue}
          formatSessionError={formatSessionError}
        >
          {children}
        </FormUiFormattersProvider>
      </FormUiComponentsProvider>
    </FieldWidgetsProvider>
  );
  if (!translations) return tree;

  return (
    <TranslationProvider translations={translations}>
      {tree}
    </TranslationProvider>
  );
}
