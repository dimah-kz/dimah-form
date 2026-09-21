import type { InsightsSummary } from "@dimah-form/insights";
import { parseScoringFieldMeta } from "@dimah-form/scoring";

import { scoreLabel, scoreShare } from "@/lib/format";
import { cn } from "@/lib/utils";

export function insightsWithoutScoredFields(
  summary: InsightsSummary,
  fields: readonly { id: string; meta?: unknown }[],
): InsightsSummary {
  const scored = new Set(
    fields
      .filter((field) => parseScoringFieldMeta(field.meta))
      .map((field) => field.id),
  );
  if (scored.size === 0) return summary;
  return {
    ...summary,
    fields: summary.fields.filter((field) => !scored.has(field.id)),
  };
}

function pctLabel(pct: number) {
  return `${Math.round(pct * 100)}%`;
}

function CountBar({
  label,
  n,
  total,
  pct,
}: {
  label: string;
  n: number;
  total?: number;
  pct?: number;
}) {
  const share = pct ?? (total != null && total > 0 ? n / total : 0);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 text-muted-foreground tabular-nums">
          {n}
          {pct != null ? ` · ${pctLabel(pct)}` : ""}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/70 transition-[width] duration-300"
          style={{ width: `${Math.round(share * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function StatusCounts({ summary }: { summary: InsightsSummary }) {
  const items = [
    { label: "Draft", n: summary.byStatus.draft },
    { label: "Submitted", n: summary.byStatus.submitted },
    { label: "Abandoned", n: summary.byStatus.abandoned },
  ];
  const rate =
    summary.completion.rate == null ? null : pctLabel(summary.completion.rate);
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="text-2xl font-medium tracking-tight tabular-nums">
              {item.n}
            </dd>
          </div>
        ))}
      </dl>
      {rate ? (
        <p className="text-sm text-muted-foreground">
          {summary.completion.complete}/{summary.completion.submitted} submitted
          complete ({rate})
        </p>
      ) : null}
    </div>
  );
}

export function InsightsPanel({
  summary,
  className,
}: {
  summary: InsightsSummary;
  className?: string;
}) {
  const fields = summary.fields.filter(
    (field) =>
      (field.values?.length ?? 0) > 0 ||
      field.numeric != null ||
      field.dates != null,
  );
  const scores = summary.scores?.variables ?? [];
  const series = summary.series?.points ?? [];

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      {series.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Submitted by day</h2>
          <div className="flex flex-col gap-3">
            {series.map((point) => (
              <CountBar
                key={point.t}
                label={point.t}
                n={point.n}
                total={summary.completion.submitted || summary.total}
              />
            ))}
          </div>
        </section>
      ) : null}
      {scores.map((variable) => {
        const bands = variable.bands ?? [];
        const meanLabel = scoreLabel(
          variable.mean == null ? null : Number(variable.mean.toFixed(1)),
          variable.max,
        );
        return (
          <section key={variable.id} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-medium">
                {variable.label ?? variable.id}
              </h2>
              <p className="text-sm text-muted-foreground">
                {meanLabel
                  ? `Mean ${meanLabel} · ${variable.complete} complete`
                  : `${variable.complete} complete`}
              </p>
            </div>
            {variable.max != null && variable.mean != null ? (
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{
                    width: `${Math.round(scoreShare(variable.mean, variable.max) * 100)}%`,
                  }}
                />
              </div>
            ) : null}
            {bands.length > 0 ? (
              <div className="flex flex-col gap-3">
                {bands.map((band) => (
                  <CountBar
                    key={band.label}
                    label={band.label}
                    n={band.n}
                    pct={band.pct}
                  />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
      {fields.map((field) => {
        const answered = field.n - field.unanswered;
        return (
          <section key={field.id} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-medium">{field.label}</h2>
              <p className="text-sm text-muted-foreground">
                {answered} answered
                {field.unanswered > 0 ? ` · ${field.unanswered} skipped` : ""}
                {field.hidden > 0 ? ` · ${field.hidden} hidden` : ""}
              </p>
            </div>
            {field.numeric ? (
              <p className="text-sm text-muted-foreground tabular-nums">
                Mean {Number(field.numeric.mean.toFixed(1))} · min{" "}
                {field.numeric.min} · max {field.numeric.max}
              </p>
            ) : null}
            {field.dates ? (
              <p className="text-sm text-muted-foreground">
                {field.dates.min} – {field.dates.max}
              </p>
            ) : null}
            {(field.values?.length ?? 0) > 0 ? (
              <div className="flex flex-col gap-3">
                {(field.values ?? []).map((item) => (
                  <CountBar
                    key={item.value}
                    label={item.label ?? item.value}
                    n={item.n}
                    pct={item.pct}
                  />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
