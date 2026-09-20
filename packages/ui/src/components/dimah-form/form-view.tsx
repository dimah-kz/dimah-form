"use client";

import { createElement, type ReactNode } from "react";
import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { cn } from "cn";
import { FormActions } from "@/components/dimah-form/form-actions";
import {
  FormFillModeProvider,
  FormScope,
  useFormSession,
} from "@/components/dimah-form/form-context";
import { FormError } from "@/components/dimah-form/form-error";
import { FormErrorSummary } from "@/components/dimah-form/form-error-summary";
import {
  FormFields,
  type FormFieldsProps,
} from "@/components/dimah-form/form-fields";
import { FormHeader } from "@/components/dimah-form/form-header";
import { FormInactive } from "@/components/dimah-form/form-inactive";
import { FormProgress } from "@/components/dimah-form/form-progress";
import {
  FormRoot,
  type FormRootProps,
} from "@/components/dimah-form/form-root";
import { FormSaveState } from "@/components/dimah-form/form-save-state";
import { FormStatus } from "@/components/dimah-form/form-status";
import {
  FormStepFields,
  FormStepHeading,
  FormStepList,
  FormStepNav,
  FormSteps,
} from "@/components/dimah-form/form-steps";
import { useFormUiComponents } from "@/components/dimah-form/form-ui-components";
import { resolveFormViewLayout } from "@/lib/field-groups";
import type { FormViewLayout } from "@/lib/field-ui-meta";
import { renderFormSlot, type FormSlot } from "@/lib/form-slot";
import type { FieldWidgetRegistry } from "@/lib/widget-registry";

export type FormViewParts = {
  layout: Exclude<FormViewLayout, "auto">;
  header: ReactNode;
  progress: ReactNode;
  status: ReactNode;
  errorSummary: ReactNode;
  stepList: ReactNode;
  stepHeading: ReactNode;
  fields: ReactNode;
  error: ReactNode;
  saveState: ReactNode;
  actions: ReactNode;
};

export type FormViewProps<TAnswers extends FormAnswers = FormAnswers> = {
  /** Headless fill session. This component does not call `useFormResponse`. */
  form: FormResponseApi<TAnswers>;
  /** Extra / override widgets keyed by field `type` or `meta.widget`. */
  widgets?: FieldWidgetRegistry;
  className?: string;
  /**
   * `auto` — steps when `meta.step` groups to more than one page; review
   * when the response is locked. `fill` / `steps` / `review` force a layout.
   * `form.meta.layout` is used when this prop is omitted.
   */
  layout?: FormViewLayout;
  /**
   * Custom field layout. When omitted, visible fields render through
   * {@link FormFields} (or {@link FormStepFields}). Locked / `layout="review"`
   * uses {@link FormFields} with `mode="review"` unless `components.Review` or
   * the `review` slot opts into a compact FormReview.
   */
  children?: ReactNode;
  /**
   * Replace the default chrome composition (including {@link FormRoot}).
   * Slot nodes are already resolved.
   */
  render?: (parts: FormViewParts) => ReactNode;
  /** Passed to the default {@link FormRoot}. Ignored when `render` is set. */
  rootProps?: Omit<FormRootProps<TAnswers>, "form" | "children">;
  renderField?: FormFieldsProps<TAnswers>["renderField"];
  fields?: FormFieldsProps<TAnswers>["fields"];
  filter?: FormFieldsProps<TAnswers>["filter"];
  groupBy?: FormFieldsProps<TAnswers>["groupBy"];
  header?: FormSlot;
  progress?: FormSlot;
  status?: FormSlot;
  errorSummary?: FormSlot;
  error?: FormSlot;
  saveState?: FormSlot;
  actions?: FormSlot;
  stepList?: FormSlot;
  stepHeading?: FormSlot;
  stepNav?: FormSlot;
  review?: FormSlot;
  inactive?: FormSlot;
};

