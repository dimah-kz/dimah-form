"use client";

import type { FormSnapshot, ResponseRecord } from "@dimah-form/react";
import {
  FormActions,
  FormError,
  FormFields,
  FormInactive,
  FormRoot,
  FormScope,
  FormStatus,
} from "@dimah-form/ui";
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

export function Questionnaire({
  form,
  response,
}: {
  form: FormSnapshot;
  response?: ResponseRecord;
}) {
  const router = useRouter();
  const q = useFormResponse<Form["$Infer"]["answers"]["feedback"]>({
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
    <FormScope form={q}>
      {q.inactive ? (
        <FormInactive />
      ) : (
        <FormRoot>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <Card>
              <CardHeader>
                <CardTitle>{form.title}</CardTitle>
                <CardDescription>
                  {form.description ??
                    `${form.slug} · widgets are yours, validation is the snapshot`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <FormStatus />
                <FormFields />
                <FormError />
              </CardContent>
              <CardFooter>
                <FormActions className="w-full" />
              </CardFooter>
            </Card>
            <div className="lg:sticky lg:top-6">
              <AnswersPreview
                form={q.snapshot}
                answers={q.answers}
                status={q.status}
              />
            </div>
          </div>
        </FormRoot>
      )}
    </FormScope>
  );
}
