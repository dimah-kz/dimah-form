"use client";

import {
  createContext,
  createElement,
  useContext,
  type ReactNode,
} from "react";
import { fieldLabel, type FormFieldBinding } from "@dimah-form/react";
import { cn } from "cn";
import { useFormUiComponents } from "@/components/dimah-form/form-ui-components";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { useFieldIssue } from "@/hooks/use-field-issue";
import {
  fieldDescriptionId,
  fieldErrorId,
  fieldHelpId,
  fieldWidget,
} from "@/lib/field-attr";
import { readFieldUiMeta } from "@/lib/field-ui-meta";

/** Default required-field mark. Swap via `FormUiProvider` `components.RequiredMark`. */
export function RequiredMark() {
  return (
    <span className="ms-1 text-dimah-form-destructive" aria-hidden>
      *
    </span>
  );
}

export type FormFieldFrameLayout = "stack" | "choice" | "group";

export type FormFieldFrameClassNames = {
  root?: string;
  label?: string;
  description?: string;
  help?: string;
  error?: string;
};

export type FormFieldFrameProps<TValue = unknown> = {
  binding: FormFieldBinding<TValue>;
  children?: ReactNode;
  className?: string;
  classNames?: FormFieldFrameClassNames;
  /**
   * `stack` — label, control, description, issue (default).
   * `choice` — control, then label / description / issue (checkbox, switch).
   * `group` — `FieldSet` + legend (checkbox / radio lists).
   */
  layout?: FormFieldFrameLayout;
  orientation?: "vertical" | "horizontal" | "responsive";
  /** `false` hides. Omit for `field.label` (or the field id). */
  label?: ReactNode | false;
  /** `false` hides. Omit for `field.description` when it is a string. */
  description?: ReactNode | false;
  /** `false` hides. Omit for `field.meta.help`. */
  help?: ReactNode | false;
  /** `false` hides. Omit for the localized session issue. */
  error?: ReactNode | false;
  /**
   * Visual required mark when `binding.required`. Default `true`.
   * Mark comes from `FormUiProvider` `components.RequiredMark`, else
   * {@link RequiredMark}.
   */
  requiredIndicator?: boolean;
};

function FrameError({ id, content }: { id: string; content: ReactNode }) {
  if (!content) return null;
  return (
    <FieldError
      id={id}
      className="wrap-anywhere"
      errors={typeof content === "string" ? [{ message: content }] : undefined}
    >
      {typeof content === "string" ? undefined : content}
    </FieldError>
  );
}

/**
 * shadcn field chrome around a control. Built-in widgets use this;
 * custom widgets should too. `FormUiProvider` `components.FieldFrame`
 * replaces this; wrapping {@link FormFieldFrame} in that override is safe.
 */
function FormFieldFrameView<TValue = unknown>({
  binding,
  children,
  className,
  classNames,
  layout = "stack",
  orientation,
  label,
  description,
  help,
  error,
  requiredIndicator = true,
}: FormFieldFrameProps<TValue>) {
  const issue = useFieldIssue(binding);
  const { RequiredMark: RequiredMarkSlot } = useFormUiComponents();
  const field = binding.field;
  if (!field) return null;

  const ui = readFieldUiMeta(field);
  const resolvedOrientation = orientation ?? ui.orientation ?? "vertical";
  const invalid = binding.invalid || Boolean(issue);
  const labelId = `${field.id}-label`;
  const labelContent = label === false ? null : (label ?? fieldLabel(field));
  const descriptionContent =
    description === false
      ? null
      : (description ??
        (typeof field.description === "string" ? field.description : null));
  const helpContent = help === false ? null : (help ?? ui.help ?? null);
  const errorContent = error === false ? null : (error ?? issue ?? null);
  const Mark = RequiredMarkSlot ?? RequiredMark;
  const requiredMark =
    requiredIndicator && binding.required ? createElement(Mark) : null;
  const descriptionNode = descriptionContent ? (
    <FieldDescription
      id={fieldDescriptionId(field.id)}
      className={classNames?.description}
    >
      {descriptionContent}
    </FieldDescription>
  ) : null;
  const helpNode = helpContent ? (
    <FieldDescription
      id={fieldHelpId(field.id)}
      className={cn("text-dimah-form-muted-foreground", classNames?.help)}
    >
      {helpContent}
    </FieldDescription>
  ) : null;
  const errorNode = (
    <FrameError
      id={fieldErrorId(field.id)}
      content={
        typeof errorContent === "string" || errorContent == null ? (
          errorContent
        ) : (
          <span className={classNames?.error}>{errorContent}</span>
        )
      }
    />
  );
  const invalidProps = {
    className: cn(className, classNames?.root),
    "data-slot": "form-field-frame",
    "data-invalid": invalid || undefined,
    "data-disabled": binding.disabled || undefined,
    "data-required": binding.required || undefined,
    "data-field-type": field.type,
    "data-widget": fieldWidget(field),
  };

  if (layout === "group") {
    return (
      <FieldSet {...invalidProps}>
        {labelContent ? (
          <FieldLegend
            id={labelId}
            variant="label"
            className={classNames?.label}
          >
            {labelContent}
            {requiredMark}
          </FieldLegend>
        ) : null}
        {children}
        {descriptionNode}
        {helpNode}
        {errorNode}
      </FieldSet>
    );
  }

  if (layout === "choice") {
    return (
      <Field {...invalidProps} orientation="horizontal">
        {children}
        <FieldContent>
          {labelContent ? (
            <FieldLabel
              id={labelId}
              htmlFor={field.id}
              className={cn("font-normal", classNames?.label)}
            >
              {labelContent}
              {requiredMark}
            </FieldLabel>
          ) : null}
          {descriptionNode}
          {helpNode}
          {errorNode}
        </FieldContent>
      </Field>
    );
  }

  return (
    <Field {...invalidProps} orientation={resolvedOrientation}>
      {labelContent ? (
        <FieldLabel
          id={labelId}
          htmlFor={field.id}
          className={classNames?.label}
        >
          {labelContent}
          {requiredMark}
        </FieldLabel>
      ) : null}
      {children}
      {descriptionNode}
      {helpNode}
      {errorNode}
    </Field>
  );
}

const SkipFieldFrameOverrideContext = createContext(false);

export function FormFieldFrame<TValue = unknown>(
  props: FormFieldFrameProps<TValue>,
) {
  const skip = useContext(SkipFieldFrameOverrideContext);
  const { FieldFrame } = useFormUiComponents();
  if (!skip && FieldFrame && FieldFrame !== FormFieldFrame) {
    return (
      <SkipFieldFrameOverrideContext.Provider value={true}>
        {createElement(FieldFrame, props as FormFieldFrameProps)}
      </SkipFieldFrameOverrideContext.Provider>
    );
  }
  return <FormFieldFrameView {...props} />;
}

/** Always {@link FormFieldFrame}, which applies `components.FieldFrame`. */
export function useFieldFrame() {
  return FormFieldFrame;
}
