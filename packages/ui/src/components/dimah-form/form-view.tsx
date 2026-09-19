"use client";

import type { ReactNode } from "react";
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
import { FormFields } from "@/components/dimah-form/form-fields";
import { FormHeader } from "@/components/dimah-form/form-header";
import { FormInactive } from "@/components/dimah-form/form-inactive";
import { FormProgress } from "@/components/dimah-form/form-progress";
import { FormReview } from "@/components/dimah-form/form-review";
import { FormRoot } from "@/components/dimah-form/form-root";
import { FormSaveState } from "@/components/dimah-form/form-save-state";
import { FormStatus } from "@/components/dimah-form/form-status";
import {
  FormStepFields,
  FormStepHeading,
  FormStepNav,
  FormSteps,
} from "@/components/dimah-form/form-steps";
import { shouldGroupByStep } from "@/lib/field-groups";
import { readFormUiMeta, type FormViewLayout } from "@/lib/field-ui-meta";
import { renderFormSlot, type FormSlot } from "@/lib/form-slot";
import type { FieldWidgetRegistry } from "@/lib/widget-registry";

export type FormViewProps<TAnswers extends FormAnswers = FormAnswers> = {
  /** Headless fill session. This component does not call `useFormResponse`. */
  form: FormResponseApi<TAnswers>;
  /** Extra / override widgets keyed by field `type`. */
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
   * {@link FormFields} (or {@link FormStepFields} / {@link FormReview}).
   */
  children?: ReactNode;
  header?: FormSlot;
  progress?: FormSlot;
  status?: FormSlot;
  errorSummary?: FormSlot;
  error?: FormSlot;
  saveState?: FormSlot;
  actions?: FormSlot;
  stepHeading?: FormSlot;
  stepNav?: FormSlot;
  review?: FormSlot;
};

function resolveLayout(
  session: {
    locked: boolean;
    visibleFields: FormResponseApi["visibleFields"];
    snapshot: FormResponseApi["snapshot"];
  },
  layout: FormViewLayout | undefined,
): Exclude<FormViewLayout, "auto"> {
  const requested = layout ?? readFormUiMeta(session.snapshot).layout ?? "auto";
  if (requested === "fill" || requested === "steps" || requested === "review") {
    return requested;
  }
  if (session.locked) return "review";
  if (shouldGroupByStep(session.visibleFields)) return "steps";
  return "fill";
}

function FormViewChrome<TAnswers extends FormAnswers = FormAnswers>({
  className,
  children,
  resolved,
  header,
  progress,
  status,
  errorSummary,
  error,
  saveState,
  actions,
  stepHeading,
  stepNav,
  review,
}: Omit<FormViewProps<TAnswers>, "form" | "widgets" | "layout"> & {
  resolved: Exclude<FormViewLayout, "auto">;
}) {
  const showProgress = resolved !== "review";
  const showSave = resolved !== "review";
  const fields =
    children ??
    (resolved === "review" ? (
      renderFormSlot(review, <FormReview />)
    ) : resolved === "steps" ? (
      <>
        {renderFormSlot(stepHeading, <FormStepHeading />)}
        <FormStepFields />
      </>
    ) : (
      <FormFields />
    ));

  const actionRow =
    resolved === "steps"
      ? renderFormSlot(
          stepNav,
          <FormStepNav>{renderFormSlot(actions, <FormActions />)}</FormStepNav>,
        )
      : renderFormSlot(actions, <FormActions />);

  return (
    <FormRoot className={cn("gap-6 flex flex-col", className)}>
      {renderFormSlot(header, <FormHeader />)}
      {showProgress ? renderFormSlot(progress, <FormProgress />) : null}
      {renderFormSlot(status, <FormStatus />)}
      {renderFormSlot(errorSummary, <FormErrorSummary />)}
      {fields}
      {renderFormSlot(error, <FormError />)}
      {showSave ? renderFormSlot(saveState, <FormSaveState />) : null}
      {actionRow}
    </FormRoot>
  );
}

function FormViewTree<TAnswers extends FormAnswers = FormAnswers>({
  layout,
  ...chrome
}: Omit<FormViewProps<TAnswers>, "form" | "widgets">) {
  const session = useFormSession<TAnswers>();

  if (session.inactive) {
    return <FormInactive className={chrome.className} />;
  }

  const resolved = resolveLayout(session, layout);
  const tree = <FormViewChrome {...chrome} resolved={resolved} />;

  return (
    <FormFillModeProvider mode={resolved === "review" ? "review" : "edit"}>
      {resolved === "steps" ? <FormSteps>{tree}</FormSteps> : tree}
    </FormFillModeProvider>
  );
}

/**
 * Default questionnaire template: header, progress, status, fields, error,
 * save state, actions. `layout` picks fill / steps / review (`auto` infers).
 * Slot props take `false` to hide or a node to replace.
 * Compose {@link FormScope} + primitives for a custom layout.
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
