"use client";

import { useFormClient } from "@dimah-form/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Questionnaire } from "@/components/questionnaire";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { formatFormError } from "@/lib/format-error";
import type { FormSnapshot } from "@dimah-form/core";

export default function FormPage() {
  const params = useParams<{ formId: string }>();
  const client = useFormClient();
  const [form, setForm] = useState<FormSnapshot>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    client
      .getForm({ formId: params.formId })
      .then(setForm)
      .catch((caught: unknown) =>
        setError(formatFormError(caught, "Unknown form")),
      );
  }, [client, params.formId]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unknown form</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Loading form
      </div>
    );
  }

  return <Questionnaire form={form} />;
}
