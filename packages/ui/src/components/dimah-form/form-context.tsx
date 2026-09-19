"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { defaultFieldWidgets } from "@/lib/default-field-widgets";
import {
  mergeFieldWidgets,
  type FieldWidgetRegistry,
} from "@/lib/widget-registry";

const FieldWidgetsContext = createContext<FieldWidgetRegistry | undefined>(
  undefined,
);
const FormSessionContext = createContext<FormResponseApi | null>(null);

/**
 * Merged widget map: built-ins, then `FormUiProvider` / `FormScope`, then
 * `override`. Safe to call without a provider.
 */
export function useFieldWidgets(
  override?: FieldWidgetRegistry,
): FieldWidgetRegistry {
  const fromContext = useContext(FieldWidgetsContext);
  return useMemo(
    () => mergeFieldWidgets(defaultFieldWidgets, fromContext, override),
    [fromContext, override],
  );
}

/**
 * Fill session from `form` or the nearest {@link FormScope} / {@link FormView}.
 */
export function useFormSession<TAnswers extends FormAnswers = FormAnswers>(
  form?: FormResponseApi<TAnswers>,
): FormResponseApi<TAnswers> {
  const scoped = useContext(
    FormSessionContext,
  ) as FormResponseApi<TAnswers> | null;
  const resolved = form ?? scoped;
  if (resolved == null) {
    throw new Error(
      "This component requires a form prop or a FormScope / FormView ancestor",
    );
  }
  return resolved;
}

export function FieldWidgetsProvider({
  widgets,
  children,
}: {
  widgets?: FieldWidgetRegistry;
  children: ReactNode;
}) {
  const merged = useFieldWidgets(widgets);
  return (
    <FieldWidgetsContext.Provider value={merged}>
      {children}
    </FieldWidgetsContext.Provider>
  );
}

export type FormScopeProps<TAnswers extends FormAnswers = FormAnswers> = {
  /** Headless fill session. Does not call `useFormResponse`. */
  form: FormResponseApi<TAnswers>;
  /** Merged on top of `FormUiProvider` / built-ins for this subtree. */
  widgets?: FieldWidgetRegistry;
  children: ReactNode;
};

/**
 * Session + widget boundary for a fill. {@link FormView} wraps this.
 * Compose chrome (`FormHeader`, `FormFields`, `FormActions`) inside it.
 */
export function FormScope<TAnswers extends FormAnswers = FormAnswers>({
  form,
  widgets,
  children,
}: FormScopeProps<TAnswers>) {
  return (
    <FormSessionContext.Provider value={form as FormResponseApi}>
      <FieldWidgetsProvider widgets={widgets}>{children}</FieldWidgetsProvider>
    </FormSessionContext.Provider>
  );
}