function FormViewChrome<TAnswers extends FormAnswers = FormAnswers>({
  className,
  children,
  resolved,
  render,
  rootProps,
  renderField,
  fields: fieldIds,
  filter,
  groupBy,
  header,
  progress,
  status,
  errorSummary,
  error,
  saveState,
  actions,
  stepList,
  stepHeading,
  stepNav,
  review,
}: Omit<FormViewProps<TAnswers>, "form" | "widgets" | "layout" | "inactive"> & {
  resolved: Exclude<FormViewLayout, "auto">;
}) {
  const ui = useFormUiComponents();
  const showProgress = resolved !== "review";
  const showSave = resolved !== "review";
  const fieldProps = { renderField, filter, groupBy };
  const reviewFields = ui.Review ? (
    createElement(ui.Review)
  ) : (
    <FormFields {...fieldProps} fields={fieldIds} />
  );
  const fields =
    children ??
    (resolved === "review" ? (
      renderFormSlot(review, reviewFields)
    ) : resolved === "steps" ? (
      <FormStepFields {...fieldProps} />
    ) : (
      <FormFields {...fieldProps} fields={fieldIds} />
    ));

  const actionRow =
    resolved === "steps"
      ? renderFormSlot(
          stepNav,
          <FormStepNav>
            {renderFormSlot(actions, createElement(ui.Actions ?? FormActions))}
          </FormStepNav>,
        )
      : renderFormSlot(actions, createElement(ui.Actions ?? FormActions));

  const parts: FormViewParts = {
    layout: resolved,
    header: renderFormSlot(header, <FormHeader />),
    progress: showProgress
      ? renderFormSlot(progress, createElement(ui.Progress ?? FormProgress))
      : null,
    status: renderFormSlot(status, <FormStatus />),
    errorSummary: renderFormSlot(errorSummary, <FormErrorSummary />),
    stepList:
      resolved === "steps" ? renderFormSlot(stepList, <FormStepList />) : null,
    stepHeading:
      resolved === "steps"
        ? renderFormSlot(stepHeading, <FormStepHeading />)
        : null,
    fields,
    error: renderFormSlot(error, <FormError />),
    saveState: showSave ? renderFormSlot(saveState, <FormSaveState />) : null,
    actions: actionRow,
  };

  if (render) return render(parts);

  return (
    <FormRoot
      {...rootProps}
      className={cn("gap-6 flex flex-col", className, rootProps?.className)}
    >
      {parts.header}
      {parts.progress}
      {parts.status}
      {parts.errorSummary}
      {parts.stepList}
      {parts.stepHeading}
      {parts.fields}
      {parts.error}
      {parts.saveState}
      {parts.actions}
    </FormRoot>
  );
}

function FormViewTree<TAnswers extends FormAnswers = FormAnswers>({
  layout,
  inactive,
  className,
  ...chrome
}: Omit<FormViewProps<TAnswers>, "form" | "widgets">) {
  const session = useFormSession<TAnswers>();
  const ui = useFormUiComponents();

  if (session.inactive) {
    return renderFormSlot(
      inactive,
      createElement(ui.Inactive ?? FormInactive, { className }),
    );
  }

  const resolved = resolveFormViewLayout(session, layout);
  const tree = (
    <FormViewChrome {...chrome} className={className} resolved={resolved} />
  );

  return (
    <FormFillModeProvider mode={resolved === "review" ? "review" : "edit"}>
      {resolved === "steps" ? <FormSteps>{tree}</FormSteps> : tree}
    </FormFillModeProvider>
  );
}

/**
 * Default questionnaire template: header, progress, status, fields, error,
 * save state, actions. `layout` picks fill / steps / review (`auto` infers).
 * Locked review renders widgets (`mode="review"`); pass `review={<FormReview />}`
 * or `components.Review` for a compact summary. Slot props take `false` to
 * hide, a node to replace, or a function to wrap the default. `render`
 * replaces the whole composition (bring your own {@link FormRoot}). Compose
 * {@link FormScope} + primitives for a custom layout.
 */
export function FormView<TAnswers extends FormAnswers = FormAnswers>({
  form,
  widgets,
  layout,
  ...chrome
}: FormViewProps<TAnswers>) {
  return (
    <FormScope form={form} widgets={widgets}>
      <FormViewTree layout={layout} {...chrome} />
    </FormScope>
  );
}
