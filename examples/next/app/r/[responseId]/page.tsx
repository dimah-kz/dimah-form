"use client";

import { useFormClient } from "@dimah-form/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Questionnaire } from "@/components/questionnaire";
import { formatFormError } from "@/lib/format-error";
import type { FormSnapshot, ResponseRecord } from "@dimah-form/core";

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

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!row) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return <LoadedQuestionnaire definition={row.definition} response={row} />;
}

function LoadedQuestionnaire({
  definition,
  response,
}: {
  definition: FormSnapshot;
  response: ResponseRecord;
}) {
  return (
    <Questionnaire
      form={definition}
      responseId={response.id}
      initialAnswers={response.answers}
      initialStatus={response.status}
      initialUpdatedAt={response.updatedAt}
    />
  );
}
