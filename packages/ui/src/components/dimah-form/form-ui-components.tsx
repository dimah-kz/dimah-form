"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ComponentType,
  type ReactNode,
} from "react";
import type { FormFieldBinding } from "@dimah-form/react";

import type { FormActionsProps } from "@/components/dimah-form/form-actions";
import type { FormFieldFrameProps } from "@/components/dimah-form/form-field-frame";
import type { FormInactiveProps } from "@/components/dimah-form/form-inactive";
import type { FormProgressProps } from "@/components/dimah-form/form-progress";
import type { FormReviewProps } from "@/components/dimah-form/form-review";

/**
 * Chrome swaps for `FormUiProvider`. Only pass keys you want to replace.
 */
export type FormUiComponents = {
  /** Required-field mark next to the label. Omit for the built-in asterisk. */
  RequiredMark?: ComponentType;
  FieldFrame?: ComponentType<FormFieldFrameProps>;
  /** Replaces the default review body (FormFields). Pass FormReview for a compact list. */
  Review?: ComponentType<FormReviewProps>;
  Actions?: ComponentType<FormActionsProps>;
  Progress?: ComponentType<FormProgressProps>;
  Inactive?: ComponentType<FormInactiveProps>;
};

export type FormIssueFormatter = (
  binding: Pick<FormFieldBinding, "error" | "errorCode" | "errorParams">,
) => string | undefined;

export type FormSessionErrorFormatter = (session: {
  error?: string;
  errorCode?: string;
  errorParams?: Record<string, string | number>;
}) => string | undefined;

export type FormUiFormatters = {
  formatIssue?: FormIssueFormatter;
  formatSessionError?: FormSessionErrorFormatter;
};

const defaultFormUiComponents: FormUiComponents = {};
const FormUiComponentsContext = createContext(defaultFormUiComponents);

const defaultFormUiFormatters: FormUiFormatters = {};
const FormUiFormattersContext = createContext(defaultFormUiFormatters);

/**
 * Chrome component overrides from the nearest `FormUiProvider`.
 * Safe without a provider (empty — callers use built-ins).
 */
export function useFormUiComponents(): FormUiComponents {
  return useContext(FormUiComponentsContext);
}

export function useFormUiFormatters(): FormUiFormatters {
  return useContext(FormUiFormattersContext);
}

function mergeComponents(
  parent: FormUiComponents,
  patch?: FormUiComponents,
): FormUiComponents {
  if (!patch) return parent;
  const next: FormUiComponents = {
    RequiredMark: patch.RequiredMark ?? parent.RequiredMark,
    FieldFrame: patch.FieldFrame ?? parent.FieldFrame,
    Review: patch.Review ?? parent.Review,
    Actions: patch.Actions ?? parent.Actions,
    Progress: patch.Progress ?? parent.Progress,
    Inactive: patch.Inactive ?? parent.Inactive,
  };
  if (
    next.RequiredMark === parent.RequiredMark &&
    next.FieldFrame === parent.FieldFrame &&
    next.Review === parent.Review &&
    next.Actions === parent.Actions &&
    next.Progress === parent.Progress &&
    next.Inactive === parent.Inactive
  ) {
    return parent;
  }
  return next;
}

export function FormUiComponentsProvider({
  components,
  children,
}: {
  components?: FormUiComponents;
  children: ReactNode;
}) {
  const parent = useContext(FormUiComponentsContext);
  const value = useMemo(
    () => mergeComponents(parent, components),
    [parent, components],
  );

  if (value === parent) return children;

  return (
    <FormUiComponentsContext.Provider value={value}>
      {children}
    </FormUiComponentsContext.Provider>
  );
}

export function FormUiFormattersProvider({
  formatIssue,
  formatSessionError,
  children,
}: FormUiFormatters & { children: ReactNode }) {
  const parent = useContext(FormUiFormattersContext);
  const value = useMemo(() => {
    if (!formatIssue && !formatSessionError) return parent;
    const next: FormUiFormatters = { ...parent };
    if (formatIssue) next.formatIssue = formatIssue;
    if (formatSessionError) next.formatSessionError = formatSessionError;
    if (
      next.formatIssue === parent.formatIssue &&
      next.formatSessionError === parent.formatSessionError
    ) {
      return parent;
    }
    return next;
  }, [parent, formatIssue, formatSessionError]);

  if (value === parent) return children;

  return (
    <FormUiFormattersContext.Provider value={value}>
      {children}
    </FormUiFormattersContext.Provider>
  );
}
