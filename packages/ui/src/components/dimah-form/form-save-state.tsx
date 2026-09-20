"use client";

import type { ComponentProps, ReactNode } from "react";
import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";
import { CheckIcon, ClockIcon } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useFormSession } from "@/components/dimah-form/form-context";

export type FormSaveStateKind = "saving" | "dirty" | "saved";

export type FormSaveStateClassNames = {
  badge?: string;
  icon?: string;
} & Partial<Record<FormSaveStateKind, string>>;

export type FormSaveStateIcons = Partial<Record<FormSaveStateKind, ReactNode>>;

export type FormSaveStateProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  className?: string;
  classNames?: FormSaveStateClassNames;
  variant?: ComponentProps<typeof Badge>["variant"];
  icons?: FormSaveStateIcons;
};

const SAVE_STATE_VARIANT: Record<
  FormSaveStateKind,
  NonNullable<ComponentProps<typeof Badge>["variant"]>
> = {
  saving: "secondary",
  dirty: "outline",
  saved: "secondary",
};

/** Draft persistence hint. `Saved` when autosave is on and the draft is clean. */
export function FormSaveState<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
  classNames,
  variant,
  icons,
}: FormSaveStateProps<TAnswers>) {
  const session = useFormSession(form);
  const t = useTranslations();

  if (session.pending === "save") {
    return (
      <SaveStateBadge
        state="saving"
        variant={variant}
        className={className}
        classNames={classNames}
        icon={
          icons?.saving ?? (
            <Spinner
              data-icon="inline-start"
              className={cn("size-3", classNames?.icon)}
            />
          )
        }
      >
        {t("Saving…", { note: "form action" })}
      </SaveStateBadge>
    );
  }

  if (session.dirty) {
    return (
      <SaveStateBadge
        state="dirty"
        variant={variant}
        className={className}
        classNames={classNames}
        icon={
          icons?.dirty ?? (
            <ClockIcon aria-hidden className={cn("size-3", classNames?.icon)} />
          )
        }
      >
        {t("Unsaved changes", { note: "save state" })}
      </SaveStateBadge>
    );
  }

  if (session.autosave && session.responseId) {
    return (
      <SaveStateBadge
        state="saved"
        variant={variant}
        className={className}
        classNames={classNames}
        icon={
          icons?.saved ?? (
            <CheckIcon
              aria-hidden
              className={cn("size-3 text-dimah-form-primary", classNames?.icon)}
            />
          )
        }
      >
        {t("Saved", { note: "save state" })}
      </SaveStateBadge>
    );
  }

  return null;
}

function SaveStateBadge({
  state,
  variant,
  className,
  classNames,
  icon,
  children,
}: {
  state: FormSaveStateKind;
  variant: FormSaveStateProps["variant"];
  className?: string;
  classNames?: FormSaveStateClassNames;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Badge
      variant={variant ?? SAVE_STATE_VARIANT[state]}
      data-slot="form-save-state"
      data-state={state}
      className={cn(
        "gap-1 text-xs font-normal",
        state !== "saving" && "text-dimah-form-muted-foreground",
        className,
        classNames?.badge,
        classNames?.[state],
      )}
      aria-live="polite"
    >
      {icon}
      <span>{children}</span>
    </Badge>
  );
}
