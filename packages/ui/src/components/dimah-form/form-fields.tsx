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
import {
  groupFieldsBySection,
  selectVisibleFields,
  shouldGroupBySection,
} from "@/lib/field-groups";
import { fieldsUseHalfWidth, fieldWidthClass } from "@/lib/field-ui-meta";
import type { FieldWidgetRegistry } from "@/lib/widget-registry";

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
  ) => ReactNode;
};

/**
 * Visible fields as a shadcn `FieldGroup`. Pass `renderField` to keep the
 * loop and swap chrome per field.
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
    <FieldGroup className={cn(className)}>
      {grouped.map((group) => {
        const half = fieldsUseHalfWidth(group.fields);
        const items = (
          <div
            className={
              half
                ? "gap-5 grid grid-cols-1 @min-[32rem]/field-group:grid-cols-2"
                : "contents"
            }
          >
            {group.fields.map((field) => {
              const binding = session.field(field.id);
              const item = renderField ? (
                renderField(binding)
              ) : (
                <FormField binding={binding} />
              );
              return (
                <div
                  key={field.id}
                  className={cn("min-w-0", fieldWidthClass(field, half))}
                >
                  {item}
                </div>
              );
            })}
          </div>
        );
        if (!group.title) {
          return <Fragment key={group.key}>{items}</Fragment>;
        }
        return (
          <FormSection key={group.key} title={group.title}>
            <FieldGroup>{items}</FieldGroup>
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
