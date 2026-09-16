"use client";

import type { FormSnapshot } from "@dimah-form/core";
import { useFormClient } from "@dimah-form/react";
import { FileTextIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { formatFormError } from "@/lib/format-error";

export default function Page() {
  const client = useFormClient();
  const [forms, setForms] = useState<FormSnapshot[]>();
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

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load forms</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!forms) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Loading forms
      </div>
    );
  }

  if (!forms.length) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileTextIcon />
          </EmptyMedia>
          <EmptyTitle>No active forms</EmptyTitle>
          <EmptyDescription>
            Run db:push, then the code-authored onboarding form should appear.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-medium">Forms</h1>
        <p className="text-sm text-muted-foreground">
          Active questionnaires. Open one to fill, save a draft, and submit.
        </p>
      </div>
      <ul className="grid gap-3">
        {forms.map((form) => (
          <li key={form.id}>
            <Card size="sm">
              <CardHeader>
                <CardTitle>{form.title}</CardTitle>
                <CardDescription>
                  /{form.slug} · {form.fields.length} fields
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href={`/f/${form.slug}`} className={buttonVariants()}>
                  Open
                </Link>
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
