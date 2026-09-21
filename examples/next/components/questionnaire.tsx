"use client";

import type { FormSnapshot, ResponseRecord } from "@dimah-form/react";
import { FormActions, FormRoot, FormView } from "@dimah-form/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AnswersPreview } from "@/components/answers-preview";
import { ScoresPreview } from "@/components/scores-preview";
import { buttonVariants } from "@/components/ui/button";
import { respondentId, useFormResponse } from "@/lib/client";
import { PULSE_FORM_ID } from "@/lib/forms";
import type { Form } from "@/lib/form";
import { cn } from "@/lib/utils";

type CatalogKey = keyof Form["$Infer"]["answers"];

export function Questionnaire({
  form,
  response,
}: {
  form: FormSnapshot;
  response?: ResponseRecord;
}) {
  const router = useRouter();
  const session = useFormResponse<CatalogKey>({
    snapshot: form,
    response,
    respondentId,
    resume: true,
    autosave: true,
    onSaved: (row) => {
      if (!response) router.replace(`/r/${row.id}`);
    },
    onSubmitted: (row) => {
      if (!response) router.replace(`/r/${row.id}`);
    },
  });

  return (
    <FormView
      form={session}
      header={false}
      render={({
        status,
        progress,
        errorSummary,
        stepList,
        stepHeading,
        fields,
        error,
        saveState,
        actions,
      }) => (
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <FormRoot className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-2">
                  <h1 className="text-2xl font-medium tracking-tight text-balance">
                    {form.title}
                  </h1>
                  {form.description ? (
                    <p className="max-w-prose text-sm leading-relaxed text-pretty text-muted-foreground">
                      {form.description}
                    </p>
                  ) : null}
                </div>
                {saveState}
              </div>
              {stepList}
            </div>
            {status}
            {progress}
            {errorSummary}
            {stepHeading}
            {fields}
            {error}
            <div className="flex flex-col gap-3">
              {actions}
              {session.locked ? (
                <Link
                  href={`/f/${PULSE_FORM_ID}`}
                  className={cn(
                    buttonVariants({ size: "sm", variant: "ghost" }),
                    "self-end",
                  )}
                >
                  New check-in
                </Link>
              ) : null}
            </div>
          </FormRoot>
          <div className="flex flex-col gap-8 border-t pt-8 lg:sticky lg:top-6 lg:border-s lg:border-t-0 lg:ps-8 lg:pt-0">
            <ScoresPreview form={session.snapshot} answers={session.answers} />
            <AnswersPreview
              form={session.snapshot}
              answers={session.answers}
              status={session.status}
            />
          </div>
        </div>
      )}
      actions={<FormActions abandon />}
    />
  );
}
