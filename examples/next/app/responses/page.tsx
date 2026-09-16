"use client";

import type { ResponseRecord } from "@dimah-form/core";
import { useFormClient } from "@dimah-form/react";
import { InboxIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AnswersPreview } from "@/components/answers-preview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { formatFormError } from "@/lib/format-error";

function isFull(row: {
  answers?: unknown;
  definition?: unknown;
}): row is ResponseRecord {
  return "answers" in row && "definition" in row;
}

export default function ResponsesPage() {
  const client = useFormClient();
  const [rows, setRows] = useState<ResponseRecord[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    client
      .listResponses({ include: "full", limit: 20 })
      .then((page) => setRows(page.responses.filter(isFull)))
      .catch((caught: unknown) =>
        setError(formatFormError(caught, "Could not load responses")),
      );
  }, [client]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load responses</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!rows) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Loading responses
      </div>
    );
  }

  if (!rows.length) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon />
          </EmptyMedia>
          <EmptyTitle>No responses yet</EmptyTitle>
          <EmptyDescription>
            Submit a form, then the stored answers show up here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-medium">Responses</h1>
        <p className="text-sm text-muted-foreground">
          Full records, including the definition snapshot and answers.
        </p>
      </div>
      <ul className="grid gap-4">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs text-muted-foreground">
                {row.id}
              </p>
              <Link
                href={`/r/${row.id}`}
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                Open
              </Link>
            </div>
            <AnswersPreview
              form={row.definition}
              answers={row.answers}
              status={row.status}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
