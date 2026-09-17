"use client";

import { type FormSnapshot, type ResponseRecord } from "@dimah-form/react";
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { AnswersPreview } from "@/components/answers-preview";
import { FormFields } from "@/components/fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { respondentId, useFormResponse } from "@/lib/client";

export function Questionnaire({
  form,
  response,
}: {
  form: FormSnapshot;
  response?: ResponseRecord;
}) {
  const router = useRouter();
  const q = useFormResponse({
    snapshot: form,
    response,
    respondentId,
    onSaved: (row) => {
      if (!response) router.replace(`/r/${row.id}`);
    },
    onSubmitted: (row) => {
      if (!response) router.replace(`/r/${row.id}`);
    },
  });

  if (q.inactive) {
    return (
      <Alert>
        <CircleAlertIcon />
        <AlertTitle>{form.title}</AlertTitle>
        <AlertDescription>
          Status is {form.status}. New responses start only on active forms.
        </AlertDescription>
      </Alert>
    );
  }

  const busy = q.pending != null;

  return (
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
          {q.status === "submitted" ? (
            <Alert>
              <CircleCheckIcon />
              <AlertTitle>Submitted</AlertTitle>
              <AlertDescription>
                Response <span className="font-mono">{q.responseId}</span>
              </AlertDescription>
            </Alert>
          ) : null}
          {q.status === "abandoned" ? (
            <Alert>
              <CircleAlertIcon />
              <AlertTitle>Abandoned</AlertTitle>
              <AlertDescription>This draft is closed.</AlertDescription>
            </Alert>
          ) : null}
          <FormFields form={q} />
          {q.error ? (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>{q.error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        {q.locked ? (
          <CardFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy || !q.responseId}
              onClick={() => void q.reopen()}
            >
              {q.pending === "reopen" ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              Edit
            </Button>
          </CardFooter>
        ) : (
          <CardFooter className="gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={() => void q.submit()}
            >
              {q.pending === "submit" ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              Submit
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void q.saveDraft()}
            >
              {q.pending === "save" ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              Save draft
            </Button>
          </CardFooter>
        )}
      </Card>
      <div className="lg:sticky lg:top-6">
        <AnswersPreview
          form={q.snapshot}
          answers={q.answers}
          status={q.status}
        />
      </div>
    </div>
  );
}
