"use client";

import type { FormSnapshot, ResponseRecord } from "@dimah-form/react";
import { FormRoot, FormView } from "@dimah-form/ui";
import { useRouter } from "next/navigation";

import { AnswersPreview } from "@/components/answers-preview";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { respondentId, useFormResponse } from "@/lib/client";
import type { Form } from "@/lib/form";

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
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <FormRoot>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1.5">
                    <CardTitle>{form.title}</CardTitle>
                    <CardDescription>
                      {form.description ??
                        `${form.slug} · widgets are yours, validation is the snapshot`}
                    </CardDescription>
                  </div>
                  {saveState}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {status}
                {progress}
                {errorSummary}
                {stepList}
                {stepHeading}
                {fields}
                {error}
              </CardContent>
              <CardFooter className="flex flex-col items-stretch gap-3">
                {actions}
              </CardFooter>
            </Card>
          </FormRoot>
          <div className="lg:sticky lg:top-6">
            <AnswersPreview
              form={session.snapshot}
              answers={session.answers}
              status={session.status}
            />
          </div>
        </div>
      )}
    />
  );
}
