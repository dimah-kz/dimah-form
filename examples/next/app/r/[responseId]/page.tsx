"use client";

import type { ResponseRecord } from "@dimah-form/core";
import { useFormClient } from "@dimah-form/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Questionnaire } from "@/components/questionnaire";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { formatFormError } from "@/lib/format-error";

export default function ResponsePage() {
  const params = useParams<{ responseId: string }>();
  const client = useFormClient();
  const [row, setRow] = useState<ResponseRecord>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    client
      .getResponse({ responseId: params.responseId })
      .then(setRow)
      .catch((caught: unknown) =>
        setError(formatFormError(caught, "Unknown response")),
      );
  }, [client, params.responseId]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unknown response</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!row) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Loading response
      </div>
    );
  }

  return (
    <Questionnaire
      form={row.definition}
      responseId={row.id}
      initialAnswers={row.answers}
      initialStatus={row.status}
      initialUpdatedAt={row.updatedAt}
    />
  );
}
