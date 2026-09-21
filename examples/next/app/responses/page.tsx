import type { ResponseRecord } from "@dimah-form/server";
import Link from "next/link";

import { AnswersPreview } from "@/components/answers-preview";
import { buttonVariants } from "@/components/ui/button";
import { form } from "@/lib/form";

function isFull(row: { answers?: unknown }): row is ResponseRecord {
  return "answers" in row;
}

function downloadHref(formId: string, format: "jsonl" | "csv" | "labels") {
  return `/api/forms/${encodeURIComponent(formId)}/package?format=${format}`;
}

export default async function ResponsesPage() {
  let rows: ResponseRecord[] | undefined;
  let forms: { id: string; title: string }[] = [];
  try {
    const [{ responses }, listed] = await Promise.all([
      form.api.listResponses({
        query: { include: "full", limit: 20 },
      }),
      form.api.listForms({}),
    ]);
    rows = responses.filter(isFull);
    forms = listed.forms.map((item) => ({ id: item.id, title: item.title }));
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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-medium">Responses</h1>
        <p className="text-sm text-muted-foreground">
          Full records, including the definition snapshot and answers. Downloads
          are JSONL (canonical) or CSV from the dataset reader — submitted
          responses only.
        </p>
      </div>
      {forms.length > 0 ? (
        <ul className="grid gap-2 text-sm">
          {forms.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span>{item.title}</span>
              <span className="flex flex-wrap gap-2">
                <Link
                  href={downloadHref(item.id, "jsonl")}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  JSONL
                </Link>
                <Link
                  href={downloadHref(item.id, "csv")}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  CSV
                </Link>
                <Link
                  href={downloadHref(item.id, "labels")}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  Labels CSV
                </Link>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No responses yet. Submit a form, then stored answers show up here.
        </p>
      ) : (
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
      )}
    </div>
  );
}
