"use client";

import type { ComponentProps, ReactNode } from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useFormSession } from "@/components/dimah-form/form-context";
import { useFormUi } from "@/hooks/use-form-ui";

type ActionButtonProps = ComponentProps<typeof Button>;

export type FormActionsClassNames = {
  root?: string;
  save?: string;
  submit?: string;
  edit?: string;
  abandon?: string;
};

export type FormActionsProps<TAnswers extends FormAnswers = FormAnswers> = Omit<
  useRender.ComponentProps<"div">,
  "children"
> & {
  form?: FormResponseApi<TAnswers>;
  /** Replace the default save / submit / edit controls. */
  children?: ReactNode;
  /** Rendered before the default controls (kept when `children` is omitted). */
  before?: ReactNode;
  /** Rendered after the default controls. */
  after?: ReactNode;
  /**
   * Draft save button. `"auto"` (default) hides it when the session autosaves.
   * `false` always hides. `true` always shows (while unlocked).
   */
  save?: boolean | "auto";
  /** Abandoned-response control. Off by default. */
  abandon?: boolean;
  /** Stick the bar to the bottom of the viewport. */
  sticky?: boolean;
  classNames?: FormActionsClassNames;
  saveProps?: ActionButtonProps;
  submitProps?: ActionButtonProps;
  editProps?: ActionButtonProps;
  abandonProps?: ActionButtonProps;
};

/** Save + submit, or Edit when the response is locked. */
export function FormActions<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
  children,
  before,
  after,
  save = "auto",
  abandon = false,
  sticky = false,
  classNames,
  saveProps,
  submitProps,
  editProps,
  abandonProps,
  render,
  ...props
}: FormActionsProps<TAnswers>) {
  const session = useFormSession(form);
  const ui = useFormUi(session);
  const showSave = save === true || (save === "auto" && !session.autosave);

  const controls =
    children ??
    (session.locked ? (
      <Button
        {...mergeProps(
          {
            type: "button",
            variant: "outline",
            disabled: ui.busy || !session.responseId,
            className: classNames?.edit,
            onClick: () => void session.reopen(),
          },
          editProps,
        )}
      >
        {session.pending === "reopen" ? (
          <Spinner data-icon="inline-start" />
        ) : null}
        {ui.editLabel}
      </Button>
    ) : (
      <>
        {showSave ? (
          <Button
            {...mergeProps(
              {
                type: "button",
                variant: "outline",
                disabled: ui.busy,
                className: classNames?.save,
                onClick: () => void session.saveDraft(),
              },
              saveProps,
            )}
          >
            {session.pending === "save" ? (
              <Spinner data-icon="inline-start" />
            ) : null}
            {ui.saveLabel}
          </Button>
        ) : null}
        {abandon ? (
          <Button
            {...mergeProps(
              {
                type: "button",
                variant: "ghost",
                disabled: ui.busy || !session.responseId,
                className: classNames?.abandon,
                onClick: () => void session.abandon(),
              },
              abandonProps,
            )}
          >
            {session.pending === "abandon" ? (
              <Spinner data-icon="inline-start" />
            ) : null}
            {ui.abandonLabel}
          </Button>
        ) : null}
        <Button
          {...mergeProps(
            {
              type: "submit",
              disabled: ui.busy,
              className: classNames?.submit,
            },
            submitProps,
          )}
        >
          {session.pending === "submit" ? (
            <Spinner data-icon="inline-start" />
          ) : null}
          {ui.submitLabel}
        </Button>
      </>
    ));

  return useRender({
    defaultTagName: "div",
    render: render ?? <Field orientation="horizontal" />,
    state: { slot: "form-actions" },
    props: mergeProps<"div">(
      {
        className: cn(
          "flex-wrap justify-end",
          sticky &&
            "bottom-0 py-3 backdrop-blur-sm sticky z-10 bg-dimah-form-background/95",
          className,
          classNames?.root,
        ),
        children: (
          <>
            {before}
            {controls}
            {after}
          </>
        ),
      },
      props,
    ),
  });
}
