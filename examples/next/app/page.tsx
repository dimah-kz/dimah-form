"use client";

import { useFormClient } from "@dimah-form/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { FormSnapshot } from "@dimah-form/core";
import { formatFormError } from "@/lib/format-error";

export default function Page() {
  const client = useFormClient();
  const [forms, setForms] = useState<FormSnapshot[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    client
      .listForms({ status: "active" })
      .then((page) => setForms(page.forms))
      .catch((caught: unknown) =>
        setError(
          formatFormError(caught, "Could not load forms. Did you run db:push?"),
        ),
      );
  }, [client]);

  return (
    <div className="grid gap-4 text-sm">
      <div>
        <h1 className="font-medium">Questionnaires</h1>
        <p className="text-muted-foreground">
          Active forms only. Code-authored onboarding plus dynamic forms from
          Admin. Inactive forms stay in the catalog but cannot be started.
        </p>
      </div>
      {error ? <p className="text-destructive">{error}</p> : null}
      <ul className="grid gap-2">
        {forms.map((form) => (
          <li key={form.id}>
            <Link className="underline" href={`/f/${form.slug}`}>
              {form.title}
            </Link>
            <span className="ms-2 text-muted-foreground">
              /{form.slug} · {form.status}
            </span>
          </li>
        ))}
      </ul>
      <p className="font-mono text-xs text-muted-foreground">
        Press <kbd>d</kbd> to toggle dark mode
      </p>
    </div>
  );
}
