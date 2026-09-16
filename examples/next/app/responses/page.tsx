import type { ResponseRecord } from "@dimah-form/server";
import Link from "next/link";

import { AnswersPreview } from "@/components/answers-preview";
import { buttonVariants } from "@/components/ui/button";
import { form } from "@/lib/form";

function isFull(row: { answers?: unknown }): row is ResponseRecord {
  return "answers" in row;
}

export default async function ResponsesPage() {
  let rows: ResponseRecord[] | undefined;
  try {
    const { responses } = await form.api.listResponses({
      query: { include: "full", limit: 20 },
    });
    rows = responses.filter(isFull);
  } catch {
    rows = undefined;
  }

  if (!rows) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load responses. Did you run <code>db:push</code>?
      </p>
    );
  }

  if (!rows.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No responses yet. Submit a form, then stored answers show up here.
      </p>
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
