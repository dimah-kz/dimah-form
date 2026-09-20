"use client";

import { Fragment, type ReactNode } from "react";
import type {
  FormAnswers,
  FormField as FormFieldDocument,
  FormResponseApi,
} from "@dimah-form/react";
import { cn } from "cn";
import { FieldGroup } from "@/components/ui/field";
import {
  FieldWidgetsProvider,
  useFormSession,
} from "@/components/dimah-form/form-context";
import { FormField } from "@/components/dimah-form/form-field";
import { FormSection } from "@/components/dimah-form/form-section";
import { useFormStepsOptional } from "@/components/dimah-form/form-steps";
import {
  groupFieldsBySection,
  selectVisibleFields,
  shouldGroupBySection,
} from "@/lib/field-groups";
import { fieldsUseGrid, fieldWidthClass } from "@/lib/field-ui-meta";
import type { FieldWidgetRegistry } from "@/lib/widget-registry";

export type FormFieldRenderHelpers = {
  defaultField: ReactNode;
};

export type FormFieldsProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  widgets?: FieldWidgetRegistry;
  className?: string;
  /** Restrict to these ids (still respects visibility). */
  fields?: readonly string[];
  filter?: (field: FormFieldDocument) => boolean;
  /**
   * `section` always groups by `meta.section`.
   * Omit groups only when at least one visible field has `meta.section`.
   * `false` never groups.
   */
  groupBy?: "section" | false;
  /** Replace the default {@link FormField} for one binding. */
  renderField?: (
    binding: ReturnType<FormResponseApi<TAnswers>["field"]>,
    helpers: FormFieldRenderHelpers,
  ) => ReactNode;
};

/**
 * Visible fields as a shadcn `FieldGroup`. Pass `renderField` to keep the
 * loop and swap chrome per field (`helpers.defaultField` is the stock widget).
 */
export function FormFields<TAnswers extends FormAnswers = FormAnswers>({
  form,
  widgets,
  className,
  fields: fieldIds,
  filter,
  groupBy,
  renderField,
}: FormFieldsProps<TAnswers>) {
  const session = useFormSession(form);
  const steps = useFormStepsOptional();
  const visible = selectVisibleFields(session.visibleFields, {
    ids: fieldIds,
    filter,
  });
  const grouped =
    groupBy === false
      ? [
          {
            key: "__all",
            title: undefined as string | undefined,
            fields: visible,
          },
        ]
      : groupBy === "section" || shouldGroupBySection(visible)
        ? groupFieldsBySection(visible)
        : [{ key: "__all", title: undefined, fields: visible }];

  const fields = (
    <FieldGroup className={cn("gap-6", className)}>
      {grouped.map((group) => {
        const grid = fieldsUseGrid(group.fields);
        const items = (
          <div
            className={
              grid
                ? "gap-x-5 gap-y-6 grid grid-cols-1 @min-[32rem]/field-group:grid-cols-6"
                : "contents"
            }
          >
            {group.fields.map((field) => {
              const binding = session.field(field.id);
              const defaultField = <FormField binding={binding} />;
              const item = renderField
                ? renderField(binding, { defaultField })
                : defaultField;
              return (
                <div
                  key={field.id}
                  className={cn("min-w-0", fieldWidthClass(field, grid))}
                >
                  {item}
                </div>
              );
            })}
          </div>
        );
        const titleMatchesStep =
          group.title != null &&
          steps?.step != null &&
          (group.title === steps.step.title || group.title === steps.step.key);

        if (!group.title || titleMatchesStep) {
          return <Fragment key={group.key}>{items}</Fragment>;
        }
        return (
          <FormSection key={group.key} title={group.title}>
            <FieldGroup className="gap-6">{items}</FieldGroup>
          </FormSection>
        );
      })}
    </FieldGroup>
  );

  if (!widgets) return fields;
  return (
    <FieldWidgetsProvider widgets={widgets}>{fields}</FieldWidgetsProvider>
  );
}
