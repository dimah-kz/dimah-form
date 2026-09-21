import type { Metadata } from "next";
import Link from "next/link";

import {
  InsightsPanel,
  StatusCounts,
  insightsWithoutScoredFields,
} from "@/components/insights-panel";
import { buttonVariants } from "@/components/ui/button";
import { form } from "@/lib/form";
import { PULSE_FORM_ID } from "@/lib/forms";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Overview",
};

const wiring = [
  ["lib/forms/pulse.ts", "Code-authored form, Likert scoring, showWhen"],
  ["lib/field-types.ts", "Custom rating validator + $Infer"],
  ["lib/form.ts", "dimahForm() + scoring, dataset, insights plugins"],
  ["lib/client.ts", "createFormClient with matching client plugins"],
];

export default async function Page() {
  let title = "Weekly pulse";
  let insights;
  let dbReady = true;

  try {
    const snapshot = await form.api.getForm({
      query: { formId: PULSE_FORM_ID },
    });
    title = snapshot.title;
    insights = insightsWithoutScoredFields(
      await form.api.getFormInsights({
        query: { formId: PULSE_FORM_ID },
      }),
      snapshot.fields,
    );
  } catch {
    dbReady = false;
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="flex max-w-xl flex-col gap-5">
        <p className="text-sm text-muted-foreground">Example app</p>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-medium tracking-tight text-balance">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
            One scored check-in. Fill it, watch the live score, then inspect the
            stored row. Canonical Next.js workspace demo.
          </p>
        </div>
        {dbReady ? (
          <div className="flex flex-wrap gap-2">
            <Link href={`/f/${PULSE_FORM_ID}`} className={buttonVariants()}>
              Start check-in
            </Link>
            <Link
              href="/responses"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Responses
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Could not load the form. Run{" "}
            <code className="font-mono text-xs">
              pnpm --filter @dimah-form/example-next db:push
            </code>
            .
          </p>
        )}
      </section>

      <section className="grid gap-10 border-t pt-10 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">What to look at</h2>
          <ul className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
            <li>Autosave drafts, then submit against the response snapshot.</li>
            <li>
              Pulse score updates from{" "}
              <code className="font-mono text-xs">meta.scoring</code> — it is
              not an answer.
            </li>
            <li>
              Team appears only when role is Engineer (
              <code className="font-mono text-xs">showWhen</code>).
            </li>
            <li>
              Stars are a custom{" "}
              <code className="font-mono text-xs">rating</code> type, not a
              library widget.
            </li>
            <li>
              Reopen a submitted row, or abandon a draft, from the same session.
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Source</h2>
          <ul className="flex flex-col gap-2">
            {wiring.map(([file, note]) => (
              <li key={file} className="flex flex-col gap-0.5">
                <code className="font-mono text-xs">{file}</code>
                <span className="text-sm text-muted-foreground">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {insights && insights.total > 0 ? (
        <section className="flex flex-col gap-6 border-t pt-10">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium">Live insights</h2>
            <p className="text-sm text-muted-foreground">
              Read-side counts from stored snapshots.
            </p>
          </div>
          <StatusCounts summary={insights} />
          <InsightsPanel summary={insights} />
        </section>
      ) : null}
    </div>
  );
}
