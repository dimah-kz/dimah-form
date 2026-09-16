"use client";

import {
  applyAnswerPatch,
  collectAnswerIssues,
  seedDefaultAnswers,
  type FormAnswers,
  type FormSnapshot,
  type ResponseStatus,
} from "@dimah-form/react";
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
import { formClient, respondentId } from "@/lib/client";
import { formErrorMessage, formIssues } from "@/lib/format-error";

export function Questionnaire({
  form,
  responseId,
  initialAnswers,
  initialStatus = "draft",
  initialUpdatedAt,
}: {
  form: FormSnapshot;
  responseId?: string;
  initialAnswers?: FormAnswers;
  initialStatus?: ResponseStatus;
  initialUpdatedAt?: string;
}) {
  const client = formClient.useFormClient();
  const router = useRouter();
  const [id, setId] = useState(responseId);
  const [answers, setAnswers] = useState<FormAnswers>(
    () => initialAnswers ?? seedDefaultAnswers(form),
  );
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string>();
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<"save" | "submit">();

  const locked = status === "submitted" || status === "abandoned";

  function fail(caught: unknown, fallback: string) {
    const nextIssues = formIssues(caught);
    if (Object.keys(nextIssues).length) {
      setIssues(nextIssues);
      setError(undefined);
      return;
    }
    setIssues({});
    setError(formErrorMessage(caught, fallback));
  }

  async function ensureResponse() {
    if (id) return { responseId: id, updatedAt };
    const started = await client.startResponse({
      formId: form.id,
      respondentId: respondentId(),
    });
    setId(started.id);
    setUpdatedAt(started.updatedAt);
    return { responseId: started.id, updatedAt: started.updatedAt };
  }

  async function onSave() {
    setBusy("save");
    setError(undefined);
    try {
      const current = await ensureResponse();
      const saved = await client.saveDraft({
        responseId: current.responseId,
        answers,
        updatedAt: current.updatedAt,
      });
      setUpdatedAt(saved.updatedAt);
      setStatus(saved.status);
      setIssues({});
      if (!responseId) router.replace(`/r/${saved.id}`);
    } catch (caught) {
      fail(caught, "Could not save draft");
    } finally {
      setBusy(undefined);
    }
  }

  async function onSubmit() {
    setBusy("submit");
    setError(undefined);
    const localIssues = collectAnswerIssues(form, answers, "submit");
    if (localIssues.length) {
      setIssues(
        Object.fromEntries(
          localIssues.map((issue) => [issue.field, issue.message]),
        ),
      );
      setBusy(undefined);
      return;
    }
    try {
      const current = await ensureResponse();
      const submitted = await client.submitResponse({
        responseId: current.responseId,
        answers,
        updatedAt: current.updatedAt,
      });
      setStatus(submitted.status);
      setUpdatedAt(submitted.updatedAt);
      setIssues({});
      if (!responseId) router.replace(`/r/${submitted.id}`);
    } catch (caught) {
      fail(caught, "Could not submit");
    } finally {
      setBusy(undefined);
    }
  }

  if (!id && form.status !== "active") {
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

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          <CardDescription>
            {typeof form.description === "string"
              ? form.description
              : `${form.slug} · widgets are yours, validation is the snapshot`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {status === "submitted" ? (
            <Alert>
              <CircleCheckIcon />
              <AlertTitle>Submitted</AlertTitle>
              <AlertDescription>
                Response <span className="font-mono">{id}</span>
              </AlertDescription>
            </Alert>
          ) : null}
          {status === "abandoned" ? (
            <Alert>
              <CircleAlertIcon />
              <AlertTitle>Abandoned</AlertTitle>
              <AlertDescription>This draft is closed.</AlertDescription>
            </Alert>
          ) : null}
          <FormFields
            fields={form.fields}
            answers={answers}
            issues={issues}
            disabled={locked || busy != null}
            onChange={(fieldId, value) =>
              setAnswers((current) =>
                applyAnswerPatch(current, { [fieldId]: value }),
              )
            }
          />
          {error ? (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        {locked ? null : (
          <CardFooter className="gap-2">
            <Button
              type="button"
              disabled={busy != null}
              onClick={() => void onSubmit()}
            >
              {busy === "submit" ? <Spinner data-icon="inline-start" /> : null}
              Submit
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy != null}
              onClick={() => void onSave()}
            >
              {busy === "save" ? <Spinner data-icon="inline-start" /> : null}
              Save draft
            </Button>
          </CardFooter>
        )}
      </Card>
      <div className="lg:sticky lg:top-6">
        <AnswersPreview form={form} answers={answers} status={status} />
      </div>
    </div>
  );
}
