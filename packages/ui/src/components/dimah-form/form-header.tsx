"use client";

import { createElement, type ReactNode } from "react";
import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { cn } from "cn";
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";
import { useFormSession } from "@/components/dimah-form/form-context";
import { FormSaveState } from "@/components/dimah-form/form-save-state";
import { useFormUiComponents } from "@/components/dimah-form/form-ui-components";
import { renderFormSlot, type FormSlot } from "@/lib/form-slot";

export type FormHeaderProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  className?: string;
  /** `false` hides. Omit for `snapshot.title`. */
  title?: ReactNode | false;
  /** `false` hides. Omit for `snapshot.description`. */
  description?: ReactNode | false;
  /**
   * Save-state badge. Omit for {@link FormSaveState} (hidden while locked).
   * `false` hides. Same wrap-or-replace rules as {@link FormSlot}.
   */
  saveState?: FormSlot;
};

/** Title + description + optional save state badge as shadcn `FieldSet` / `FieldLegend`. */
export function FormHeader<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
  title,
  description,
  saveState,
}: FormHeaderProps<TAnswers>) {
  const session = useFormSession(form);
  const { SaveState } = useFormUiComponents();
  const titleContent =
    title === false ? null : (title ?? session.snapshot.title);
  const descriptionContent =
    description === false
      ? null
      : (description ?? session.snapshot.description ?? null);
  const saveStateNode = renderFormSlot(
    saveState,
    session.locked ? null : createElement(SaveState ?? FormSaveState),
  );

  if (!titleContent && !descriptionContent && !saveStateNode) return null;

  return (
    <FieldSet data-slot="form-header" className={cn("gap-1.5", className)}>
      {titleContent ? (
        <FieldLegend className="mb-0 gap-3 text-xl font-bold tracking-tight flex w-full items-start justify-between text-balance text-dimah-form-foreground">
          <span className="min-w-0">{titleContent}</span>
          {saveStateNode ? (
            <span className="pt-0.5 font-normal shrink-0">{saveStateNode}</span>
          ) : null}
        </FieldLegend>
      ) : saveStateNode ? (
        <div className="flex justify-end">{saveStateNode}</div>
      ) : null}
      {descriptionContent ? (
        <FieldDescription className="text-sm leading-relaxed text-pretty text-dimah-form-muted-foreground">
          {descriptionContent}
        </FieldDescription>
      ) : null}
    </FieldSet>
  );
}
