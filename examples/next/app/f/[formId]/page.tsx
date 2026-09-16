"use client";

import { useFormClient } from "@dimah-form/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Questionnaire } from "@/components/questionnaire";
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

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return <Questionnaire form={form} />;
}
