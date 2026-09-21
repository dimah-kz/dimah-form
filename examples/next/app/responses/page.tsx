import type { InsightsSummary } from "@dimah-form/insights";
import {
  hasScoringMeta,
  scoreResponse,
  type ScoreResult,
} from "@dimah-form/scoring";
import type { ResponseRecord } from "@dimah-form/server";
import { InboxIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import {
  InsightsPanel,
  StatusCounts,
  insightsWithoutScoredFields,
} from "@/components/insights-panel";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { form } from "@/lib/form";
import { formatDateTime, scoreLabel } from "@/lib/format";
import { PULSE_FORM_ID } from "@/lib/forms";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Responses",
};

function isFull(row: { answers?: unknown }): row is ResponseRecord {
  return "answers" in row;
}

function downloadHref(
  formId: string,
  format: "jsonl" | "csv" | "labels" | "codebook",
) {
  return `/api/forms/${encodeURIComponent(formId)}/package?format=${format}`;
}

function pulseScore(row: ResponseRecord): ScoreResult | null {
  if (!hasScoringMeta(row.definition)) return null;
  try {
    return scoreResponse(row.definition, row.answers);
  } catch {
    return null;
  }
}

function respondentName(row: ResponseRecord) {
  const name = row.answers.name;
  return typeof name === "string" && name.trim() !== "" ? name.trim() : row.id;
}

const downloads = [
  { format: "jsonl" as const, label: "JSONL" },
  { format: "csv" as const, label: "CSV" },
  { format: "labels" as const, label: "Labels CSV" },
  { format: "codebook" as const, label: "Codebook" },
];

export default async function ResponsesPage() {
  let rows: ResponseRecord[] | undefined;
  let total = 0;
  let allInsights: InsightsSummary | undefined;
  let submittedInsights: InsightsSummary | undefined;

  try {
    const [{ responses, total: listedTotal }, snapshot, all, submitted] =
      await Promise.all([
        form.api.listResponses({
          query: { formId: PULSE_FORM_ID, include: "full", limit: 20 },
        }),
        form.api.getForm({ query: { formId: PULSE_FORM_ID } }),
        form.api.getFormInsights({ query: { formId: PULSE_FORM_ID } }),
        form.api.getFormInsights({
          query: { formId: PULSE_FORM_ID, status: "submitted" },
        }),
      ]);
    rows = responses.filter(isFull);
    total = listedTotal;
    allInsights = all;
    submittedInsights = insightsWithoutScoredFields(submitted, snapshot.fields);
  } catch {
    rows = undefined;
  }

  if (!rows) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load responses. Run{" "}
        <code className="font-mono text-xs">
          pnpm --filter @dimah-form/example-next db:push
        </code>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-medium tracking-tight">Responses</h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          {total} stored {total === 1 ? "response" : "responses"}. Insights
          below use submitted rows. Downloads are a consumer route over the
          dataset plugin — not a library zip.
        </p>
      </div>

      {allInsights ? <StatusCounts summary={allInsights} /> : null}

      {submittedInsights && submittedInsights.completion.submitted > 0 ? (
        <InsightsPanel summary={submittedInsights} />
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Dataset</h2>
        <div className="flex flex-wrap gap-2">
          {downloads.map((item) => (
            <Link
              key={item.format}
              href={downloadHref(PULSE_FORM_ID, item.format)}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      {rows.length === 0 ? (
        <Empty className="border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>No responses yet</EmptyTitle>
            <EmptyDescription>
              Submit a check-in. Drafts, scores, and exports show up here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link
              href={`/f/${PULSE_FORM_ID}`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Start check-in
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Recent</h2>
          <ul className="flex flex-col">
            {rows.map((row) => {
              const scores = pulseScore(row);
              const pulse = scores?.variables.pulse;
              const totalLabel = pulse
                ? scoreLabel(pulse.raw, pulse.max)
                : null;
              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b py-4 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">
                        {respondentName(row)}
                      </p>
                      <StatusBadge status={row.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(row.updatedAt)}
                      {pulse?.band ? ` · ${pulse.band}` : ""}
                      {totalLabel ? ` · ${totalLabel}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/r/${row.id}`}
                    className={buttonVariants({
                      size: "sm",
                      variant: "outline",
                    })}
                  >
                    Open
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
