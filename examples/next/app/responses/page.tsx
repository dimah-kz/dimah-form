import type { InsightsSummary } from "@dimah-form/insights";
import type { ResponseRecord } from "@dimah-form/server";
import Link from "next/link";

import { AnswersPreview } from "@/components/answers-preview";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { form } from "@/lib/form";

function isFull(row: { answers?: unknown }): row is ResponseRecord {
  return "answers" in row;
}

function downloadHref(
  formId: string,
  format: "jsonl" | "csv" | "labels" | "codebook",
) {
  return `/api/forms/${encodeURIComponent(formId)}/package?format=${format}`;
}

function statusLine(summary: InsightsSummary) {
  return `${summary.byStatus.draft} draft · ${summary.byStatus.submitted} submitted · ${summary.byStatus.abandoned} abandoned · ${summary.completion.complete}/${summary.completion.submitted} complete`;
}

function fieldLines(summary: InsightsSummary) {
  return summary.fields
    .filter((field) => (field.values?.length ?? 0) > 0)
    .slice(0, 4)
    .map((field) => {
      const values = (field.values ?? [])
        .slice(0, 3)
        .map((item) => `${item.label ?? item.value} ${item.n}`)
        .join(", ");
      return `${field.label}: ${values}`;
    });
}

function scoreLines(summary: InsightsSummary) {
  return (summary.scores?.variables ?? []).map((variable) => {
    const bands = (variable.bands ?? [])
      .map((band) => `${band.label} ${band.n}`)
      .join(" · ");
    const name = variable.label ?? variable.id;
    return bands ? `${name}: ${bands}` : name;
  });
}

export default async function ResponsesPage() {
  let rows: ResponseRecord[] | undefined;
  let forms: { id: string; title: string; insights?: InsightsSummary }[] = [];
  let total = 0;
  try {
    const [{ responses, total: listedTotal }, listed] = await Promise.all([
      form.api.listResponses({
        query: { include: "full", limit: 20 },
      }),
      form.api.listForms({}),
    ]);
    rows = responses.filter(isFull);
    total = listedTotal;
    forms = await Promise.all(
      listed.forms.map(async (item) => {
        try {
          const insights = await form.api.getFormInsights({
            query: { formId: item.id, status: "submitted" },
          });
          return { id: item.id, title: item.title, insights };
        } catch {
          return { id: item.id, title: item.title };
        }
      }),
    );
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
          {total} stored response{total === 1 ? "" : "s"} (this page shows up to
          20). Insights and downloads below are submitted rows only.
        </p>
      </div>
      {forms.length > 0 ? (
        <ul className="grid gap-4">
          {forms.map((item) => {
            const extras = item.insights
              ? [...fieldLines(item.insights), ...scoreLines(item.insights)]
              : [];
            return (
              <li key={item.id}>
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>
                      {item.insights
                        ? statusLine(item.insights)
                        : "Insights unavailable"}
                    </CardDescription>
                  </CardHeader>
                  {extras.length > 0 ? (
                    <CardContent>
                      <ul className="grid gap-1 text-sm text-muted-foreground">
                        {extras.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </CardContent>
                  ) : null}
                  <CardFooter className="flex flex-wrap gap-2">
                    <Link
                      href={downloadHref(item.id, "jsonl")}
                      className={buttonVariants({
                        size: "sm",
                        variant: "outline",
                      })}
                    >
                      JSONL
                    </Link>
                    <Link
                      href={downloadHref(item.id, "csv")}
                      className={buttonVariants({
                        size: "sm",
                        variant: "outline",
                      })}
                    >
                      CSV
                    </Link>
                    <Link
                      href={downloadHref(item.id, "labels")}
                      className={buttonVariants({
                        size: "sm",
                        variant: "outline",
                      })}
                    >
                      Labels CSV
                    </Link>
                    <Link
                      href={downloadHref(item.id, "codebook")}
                      className={buttonVariants({
                        size: "sm",
                        variant: "outline",
                      })}
                    >
                      Codebook
                    </Link>
                  </CardFooter>
                </Card>
              </li>
            );
          })}
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
